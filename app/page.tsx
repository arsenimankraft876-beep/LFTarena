import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { AuthCard } from "@/components/AuthCard";
import { currentUser } from "@/lib/auth/http";
import { getDb } from "@/lib/db";
import { participantProfiles, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDb();
  const [recentProfiles, [{ total }], user] = await Promise.all([
    db.select({ id: participantProfiles.id, displayName: participantProfiles.displayName, games: participantProfiles.games, game: participantProfiles.game, rank: participantProfiles.rank, avatarUrl: users.avatarUrl }).from(participantProfiles).innerJoin(users, eq(participantProfiles.userId, users.id)).orderBy(desc(participantProfiles.createdAt)).limit(10),
    db.select({ total: count() }).from(participantProfiles),
    currentUser(),
  ]);
  return <main className="home-shell">
    <div className="home-top"><a className="brand" href="/"><i/>LFTarena</a><a className="top-link" href={user ? "/app" : "/players"}>{user ? "OPEN MY PROFILE" : total ? `BROWSE ${total} PLAYER PROFILES` : "YOUR NEXT SQUAD STARTS HERE"}<span className="status-dot"/></a></div>
    <div className="home-hero">
      <section className="hero-copy"><div className="eyebrow"><span className="status-dot"/> DON'T SOLO QUEUE</div><h1>Good games<br/>start with a <em>great squad.</em></h1><p className="lead">Find people who match your vibe. Less toxicity, less searching, more great games together.</p>
        <div className="stats"><div><strong>7</strong><span>games to squad up in</span></div><div><strong>8</strong><span>languages to connect in</span></div><div><strong>{total}</strong><span>player profiles</span></div></div>
      </section>
      <section className="home-scene" aria-label="Featured player profiles">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="sun-rays"/><div className="sun-core"><span>LFT</span><b>GG</b></div>
        {recentProfiles.slice(0, 3).map((profile, index) => <Link key={profile.id} className={`player-chip player-chip-${index + 1}`} href={`/players/${profile.id}`} aria-label={`View ${profile.displayName}'s profile`}><span className="player-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt=""/> : profile.displayName.trim().slice(0, 1).toUpperCase()}</span><span className="player-label"><strong>{profile.displayName}</strong><small>{(profile.games?.length ? profile.games : [profile.game]).join(", ")} · {profile.rank}</small></span><i className="status-dot"/></Link>)}
        {!recentProfiles.length && <div className="empty-orbit"><span>Be the first<br/>to join the squad</span></div>}
      </section>
    </div>
    <Link className="home-footer people-link" href="/players"><div><div className="avatar-stack">{recentProfiles.length ? recentProfiles.slice(0, 3).map(profile => <span className="stack-avatar" key={profile.id}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt=""/> : profile.displayName.trim().slice(0,1).toUpperCase()}</span>) : <span className="stack-avatar">✳</span>}</div><div><strong>Your people are here</strong><span>{total ? `${total} player ${total === 1 ? "profile" : "profiles"} to discover` : "Be the first to create a profile"}</span></div></div><span className="footer-note"><i className="status-dot"/> Browse all profiles <b>→</b></span></Link>
    <section className="directory-search" id="find-players"><div className="eyebrow"><span className="status-dot"/> FIND YOUR TEAMMATES</div><h2>Find players who fit your game.</h2><p>Search by player name, game, or vibe to discover your next teammates.</p><form action="/players" className="search-form"><label className="search-input"><span aria-hidden="true">⌕</span><input name="q" type="search" placeholder="Search player name…" aria-label="Search player name"/></label><select name="game" aria-label="Game"><option value="">All games</option>{["CS2","Dota 2","Deadlock","Valorant","Fortnite","Minecraft","Other"].map(game=><option key={game}>{game}</option>)}</select><select name="tag" aria-label="Vibe tag"><option value="">Any vibe</option>{["Mic Required","Chill / No Toxicity","Evening Sessions","Play Regularly","Voice Chat","New Player Friendly"].map(tag=><option key={tag}>{tag}</option>)}</select><button className="primary" type="submit">Search profiles</button></form><div className="recent-profiles"><div className="recent-heading"><h3>Recent player profiles</h3><span>{recentProfiles.length} {recentProfiles.length === 1 ? "profile" : "profiles"}</span></div>{recentProfiles.length ? <div className="recent-profile-list">{recentProfiles.map(profile => <Link className="recent-profile-card" key={profile.id} href={`/players/${profile.id}`}><span className="recent-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt=""/> : profile.displayName.trim().slice(0,1).toUpperCase()}</span><span className="recent-profile-info"><strong>{profile.displayName}</strong><small>{(profile.games?.length ? profile.games : [profile.game]).join(" · ")} <i>·</i> {profile.rank}</small></span><span className="recent-arrow" aria-hidden="true">↗</span></Link>)}</div> : <div className="recent-empty">No player profiles yet. Create yours to be the first on the list.</div>}</div></section>
    <div id="join" className="join-panel"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>{user ? "Your next match starts with your profile." : "Find your kind of teammate."}</h2></div>{user ? <section className="card signed-in-cta"><p>You're signed in. Create your player card or update your game, vibe and languages.</p><a className="primary" href="/app">Create or edit my profile</a></section> : <AuthCard/>}</div>
  </main>;
}
