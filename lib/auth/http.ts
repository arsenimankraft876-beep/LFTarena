import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { randomToken, sha256 } from "./crypto";

export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } }); }
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
export async function newSession(userId: string) {
  const token = randomToken(32), tokenHash = await sha256(token), expiresAt = new Date(Date.now() + 30 * 86400_000);
  const db = await getDb();
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
  (await cookies()).set("lftarena_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}
export async function currentUser() {
  const token = (await cookies()).get("lftarena_session")?.value;
  if (!token) return null;
  const db = await getDb(), tokenHash = await sha256(token);
  const [row] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))).limit(1);
  return row?.user ?? null;
}

