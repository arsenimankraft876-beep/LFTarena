import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({ persist: { path: ".wrangler/state/v3" } });
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() { return [{ source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://api.brevo.com https://openidconnect.googleapis.com" }
  ] }]; }
};
export default nextConfig;

