import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { jsonError, validOrigin } from "@/lib/auth/http";
import { sha256 } from "@/lib/auth/crypto";
import { getEnv } from "@/lib/db";
import { hitLimit } from "@/lib/auth/rate-limit";
export async function POST(request: Request) {
  if (!validOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const env = await getEnv();
  if (!(await hitLimit(env.RATE_LIMITS, `signout-ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`, 60, 3600)).allowed) return jsonError("Too many requests. Please try again later.", 429);
  const jar = await cookies(), token = jar.get("lftarena_session")?.value;
  if (token) await (await getDb()).delete(sessions).where(eq(sessions.tokenHash, await sha256(token)));
  jar.set("lftarena_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

