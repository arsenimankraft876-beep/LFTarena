# LFTarena

LFTarena is a teammate-finder starter built with Next.js App Router, TypeScript, Drizzle ORM, Neon Postgres, and OpenNext for Cloudflare Workers.

## Project layout

- `app/` — English-language pages and authentication route handlers.
- `components/` — the responsive sign-up/sign-in card and signed-in controls.
- `lib/auth/` — password and token hashing, OAuth/session helpers, email, validation, and rate limits.
- `lib/db/` — Drizzle schema and Neon connection setup.
- `drizzle/` — generated Postgres migrations.
- `tests/` — Vitest coverage for password/code primitives and rate limits.

## Requirements

- Node.js 20 or later and npm.
- A Neon Postgres project, a Cloudflare account with Workers and KV, a Google OAuth web client, and a Brevo API key.

## Neon

The production project is named `lftarena`. The `production` branch database is `neondb`.

1. Copy `.dev.vars.example` to `.dev.vars` for local Cloudflare preview and set `DATABASE_URL` to the Neon pooled connection string. Keep `.dev.vars` out of version control.
2. Set `DATABASE_URL_UNPOOLED` in your shell to the direct Neon connection string (without `-pooler`) when running migration generation or other direct-connection tools.
3. Generate schema migrations with `npm run db:generate` after editing `lib/db/schema.ts`.
4. Apply migrations with `npm run db:migrate`.

The first migration creates `users`, `oauth_accounts`, `email_codes`, and `sessions`. Sessions store a SHA-256 token hash; verification codes are also stored as hashes.

## Brevo email

1. In Brevo, create an API key under **SMTP & API → API Keys** and store it as `BREVO_API_KEY`.
2. Under **Senders, Domains & Dedicated IPs → Senders**, verify a sender address. Put the verified address in `EMAIL_FROM`; the visible sender name is `LFTarena`.
3. The app sends through Brevo API v3 (`POST https://api.brevo.com/v3/smtp/email`), not SMTP.

## Google OAuth

Create an OAuth 2.0 **Web application** client in Google Cloud Console. Add the following Authorized redirect URI:

```text
https://lftarena.arsenimankraft876.workers.dev/api/auth/google/callback
```

Set the issued client ID as `GOOGLE_CLIENT_ID` and client secret as `GOOGLE_CLIENT_SECRET`. Set `APP_URL` to `https://lftarena.arsenimankraft876.workers.dev` in production. For local development, add `http://localhost:3000/api/auth/google/callback` as an additional authorized redirect URI and use `APP_URL=http://localhost:3000`.

The OAuth route uses Authorization Code + PKCE and validates both the state cookie and PKCE verifier. Google must return a verified email address.

## Local development

```bash
npm install
Copy-Item .dev.vars.example .dev.vars
npm run dev
```

`npm run dev` runs Next.js with the OpenNext Cloudflare dev adapter and Wrangler bindings. To preview the production Worker build locally, run `npm run preview`.

## Cloudflare secrets and deploy

The Worker is named `lftarena`; its KV namespace `lftarena-rate-limits` is bound as `RATE_LIMITS` in `wrangler.jsonc`.

Set each secret from a secure terminal prompt; do not put values in shell history or source control:

```powershell
npx wrangler secret put DATABASE_URL
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put APP_URL
```

For each command, paste the value at Wrangler's hidden input prompt. `DATABASE_URL` should use the pooled Neon connection string for application requests. Set `APP_URL` to `https://lftarena.arsenimankraft876.workers.dev`.

```bash
npm run deploy
```

## Custom domain

In Cloudflare, open **Workers & Pages → lftarena → Settings → Domains & Routes**, add your hostname (for example `lftarena.com`), and complete the DNS/TLS prompts. Then update the `APP_URL` Worker secret to `https://lftarena.com` and add `https://lftarena.com/api/auth/google/callback` as an Authorized redirect URI in the Google OAuth client. Update local `.dev.vars` as needed and redeploy.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Security notes

- All `/api/auth/*` routes have Cloudflare KV rate limits. State is not process-local.
- POST endpoints verify the request `Origin`; session cookies are HTTP-only, Secure in production, SameSite=Lax, and expire after 30 days.
- Passwords use Web Crypto PBKDF2-SHA256 with 310,000 iterations and a per-password random salt.
- Never print credentials, verification codes, or password values to logs.

