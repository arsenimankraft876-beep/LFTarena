import { eq } from "drizzle-orm";
import { getDb, getEnv } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signInSchema } from "@/lib/auth/validation";
import { jsonError, newSession, validOrigin } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/crypto";
import { hitLimit } from "@/lib/auth/rate-limit";

const dummyHash = "pbkdf2-sha256$310000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export async function POST(request: Request) {
  if (!validOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Wrong email or password", 401);
  const env = await getEnv(), { email, password } = parsed.data, ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const [byIp, byEmail] = await Promise.all([hitLimit(env.RATE_LIMITS, `signin-ip:${ip}`, 20, 900), hitLimit(env.RATE_LIMITS, `signin-email:${email}`, 8, 900)]);
  if (!byIp.allowed || !byEmail.allowed) return jsonError("Too many attempts. Please try again later.", 429);
  const db = await getDb(), [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  if (!user?.passwordHash || !valid) return jsonError("Wrong email or password", 401);
  await newSession(user.id);
  return Response.json({ user: { email: user.email } }, { headers: { "Cache-Control": "no-store" } });
}

