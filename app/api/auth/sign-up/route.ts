import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, getEnv } from "@/lib/db";
import { emailCodes, users } from "@/lib/db/schema";
import { signUpSchema } from "@/lib/auth/validation";
import { jsonError, newSession, validOrigin } from "@/lib/auth/http";
import { constantTimeEqual, hashPassword, sha256 } from "@/lib/auth/crypto";
import { hitLimit } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  if (!validOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const parsed = signUpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email, an 8-character password, and the 6-digit code.");
  const env = await getEnv(), { email, password, code } = parsed.data, ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await hitLimit(env.RATE_LIMITS, `signup-ip:${ip}`, 10, 3600)).allowed || !(await hitLimit(env.RATE_LIMITS, `signup-email:${email}`, 5, 3600)).allowed) return jsonError("Too many attempts. Please try again later.", 429);
  const db = await getDb(), [verification] = await db.select().from(emailCodes).where(eq(emailCodes.email, email)).limit(1);
  if (!verification || verification.expiresAt <= new Date() || verification.attempts >= 5) {
    if (verification && (verification.expiresAt <= new Date() || verification.attempts >= 5)) await db.delete(emailCodes).where(eq(emailCodes.id, verification.id));
    return jsonError("The code is invalid or expired. Request a new code.", 400);
  }
  const matches = await constantTimeEqual(verification.codeHash, await sha256(`${email}:${code}`));
  if (!matches) {
    const attempts = verification.attempts + 1;
    if (attempts >= 5) await db.delete(emailCodes).where(eq(emailCodes.id, verification.id));
    else await db.update(emailCodes).set({ attempts }).where(eq(emailCodes.id, verification.id));
    return jsonError("The code is invalid or expired. Request a new code.", 400);
  }
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return jsonError("An account with this email already exists.", 409);
  const [user] = await db.insert(users).values({ email, passwordHash: await hashPassword(password), emailVerified: true }).returning({ id: users.id, email: users.email });
  await db.delete(emailCodes).where(eq(emailCodes.id, verification.id));
  await newSession(user.id);
  return Response.json({ user: { email: user.email } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

