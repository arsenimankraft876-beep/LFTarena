import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { participantProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const [profile] = await db.select({ id: participantProfiles.id, displayName: participantProfiles.displayName, game: participantProfiles.game, rank: participantProfiles.rank, seeking: participantProfiles.seeking, frame: participantProfiles.frame, vibe: participantProfiles.vibe, languages: participantProfiles.languages, platform: participantProfiles.contactPlatform, about: participantProfiles.about }).from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
  if (!profile) notFound();
  return <main className="public-profile-shell"><header className="app-header"><Link className="brand" href="/"><i/>LFTarena</Link><Link href="/" className="back-link">← Back to home</Link></header><article className="public-profile-card">
    <div className="public-avatar">{profile.displayName.trim().slice(0, 1).toUpperCase()}</div><div className="eyebrow"><span className="status-dot"/> LFT PLAYER</div><h1>{profile.displayName}</h1><p className="profile-subtitle">{profile.game} <span>·</span> {profile.rank}</p><div className="public-divider"/>
    <div className="public-facts"><div><span>Looking to play</span><strong>{profile.seeking}</strong></div><div><span>Contact platform</span><strong>{profile.platform}</strong></div></div>
    {profile.about && <section className="public-about"><h2>About</h2><p>{profile.about}</p></section>}
    <section className="public-about"><h2>Vibe</h2><div className="tag-list">{profile.vibe.map(tag => <span className="tag selected" key={tag}>{tag}</span>)}</div></section>
    <section className="public-about"><h2>Languages</h2><div className="tag-list">{profile.languages.map(language => <span className="tag" key={language}>{language}</span>)}</div></section>
    <p className="privacy-note">Contact names and account emails are private. Connect through the platform once you know each other.</p><Link className="primary profile-home-button" href="/">Find your squad</Link>
  </article></main>;
}
