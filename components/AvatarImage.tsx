"use client";

import { useState } from "react";

export function AvatarImage({ src, name, className }: { src: string | null; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toLocaleUpperCase() || "?";

  return <span className={className} aria-label={`${name} avatar`}>
    {src && !failed ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : initial}
  </span>;
}

