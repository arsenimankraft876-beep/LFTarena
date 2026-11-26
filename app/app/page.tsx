import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth/http";
import { getDb } from "@/lib/db";
import { participantProfiles } from "@/lib/db/schema";
import { SignOutButton } from "@/components/SignOutButton";
import { AvatarImage } from "@/components/AvatarImage";
import { ParticipantProfileForm } from "@/components/ParticipantProfileForm";
export default async function AppHome() {
  const user = await currentUser();
  if (!user) redirect("/");
  const db = await getDb();
  const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.userId, user.id)).limit(1);
  return <main className="app-shell"><header className="app-header"><a className="brand" href="/"><i/>LFTarena</a><div className="account-menu"><AvatarImage className="account-avatar" src={user.avatarUrl} name={user.email}/><span>{user.email}</span><SignOutButton/></div></header><section className="profile-page"><div className="eyebrow"><span className="eyebrow-icon">✳</span> PLAYER PROFILE</div><h1>Find your next squad</h1><p className="lead">Tell teammates what you play and when you like to play.</p><ParticipantProfileForm profile={profile ?? null}/></section></main>;
}

