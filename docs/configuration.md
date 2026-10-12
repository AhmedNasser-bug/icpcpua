# Configuration

The site runs with no configuration at all: the API routes fall back to
simulated or seed data and the Supabase client falls back to a public project.
Set the variables below in `.env.local` (git-ignored) when you need real
backends.

## Firebase (server-side)

Read once at module load time in `lib/firebase-admin.ts`, which powers
`/api/trainees/register`, `/api/points/event` and `/api/leaderboard`. These are
server-only variables; do not prefix them with `NEXT_PUBLIC_` unless noted.

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Yes for real data | Firebase project id. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is accepted as a fallback value. |
| `FIREBASE_CLIENT_EMAIL` | Yes for real data | Service account client email. |
| `FIREBASE_PRIVATE_KEY` | Yes for real data | Service account private key. Literal `\n` sequences are converted to newlines, so the value can stay on one line. |

Initialisation order in `lib/firebase-admin.ts`:

1. If project id, client email and private key are all present, the SDK
   initialises with an explicit service-account certificate.
2. Otherwise, if a project id is present, the SDK initialises with just the
   project and relies on Application Default Credentials (for example on Google
   Cloud). This can succeed but fail later on unauthenticated writes.
3. If no project id is present at all, `adminDb` is `null` and every route falls
   back to simulated or seed data (see below).

## Supabase (browser-side)

Baked into the client bundle at build time, so rebuild after changing them.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL. Falls back to the community project configured in `lib/supabase.ts`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon (publishable) key. Falls back to the same project's key. |

The fallback pair is committed to the repository on purpose so referral pages
work in local development. Treat the anon key as public: it is only safe as long
as Row Level Security restricts what it can read and write.

## Test and CI variables

| Variable | Default | Description |
|---|---|---|
| `E2E_SKIP_BUILD` | unset | When set, `pnpm test:e2e` reuses an existing build instead of running `pnpm build` first. CI sets it after its own build step. |
| `CI` | unset | Set automatically by GitHub Actions. Playwright enables retries, limits workers to 2 and forbids `test.only`, and reports switch to the GitHub/HTML reporters. |
| `NEXT_TELEMETRY_DISABLED` | unset | Set to `1` for the CI build and the Playwright web server. |

## Fallback contract

These behaviours are what make the app usable without credentials, and are
covered by unit tests:

| Condition | Behaviour |
|---|---|
| `adminDb === null` | Registration returns a simulated success, point events return a simulated message, and the leaderboard returns five hardcoded entries with `source: "local_cache"`. |
| Firestore reachable, `trainees` empty | Leaderboard returns the same entries with `source: "seed_defaults"`. |
| Supabase unreachable | `getTopScouts` resolves to `[]`; referral enrollment shows the Supabase error message. |

Real Firestore documents are never created in fallback mode, so falling back is
safe for local development but not a substitute for staging.
