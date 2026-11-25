"use client";
import { FormEvent, useState } from "react";

const games = ["CS2", "Dota 2", "Deadlock", "Valorant", "Fortnite", "Minecraft", "Other"];
const ranks = ["Unranked", "Beginner", "Intermediate", "Advanced", "Prefer not to say"];
const vibes = ["Mic Required", "Chill / No Toxicity", "Evening Sessions", "Play Regularly", "Voice Chat", "New Player Friendly"];
const languages = ["English", "Russian", "German", "Spanish", "Turkish", "French", "Polish", "Ukrainian"];
const emptyProfile = { displayName: "", game: "CS2", rank: "Unranked", seeking: "Chill / Casual", frame: "Default", vibe: ["Chill / No Toxicity"], languages: ["English"], platform: "Discord", contactHandle: "", about: "" };
type Profile = typeof emptyProfile;
type SavedProfile = Omit<Profile, "game" | "rank" | "seeking" | "frame" | "platform"> & { game: string; rank: string; seeking: string; frame: string; contactPlatform: string };

function SelectField({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: string[]; id: string }) {
  return <div className="profile-field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={e => onChange(e.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></div>;
}
function TagChoices({ title, options, selected, onChange, hint }: { title: string; options: string[]; selected: string[]; onChange: (next: string[]) => void; hint?: string }) {
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  return <fieldset className="profile-field tag-field"><legend>{title}{hint && <span className="legend-hint"> {hint}</span>}</legend><div className="tag-list">{options.map(option => <button key={option} type="button" className={`tag ${selected.includes(option) ? "selected" : ""}`} aria-pressed={selected.includes(option)} onClick={() => toggle(option)}>{option}</button>)}</div></fieldset>;
}

export function ParticipantProfileForm({ profile }: { profile: SavedProfile | null }) {
  const [form, setForm] = useState<Profile>({ ...emptyProfile, ...profile, platform: profile?.contactPlatform ?? emptyProfile.platform, vibe: profile?.vibe ?? emptyProfile.vibe, languages: profile?.languages ?? emptyProfile.languages });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(form) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save your profile. Try again.");
      setMessage("Profile saved. Your details are private to your account for now.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your profile. Try again."); }
    finally { setBusy(false); }
  };

  return <form className="profile-card" onSubmit={submit}>
    <div className="profile-intro"><div className="eyebrow small">NEW LFT PROFILE</div><h2>Who are you looking for?</h2><p>Share a few details so your next squad can find you.</p></div>
    <div className="profile-grid">
      <div className="profile-field"><label htmlFor="display-name">Player name</label><input id="display-name" required minLength={2} maxLength={32} value={form.displayName} onChange={e => update("displayName", e.target.value)} placeholder="How teammates can call you" autoComplete="nickname" /></div>
      <SelectField id="game" label="Game" value={form.game} onChange={v => update("game", v)} options={games}/>
      <SelectField id="rank" label="Your rank" value={form.rank} onChange={v => update("rank", v)} options={ranks}/>
      <SelectField id="seeking" label="What are you looking to play?" value={form.seeking} onChange={v => update("seeking", v)} options={["Chill / Casual", "Competitive", "Practice", "Just to hang out"]}/>
      <div className="profile-field"><label htmlFor="frame">Card frame</label><select id="frame" value={form.frame} onChange={e => update("frame", e.target.value)}><option>Default</option><option disabled>Supporter Green — supporter only</option><option disabled>Supporter Gold — supporter only</option></select></div>
      <p className="field-note frame-note">Custom frames are for supporters. Support LFTarena to unlock them.</p>
      <TagChoices title="Your vibe" options={vibes} selected={form.vibe} onChange={v => update("vibe", v)}/>
      <TagChoices title="Languages you speak" hint="Choose at least one" options={languages} selected={form.languages} onChange={v => update("languages", v)}/>
      <SelectField id="platform" label="Contact platform" value={form.platform} onChange={v => update("platform", v)} options={["Discord", "Steam", "In-game chat", "Other"]}/>
      <div className="profile-field"><label htmlFor="contact-handle">Contact name <span className="optional">(optional)</span></label><input id="contact-handle" maxLength={64} value={form.contactHandle} onChange={e => update("contactHandle", e.target.value)} placeholder="Your username on that platform" autoComplete="off"/><p className="field-note">Only you can see these profile details right now.</p></div>
      <div className="profile-field full-width"><label htmlFor="about">A little about you <span className="optional">(optional)</span></label><textarea id="about" maxLength={240} rows={3} value={form.about} onChange={e => update("about", e.target.value)} placeholder="Your usual play times or what makes a good teammate…"/><p className="field-note">Avoid sharing your real name, phone number, school, or where you live.</p></div>
    </div>
    <div className="profile-actions"><p className="form-status" role="status" aria-live="polite">{message}</p><button className="primary save-profile" type="submit" disabled={busy}>{busy ? "Saving…" : profile ? "Save changes" : "Create profile"}</button></div>
  </form>;
}
