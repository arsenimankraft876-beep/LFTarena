"use client";
import { useState } from "react";
export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return <button className="primary" disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); window.location.assign("/"); }}>Sign out</button>;
}

