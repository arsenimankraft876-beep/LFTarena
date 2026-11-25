import Link from "next/link";
import { count, eq, sql } from "drizzle-orm";
import { AuthCard } from "@/components/AuthCard";
import { getDb } from "@/lib/db";
import { participantProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDb();
  const [profiles, [{ total }]] = await Promise.all([
    db.select({ id: participantProfiles.id, displayName: participantProfiles.displayName, game: participantProfiles.game, rank: participantProfiles.rank }).from(participantProfiles).orderBy(sql`random()`).limit(3),
    db.select({ total: count() }).from(participantProfiles),
  ]);
  return <main className="home-shell">
    <div className="home-top"><a className="brand" href="/"><i/>LFTarena</a><a className="top-link" href="#join">{total ? `${total} PLAYER PROFILES` : "YOUR NEXT SQUAD STARTS HERE"}<span className="status-dot"/></a></div>
    <div className="home-hero">
      <section className="hero-copy"><div className="eyebrow"><span className="status-dot"/> DON'T SOLO QUEUE</div><h1>Good games<br/>start with a <em>great squad.</em></h1><p className="lead">Find people who match your vibe. Less toxicity, less searching, more great games together.</p>
        <div className="stats"><div><strong>7</strong><span>games to squad up in</span></div><div><strong>8</strong><span>languages to connect in</span></div><div><strong>{total}</strong><span>player profiles</span></div></div>
      </section>
      <section className="home-scene" aria-label="Featured player profiles">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="sun-rays"/><div className="sun-core"><span>LFT</span><b>GG</b></div>
        {profiles.map((profile, index) => <Link key={profile.id} className={`player-chip player-chip-${index + 1}`} href={`/players/${profile.id}`} aria-label={`View ${profile.displayName}'s profile`}><span className="player-avatar">{profile.displayName.trim().slice(0, 1).toUpperCase()}</span><span className="player-label"><strong>{profile.displayName}</strong><small>{profile.game} · {profile.rank}</small></span><i className="status-dot"/></Link>)}
        {!profiles.length && <div className="empty-orbit"><span>Be the first<br/>to join the squad</span></div>}
      </section>
    </div>
    <footer className="home-footer"><div><div className="avatar-stack" aria-hidden="true"><i>✳</i><i>✳</i><i>✳</i></div><div><strong>Your people are here</strong><span>{total ? `${total} player ${total === 1 ? "profile" : "profiles"} to discover` : "Create a profile and start your LFT journey"}</span></div></div><a className="footer-note" href="#join"><i className="status-dot"/> Good games, better company</a></footer>
    <div id="join" className="join-panel"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Find your kind of teammate.</h2></div><AuthCard/></div>
  </main>;
}
