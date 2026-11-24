import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "LFTarena – find the right co-op teammates", description: "Find teammates who fit your game, role, rank and schedule." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

