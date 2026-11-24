import { cookies } from "next/headers";
import { Google, generateCodeVerifier, generateState } from "arctic";
import { getEnv } from "@/lib/db";
import { hitLimit } from "@/lib/auth/rate-limit";
import { jsonError } from "@/lib/auth/http";

export async function GET(request: Request) {
  const env = await getEnv(), state = generateState(), verifier = generateCodeVerifier();
  if (!(await hitLimit(env.RATE_LIMITS, `google-start-ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`, 20, 3600)).allowed) return jsonError("Too many attempts. Please try again later.", 429);
  const redirectUri = `${env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`;
  const google = new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
  const url = google.createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
  const jar = await cookies(), secure = env.APP_URL.startsWith("https://");
  jar.set("google_oauth_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/api/auth/google/callback", maxAge: 600 });
  jar.set("google_oauth_verifier", verifier, { httpOnly: true, secure, sameSite: "lax", path: "/api/auth/google/callback", maxAge: 600 });
  return Response.redirect(url);
}

