# Configuration

The site still runs without credentials: API routes fall back to simulated or
seed data and the Supabase client falls back to a public project. Real trainee
accounts, Codeforces synchronization and administrative actions require the
Firebase variables below. `.env.example` lists every variable with a safe
placeholder.

## Server environment validation

`lib/server-env.ts` validates the runtime configuration. It never prints secret
values, only variable names and a safe reason.

- Development and tests keep the documented fallback behaviour.
- A deployed Vercel production environment (`VERCEL=1` or
  `VERCEL_ENV=production`) fails fast when required variables are missing.
- A self-hosted production runtime opts in with `REQUIRE_PRODUCTION_CONFIG=true`.
- `next start` without any Firebase/secret configuration still serves the local
  fallback, which keeps the credential-free Playwright suite working.
- `GET /api/health` is a liveness check. `GET /api/health/ready` reports only
  `configuration` and `firestore` status codes, never credentials or internal
  errors.

## Firebase client (public)

These values are embedded in the browser bundle and are not private. They must
never contain service-account credentials.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production | Firebase Web API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production | Auth domain from the Firebase console. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production | Firebase project id. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Production | Firebase Web App id. |

If any client variable is missing, the profile page explains that
authentication is not configured and registration uses the local fallback (no
Firebase user is created). Deployed production builds fail validation instead.

### Firebase console setup (manual, once)

1. Enable the **Email/Password** provider under Authentication → Sign-in method.
2. Add the production domain (and preview domains if used) to Authentication →
   Settings → Authorized domains.
3. Keep email enumeration protection enabled if the default template is used.
4. Configure the password-reset email template and sender.
5. Optionally enable the Email Verification template. New registrations can
   sign in immediately because the server links the new record to the freshly
   authenticated UID; existing records require a verified email.

## Firebase Admin (server only)

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Production | Firebase project id. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is accepted as a fallback. |
| `FIREBASE_CLIENT_EMAIL` | Production | Service-account client email. |
| `FIREBASE_PRIVATE_KEY` | Production | Service-account private key. Literal `\n` sequences are converted to newlines. |
| `FIREBASE_WEB_API_KEY` | Optional | Only used by `scripts/migrate-trainee-auth.mjs --send-reset` to request Firebase password-reset emails. Never expose this value to clients. |

`lib/firebase-admin.ts` initialises one Admin app and exports `adminDb` and
`adminAuth`. If no project id is present at all, both are `null` and routes use
the fallback. Do not use Application Default Credentials as a production
substitute on Vercel; provide the service account explicitly.

## Trainee sessions

Firebase Authentication replaced the legacy HMAC cookie. `POST
/api/trainees/session` verifies a Firebase ID token with revocation checking,
creates a Firebase session cookie and stores it in the HTTP-only
`pua_trainee_session` cookie (`Secure` in production, `SameSite=Lax`,
`Path=/`). Private routes call `verifySessionCookie(cookie, true)` on every
request.

| Variable | Default | Description |
|---|---|---|
| `TRAINEE_SESSION_MAX_AGE_SECONDS` | `432000` (5 days) | Session-cookie lifetime. Firebase allows 300–1209600 seconds (14 days). |
| `APP_ORIGIN` | request origin | Comma-separated allowed origins for cookie-authenticated mutations. Set this when the public origin differs from the runtime URL. |
| `TRUST_PROXY_HEADERS` | unset | Set to `true` only when a trusted proxy sets `x-forwarded-for`. On Vercel the trusted `x-real-ip` header is used automatically. |

`TRAINEE_SESSION_SECRET` is **obsolete**. It is no longer read, is not required
in production, and can be deleted from the deployment. Firebase signs the
session cookie; do not add custom key rotation around it.

Sign-out calls `revokeRefreshTokens(uid)` and clears the cookie. This is an
**account-wide** revocation policy: every Firebase session for that user is
invalidated, not just the current browser. Firebase session cookies reject the
revoked session on the next verified request. See
[decisions/0003-firebase-authentication.md](./decisions/0003-firebase-authentication.md).

## Administrative claims

Administrators are identified only by the verified Firebase custom claim
`admin === true`. There is no endpoint that lets a user grant themselves
`admin`. Use the trusted provisioning script with server credentials:

```bash
pnpm auth:grant-admin -- --email admin@pua.edu.eg
pnpm auth:grant-admin -- --uid FIREBASE_UID
pnpm auth:grant-admin -- --email admin@pua.edu.eg --revoke
```

The script preserves unrelated custom claims and revokes refresh tokens so the
user must sign in again to receive a token containing the new claim. Human
administrative routes (`/api/admin/*`) require both a valid trainee-linked
session and `admin === true`. Cron authentication is separate.

## Existing trainee migration

1. Run the migration helper in dry-run mode:

   ```bash
   pnpm auth:migrate -- --dry-run
   ```

2. Run it for real (optionally with `--send-reset` and `FIREBASE_WEB_API_KEY`):

   ```bash
   pnpm auth:migrate -- --limit=250
   ```

   The script creates Firebase users for trainee documents without `authUid`
   and records `authMigrationState = "pending"`. It never copies a UID into a
   trainee document. Duplicate or invalid emails are reported, not guessed.
3. Send password-reset/sign-in instructions through a trusted channel.
4. The trainee signs in at `/profile` with email and password. Because the
   email is verified, the session route asks them to confirm their university ID
   once and then links the record atomically.
5. Confirm `trainees/{id}.authUid` and
   `trainee_auth_links/{uid}.traineeId`. Re-running the script is safe.

The UID→trainee mapping is unique through `trainee_auth_links/{uid}`; a trainee
document can only have one `authUid`. Existing trainee ids and Codeforces data
are preserved. Ambiguous or conflicting mappings return `409` and are audited in
`admin_audit`.

### Temporary legacy claim flow

The bounded claim flow exists only for records that cannot use the verified
email path. It is disabled unless all of the following are set:

| Variable | Description |
|---|---|
| `TRAINEE_LEGACY_CLAIM_ENABLED` | Must be exactly `true`. |
| `TRAINEE_LEGACY_CLAIM_DEADLINE` | ISO-8601 deadline. After it, every claim route answers `410`. |
| `TRAINEE_CLAIM_SECRET` | At least 32 characters; used as an HMAC key for one-time claim codes. |

Generate a one-time code as an admin with `POST
/api/admin/trainees/claim-code` (`{ "traineeId": "..." }`). It returns the code
once; deliver it through a trusted channel. The trainee uses `POST
/api/trainees/claim` with `idToken`, `universityId` and `claimCode`. Claiming is
rate-limited, requires a verified email that matches the trainee record, clears
the stored hash, and is recorded in `admin_audit`. It never sets `admin`.

Removal: delete the three variables, redeploy, and the routes return `410`
(or the admin generation route returns `404`). No new authentication path needs
to change. To retire the code entirely, delete `app/api/trainees/claim/route.ts`,
`app/api/admin/trainees/claim-code/route.ts`, `lib/legacy-claim.ts` and the
claim tests.

## Codeforces synchronization

Synchronization uses the official API at `https://codeforces.com/api/`. It never
scrapes the site and never stores submission source code.

| Variable | Default | Description |
|---|---|---|
| `CRON_SECRET` | unset | Bearer token accepted by `/api/cron/sync-codeforces`. Vercel Cron sends this automatically when configured. Required in deployed production. |
| `CF_SYNC_SECRET` | unset | Alternative machine token for a separately managed scheduler. It cannot authorize admin routes. |
| `CODEFORCES_SYNC_INTERVAL_HOURS` | `6` | How long a successful sync is considered fresh. Controls `cfNextSyncAt` and the stale warning. |
| `CODEFORCES_SYNC_BATCH_SIZE` | `10` | Maximum accounts processed by one cron invocation. |
| `CODEFORCES_SYNC_SCAN_LIMIT` | `500` | Maximum due/active documents scanned per invocation. |
| `CODEFORCES_SYNC_TIME_BUDGET_MS` | `45000` | Work budget for the 60-second function, leaving 15 seconds for cleanup and response. The route clamps it below `maxDuration`. |
| `CODEFORCES_SYNC_MIN_ATTEMPT_MS` | `20000` | A new account is not started if less time remains than this. |
| `CODEFORCES_MIN_INTERVAL_MS` | `2000` | Minimum spacing between Codeforces API requests, enforced across instances through Firestore. Set `0` only in isolated tests. |
| `CODEFORCES_RATE_LIMIT_MAX_WAIT_MS` | `120000` | A reservation that would wait longer is rejected as temporarily saturated instead of sleeping. |
| `CODEFORCES_REQUEST_TIMEOUT_MS` | `15000` | Per-request timeout. |
| `CODEFORCES_MAX_RETRIES` | `2` | Bounded retries for transient network, `5xx`, timeout and rate-limit failures. |
| `CODEFORCES_RETRY_BASE_MS` | `500` | Exponential backoff base with jitter. |
| `CODEFORCES_MANUAL_COOLDOWN_MS` | `30000` | Minimum interval between manual refreshes for one trainee. |
| `CODEFORCES_SYNC_LOCK_TTL_MS` | `120000` | Distributed lock lifetime. A heartbeat renews it while the job is active. |
| `CODEFORCES_LOCK_HEARTBEAT_MS` | `TTL / 3` | Heartbeat interval (minimum 10 seconds). |
| `CODEFORCES_LOCK_ACQUIRE_RETRIES` | `3` | Bounded retries for transient lock transaction failures. |
| `CODEFORCES_LOCK_RETRY_BASE_MS` | `100` | Exponential backoff base for lock acquisition retries. |
| `CODEFORCES_RETRY_DELAY_MS` | `3600000` | Delay before a failed account becomes due again. |
| `CODEFORCES_MAX_STATUS_PAGES` | `10` | Maximum `user.status` pages (10,000 submissions each) per sync. Larger histories fail safely. |
| `CODEFORCES_MAX_RESPONSE_BYTES` | `12000000` | Maximum accepted API response size. |

Firestore failures are **fail-closed**: if the shared reservation transaction
fails, the Codeforces request is not made and the job reports a retryable
coordination error. There is no production in-memory fallback. The in-memory
limiter exists only for local development and isolated tests.

The lock document stores both `expiresAt` (a Firestore `Timestamp`, used for
TTL cleanup) and `expiresAtMs` (a number used by the application). Firestore TTL
deletion is asynchronous and is never used for correctness; every lock
transaction checks expiry itself. Configure TTL with
`firebase deploy --only firestore:indexes` (the `firebase.json` file points at
`firestore.indexes.json`) or, if TTL is managed outside the repository:

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=cf_sync_locks --enable-ttl
gcloud firestore fields ttls update expiresAt \
  --collection-group=rate_limits --enable-ttl
```

Every sync writes a `sync_runs` document with a stable status and sanitized
error code. Admins can read `GET /api/admin/sync-runs?limit=50`. Runs stuck in
`running` for more than 15 minutes are marked `aborted` when an admin reads the
report.

## Scheduling and deployment limits

`vercel.json` registers a daily cron at 03:00 UTC. The handler is
`GET /api/cron/sync-codeforces`, `maxDuration = 60`, and requires
`Authorization: Bearer $CRON_SECRET` (or `CF_SYNC_SECRET`). The batch processes
due accounts ordered by `cfNextSyncAt` ascending and stops on the batch cap or
time budget. There is no separate cursor: only success advances
`cfNextSyncAt`, so interrupted or contended work stays due for the next run.

Vercel's Hobby plan caps function duration at 60 seconds, so the daily invocation
cannot drain a large cohort by itself. Profile auto-sync and manual refreshes
remain the per-account backstop. On a plan with longer functions, raise
`CODEFORCES_CRON_MAX_DURATION_SECONDS`, `maxDuration` in the route and the time
budget together; do not raise the budget alone.

## Firestore rules, indexes and TTL

`firestore.rules` denies all direct client reads and writes. The application has
no client Firestore SDK; every access uses the Admin SDK from server routes.
`firebase.json` deploys the rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

`firestore.indexes.json` declares the leaderboard composite indexes, disables
indexing for `cfSolvedProblemKeys`, and enables TTL on
`cf_sync_locks.expiresAt` and `rate_limits.expiresAt`. TTL is a cleanup policy,
not a synchronization primitive.

## Points API

| Variable | Required | Description |
|---|---|---|
| `POINTS_EVENT_SECRET` | Production | When set, `POST /api/points/event` requires `Authorization: Bearer <value>`; without it the endpoint only works outside production. Use a long random value. |

## Test and CI variables

| Variable | Default | Description |
|---|---|---|
| `E2E_SKIP_BUILD` | unset | When set, `pnpm test:e2e` reuses an existing build instead of running `pnpm build` first. |
| `CI` | unset | Set automatically by GitHub Actions. |
| `NEXT_TELEMETRY_DISABLED` | unset | Set to `1` for the CI build and Playwright web server. |

## Fallback contract

| Condition | Behaviour |
|---|---|
| `adminDb === null` | Registration returns a simulated success, point events return a simulated message, trainee sessions and Codeforces management answer `503` with `simulated: true`, and the leaderboard returns five hardcoded entries with `source: "local_cache"`. |
| Firestore reachable, `trainees` empty | Leaderboard returns the same entries with `source: "seed_defaults"`. |
| Firebase client variables absent | `/profile` explains that authentication is not configured; registration skips Firebase user creation. |
| Firestore rate-limit or lock transaction fails | The Codeforces request is not made; the sync is recorded as a retryable coordination failure. |
| Codeforces API fails | The sync records a sanitized error and keeps the previous rating, solved count and timestamps. |
| Supabase unreachable | `getTopScouts` resolves to `[]`; referral enrollment shows the Supabase error message. |

Real Firestore documents are never created in fallback mode, so falling back is
safe for local development but not a substitute for staging.
