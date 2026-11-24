import { and, eq, gt } from "drizzle-orm";
import { getDb, getEnv } from "@/lib/db";
import { emailCodes, users } from "@/lib/db/schema";
import { sendCodeSchema } from "@/lib/auth/validation";
import { jsonError, validOrigin } from "@/lib/auth/http";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import { hitLimit } from "@/lib/auth/rate-limit";
import { sendVerificationCode } from "@/lib/auth/brevo";

export async function POST(request: Request) {
  if (!validOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const parsed = sendCodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email address.");
  const env = await getEnv(), email = parsed.data.email, ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const [ipLimit, emailLimit, cooldown] = await Promise.all([
    hitLimit(env.RATE_LIMITS, `send-ip:${ip}`, 20, 3600),
    hitLimit(env.RATE_LIMITS, `send-email:${email}`, 5, 3600),
    hitLimit(env.RATE_LIMITS, `send-cooldown:${email}`, 1, 30),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed || !cooldown.allowed) return Response.json({ error: "Please wait before requesting another code." }, { status: 429, headers: { "Retry-After": String(Math.max(cooldown.retryAfter, emailLimit.retryAfter)), "Cache-Control": "no-store" } });
  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return jsonError("An account with this email already exists.", 409);
  const [prior] = await db.select({ createdAt: emailCodes.createdAt, expiresAt: emailCodes.expiresAt }).from(emailCodes).where(and(eq(emailCodes.email, email), gt(emailCodes.expiresAt, new Date()))).limit(1);
  if (prior && Date.now() - prior.createdAt.getTime() < 30_000) return Response.json({ error: "Please wait before requesting another code.", retryAfter: Math.ceil((30_000 - (Date.now() - prior.createdAt.getTime())) / 1000) }, { status: 429, headers: { "Cache-Control": "no-store" } });
  const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); const code = String(bytes[0] % 1_000_000).padStart(6, "0");
  const codeHash = await sha256(`${email}:${code}`), createdAt = new Date(), expiresAt = new Date(createdAt.getTime() + 10 * 60_000);
  await db.insert(emailCodes).values({ email, codeHash, attempts: 0, createdAt, expiresAt }).onConflictDoUpdate({ target: emailCodes.email, set: { codeHash, attempts: 0, createdAt, expiresAt } });
  try { await sendVerificationCode(env, email, code); }
  catch { await db.delete(emailCodes).where(eq(emailCodes.email, email)); return jsonError("We could not send your code. Please try again later.", 502); }
  return Response.json({ message: "Code sent. Check your inbox.", retryAfter: 30 }, { headers: { "Cache-Control": "no-store" } });
}

