import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { participantProfiles, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const games = ["CS2", "Dota 2", "Deadlock", "Valorant", "Fortnite", "Minecraft", "Other"];
const vibes = ["Mic Required", "Chill / No Toxicity", "Evening Sessions", "Play Regularly", "Voice Chat", "New Player Friendly"];

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ q?: string; game?: string; tag?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase();
  const gameFilter = games.includes(params.game ?? "") ? params.game : "";
  const tagFilter = vibes.includes(params.tag ?? "") ? params.tag : "";
  const db = await getDb();
  const allProfiles = await db.select({ id: participantProfiles.id, displayName: participantProfiles.displayName, games: participantProfiles.games, game: participantProfiles.game, rank: participantProfiles.rank, seeking: participantProfiles.seeking, vibe: participantProfiles.vibe, languages: participantProfiles.languages, avatarUrl: users.avatarUrl, createdAt: participantProfiles.createdAt }).from(participantProfiles).innerJoin(users, eq(participantProfiles.userId, users.id)).orderBy(desc(participantProfiles.createdAt));
  const filtered = allProfiles.filter(profile => {
    const profileGames = profile.games?.length ? profile.games : [profile.game];
    return (!query || profile.displayName.toLocaleLowerCase().includes(query)) && (!gameFilter || profileGames.includes(gameFilter)) && (!tagFilter || profile.vibe.includes(tagFilter));
  });

  return <main className="directory-shell">
    <header className="directory-header"><Link className="brand" href="/"><i/>LFTarena</Link><Link className="back-link" href="/">← Home</Link></header>
    <section className="directory-heading"><div className="eyebrow"><span className="status-dot"/> LFT COMMUNITY</div><h1>Find your next teammates.</h1><p>Browse player profiles and find people who match your games, vibe, and languages.</p></section>
    <form action="/players" className="directory-filters"><label className="search-input"><span aria-hidden="true">⌕</span><input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Search by player name…" aria-label="Search by player name"/></label><select name="game" defaultValue={gameFilter} aria-label="Filter by game"><option value="">All games</option>{games.map(game=><option key={game}>{game}</option>)}</select><select name="tag" defaultValue={tagFilter} aria-label="Filter by vibe"><option value="">Any vibe</option>{vibes.map(tag=><option key={tag}>{tag}</option>)}</select><button className="primary" type="submit">Search</button>{(query || gameFilter || tagFilter) && <Link className="clear-filters" href="/players">Clear filters</Link>}</form>
    <div className="directory-results"><div className="results-heading"><div><span className="eyebrow"><span className="status-dot"/> PLAYER PROFILES</span><h2>{filtered.length} {filtered.length === 1 ? "player" : "players"} to discover</h2></div><span className="results-total">{allProfiles.length} total profiles</span></div>
      {filtered.length ? <div className="player-grid">{filtered.map(profile => { const profileGames = profile.games?.length ? profile.games : [profile.game]; return <Link className="directory-card" href={`/players/${profile.id}`} key={profile.id}><div className="directory-card-top"><AvatarImage className="directory-avatar" src={profile.avatarUrl} name={profile.displayName}/><div className="directory-name"><strong>{profile.displayName}</strong><span>{profileGames.join(" · ")} · {profile.rank}</span></div><i className="status-dot"/></div><div className="directory-game-tags">{profileGames.map(game=><span className="tag selected" key={game}>{game}</span>)}</div><p>{profile.seeking}</p><div className="tag-list">{profile.vibe.slice(0,3).map(tag=><span className="tag" key={tag}>{tag}</span>)}</div><div className="directory-languages">{profile.languages.join(" · ")}</div></Link>; })}</div> : <div className="directory-empty"><span className="empty-icon">⌕</span><h3>No profiles found</h3><p>Try a different name, game, or vibe filter.</p><Link className="primary" href="/">Back to home</Link></div>}
    </div>
    <p className="privacy-note directory-privacy">Profiles show player names and game preferences only. Emails and contact names stay private.</p>
  </main>;
}

