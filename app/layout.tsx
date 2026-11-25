import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "LFTarena – find your next squad", description: "Find teammates who fit your game, rank, languages and playstyle." };
export const viewport: Viewport = { themeColor: "#0d0f10" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
