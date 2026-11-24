"use client";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";

type Message = { text: string; kind: "" | "err" | "ok" };
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
async function post(path: string, body?: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}), credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "Something went wrong. Please try again."), { retryAfter: data.retryAfter ?? (Number(response.headers.get("retry-after")) || 0) });
  return data as { message?: string; retryAfter?: number };
}
function GoogleMark() { return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.2 7-10.3 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>; }
export function AuthCard() {
  const [signup, setSignup] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState<Message>({ text: "", kind: "" });
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [code, setCode] = useState(""), [codeHint, setCodeHint] = useState("We will send the code to your email."), [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null), upTab = useRef<HTMLButtonElement>(null), inTab = useRef<HTMLButtonElement>(null);
  const say = (text: string, kind: Message["kind"] = "") => setMessage({ text, kind });
  const tab = (value: boolean) => { setSignup(value); say(""); };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const next = !signup; tab(next); (next ? upTab : inTab).current?.focus(); } };
  const sendCode = async () => {
    if (!validEmail(email.trim())) return say("Enter a valid email first.", "err");
    setBusy(true); say("");
    try {
      const result = await post("/api/auth/send-code", { email: email.trim() });
      setCodeHint(`Code sent to ${email.trim()}`); say(result.message ?? "Code sent. Check your inbox.", "ok"); startCountdown(result.retryAfter ?? 30);
    } catch (err) { const error = err as Error & { retryAfter?: number }; say(error.message, "err"); if (error.retryAfter) startCountdown(error.retryAfter); }
    finally { setBusy(false); }
  };
  const startCountdown = (seconds: number) => {
    if (timer.current) clearInterval(timer.current);
    let n = Math.max(1, seconds); setRemaining(n);
    timer.current = setInterval(() => { n -= 1; setRemaining(n); if (n <= 0 && timer.current) { clearInterval(timer.current); timer.current = null; } }, 1000);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); say("");
    if (!validEmail(email.trim())) return say("Enter a valid email.", "err");
    if (signup && password.length < 8) return say("Password must be at least 8 characters.", "err");
    if (signup && !/^\d{6}$/.test(code.trim())) return say("Enter the 6-digit code from your email.", "err");
    if (!signup && !password) return say("Enter your password.", "err");
    setBusy(true);
    try { await post(`/api/auth/${signup ? "sign-up" : "sign-in"}`, signup ? { email: email.trim(), password, code: code.trim() } : { email: email.trim(), password }); window.location.assign("/app"); }
    catch (err) { say((err as Error).message, "err"); }
    finally { setBusy(false); }
  };
  return <section className="card" aria-label="Account">
    <div className="tabs" role="tablist" aria-label="Account access">
      <button ref={upTab} role="tab" id="t-up" aria-selected={signup} aria-controls="p-up" tabIndex={signup ? 0 : -1} onClick={() => tab(true)} onKeyDown={onTabKey}>Sign up</button>
      <button ref={inTab} role="tab" id="t-in" aria-selected={!signup} aria-controls="p-in" tabIndex={!signup ? 0 : -1} onClick={() => tab(false)} onKeyDown={onTabKey}>Sign in</button>
    </div>
    <div id={signup ? "p-up" : "p-in"} role="tabpanel" aria-labelledby={signup ? "t-up" : "t-in"}>
      <button className="google" type="button" disabled={busy} onClick={() => window.location.assign("/api/auth/google")}><GoogleMark/>Continue with Google</button>
      <div className="or">or use email</div>
      <form onSubmit={submit} noValidate>
        <div className="f"><label htmlFor={signup ? "u-email" : "i-email"}>Email</label><input id={signup ? "u-email" : "i-email"} type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)}/></div>
        <div className="f"><label htmlFor={signup ? "u-pass" : "i-pass"}>{signup ? "New password:" : "Password"}</label><input id={signup ? "u-pass" : "i-pass"} type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : undefined} minLength={signup ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)}/></div>
        {signup && <div className="f"><label htmlFor="u-code">Code:</label><div className="row"><input id="u-code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}/><button className="ghost" type="button" id="send" onClick={sendCode} disabled={busy || remaining > 0}>{remaining > 0 ? `Resend in ${remaining}` : "Send code"}</button></div><p className="hint" id="codehint">{codeHint}</p></div>}
        <button className="primary" type="submit" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
        <p className={`msg ${message.kind}`} role="status" aria-live="polite">{message.text}</p>
      </form>
    </div>
  </section>;
}

