"use client";

import { useState } from "react";

export function AvatarImage({ src, name, className }: { src: string | null; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const initial = name.trim().slice(0, 1).toLocaleUpperCase() || "?";

  return <span className={className} aria-label={`${name} avatar`}>
    {(!src || failed || !loaded) && initial}
    {src && !failed && <img src={src} alt="" referrerPolicy="no-referrer" style={{ display: loaded ? "block" : "none" }} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </span>;
}

