import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Google } from "arctic";
import { getDb, getEnv } from "@/lib/db";
import { oauthAccounts, users } from "@/lib/db/schema";
import { jsonError, newSession } from "@/lib/auth/http";
import { hitLimit } from "@/lib/auth/rate-limit";

export async function GET(request: Request) {
  const url = new URL(request.url), code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const jar = await cookies(), savedState = jar.get("google_oauth_state")?.value, verifier = jar.get("google_oauth_verifier")?.value;
  jar.delete("google_oauth_state"); jar.delete("google_oauth_verifier");
  if (!code || !state || !savedState || !verifier || state !== savedState) return jsonError("Google sign-in could not be verified. Please try again.", 400);
  const env = await getEnv();
  if (!(await hitLimit(env.RATE_LIMITS, `google-ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`, 20, 3600)).allowed) return jsonError("Too many attempts. Please try again later.", 429);
  const redirectUri = `${env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`, google = new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
  try {
    const tokens = await google.validateAuthorizationCode(code, verifier);
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.accessToken()}` } });
    if (!response.ok) return jsonError("Google sign-in failed. Please try again.", 400);
    const profile = await response.json() as { sub?: string; email?: string; email_verified?: boolean };
    if (!profile.sub || !profile.email || profile.email_verified !== true) return jsonError("Google did not provide a verified email address.", 400);
    const email = profile.email.trim().toLowerCase(), db = await getDb();
    const [linked] = await db.select({ userId: oauthAccounts.userId }).from(oauthAccounts).where(and(eq(oauthAccounts.provider, "google"), eq(oauthAccounts.providerAccountId, profile.sub))).limit(1);
    let userId = linked?.userId;
    if (!userId) {
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) userId = existing.id;
      else {
        const [created] = await db.insert(users).values({ email, emailVerified: true }).returning({ id: users.id });
        userId = created.id;
      }
      await db.insert(oauthAccounts).values({ userId, provider: "google", providerAccountId: profile.sub }).onConflictDoNothing();
    }
    await newSession(userId);
    return Response.redirect(new URL("/app", env.APP_URL));
  } catch {
    return jsonError("Google sign-in failed. Please try again.", 400);
  }
}

