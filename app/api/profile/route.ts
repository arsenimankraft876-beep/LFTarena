import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { participantProfiles } from "@/lib/db/schema";
import { currentUser, jsonError, validOrigin } from "@/lib/auth/http";

const options = {
  game: ["CS2", "Dota 2", "Deadlock", "Valorant", "Fortnite", "Minecraft", "Other"],
  rank: ["Unranked", "Beginner", "Intermediate", "Advanced", "Prefer not to say"],
  seeking: ["Chill / Casual", "Competitive", "Practice", "Just to hang out"],
  frame: ["Default", "Supporter Green", "Supporter Gold"],
  vibe: ["Mic Required", "Chill / No Toxicity", "Evening Sessions", "Play Regularly", "Voice Chat", "New Player Friendly"],
  languages: ["English", "Russian", "German", "Spanish", "Turkish", "French", "Polish", "Ukrainian"],
  platform: ["Discord", "Steam", "In-game chat", "Other"],
} as const;

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  game: z.enum(options.game),
  rank: z.enum(options.rank),
  seeking: z.enum(options.seeking),
  frame: z.enum(options.frame),
  vibe: z.array(z.enum(options.vibe)).min(1).max(6),
  languages: z.array(z.enum(options.languages)).min(1).max(8),
  platform: z.enum(options.platform),
  contactHandle: z.string().trim().max(64).default(""),
  about: z.string().trim().max(240).default(""),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to view your profile.", 401);
  const db = await getDb();
  const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.userId, user.id)).limit(1);
  return Response.json({ profile: profile ?? null }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!validOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const user = await currentUser();
  if (!user) return jsonError("Sign in to save your profile.", 401);
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the required fields, tags, and character limits.");
  const { frame, platform, ...data } = parsed.data;
  // Supporter frames are displayed as locked options; only the default is currently available.
  const savedFrame = frame === "Default" ? frame : "Default";
  const db = await getDb();
  const [profile] = await db.insert(participantProfiles).values({ userId: user.id, ...data, contactPlatform: platform, frame: savedFrame, updatedAt: new Date() }).onConflictDoUpdate({
    target: participantProfiles.userId,
    set: { ...data, contactPlatform: platform, frame: savedFrame, updatedAt: new Date() },
  }).returning({ id: participantProfiles.id });
  return Response.json({ saved: true, id: profile.id }, { headers: { "Cache-Control": "no-store" } });
}
