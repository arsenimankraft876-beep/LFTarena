import { currentUser } from "@/lib/auth/http";
import { getEnv } from "@/lib/db";
import { hitLimit } from "@/lib/auth/rate-limit";
export async function GET(request: Request) {
  const env = await getEnv();
  if (!(await hitLimit(env.RATE_LIMITS, `me-ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`, 120, 3600)).allowed) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  const user = await currentUser();
  return Response.json({ user: user ? { email: user.email } : null }, { headers: { "Cache-Control": "no-store" } });
}

