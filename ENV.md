# Environment variables

Required and optional environment variables for Neulearn.

## Required (production)

| Var | Where set | Purpose |
|---|---|---|
| `DATABASE_URL` | Replit Secrets | Neon Postgres connection string. Already set if you provisioned Postgres via Replit. |
| `OPENAI_API_KEY` | Replit Secrets | OpenAI API access for lesson generation, TTS, Whisper. |
| `SESSION_SECRET` | Replit Secrets | Express session signing key. Generate a random 64-char string. |

## Required for observability (Phase 1)

| Var | Where set | Purpose |
|---|---|---|
| `SENTRY_DSN` | Replit Secrets | Server-side error tracking. Get from `sentry.io` after creating a Node.js project. |
| `VITE_SENTRY_DSN` | Replit Secrets | Client-side error tracking. Get from `sentry.io` after creating a React project. **Must be prefixed `VITE_` so Vite exposes it to the browser bundle.** |

When `SENTRY_DSN` / `VITE_SENTRY_DSN` are unset, Sentry is a no-op (safe in development).

## Replit-managed (do not set manually)

| Var | Notes |
|---|---|
| `PUBLIC_OBJECT_SEARCH_PATHS` | Replit App Storage paths for public assets |
| `PRIVATE_OBJECT_DIR` | Replit App Storage private bucket path |

## Sentry setup checklist (do this in your browser, then paste the DSN values)

1. Go to https://sentry.io → sign up (free tier covers Phase 1 alpha).
2. Create a new project, type **Node.js** — call it `neulearn-server`.
3. Copy the DSN it shows you. Paste as `SENTRY_DSN` in Replit Secrets.
4. Create another new project, type **React** — call it `neulearn-client`.
5. Copy that DSN. Paste as `VITE_SENTRY_DSN` in Replit Secrets.
6. Optional but recommended: in the project settings, enable **Performance → Tracing** and **Issue alerts → email me on new errors**.

## OpenAI cost guardrails (do this in your browser)

While Sentry is being set up, also do this — it takes 60 seconds and prevents a runaway bill:

1. Go to https://platform.openai.com/account/billing/limits.
2. Set a **soft limit** at $50/month and a **hard limit** at $150/month for Phase 1.
3. Set up email alerts at 50% and 75% of the soft limit.

You can raise these later. Right now you have no read-along caching yet, so a single bug looping a TTS call could spike $$$ fast. The hard limit is your safety net.
