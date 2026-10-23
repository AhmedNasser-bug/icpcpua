# Data model

The app uses two remote stores plus browser storage and an HTTP-only session
cookie. The TypeScript interfaces in `lib/firebase-schema.ts` and `lib/bounty.ts`
are the source of truth; this page describes how the stores are laid out.

## Firestore (server-side)

Access goes through `lib/firebase-admin.ts` and the API routes. There is no
client-side Firestore SDK. Firestore is schemaless, so the Codeforces work needed
no SQL migration; the composite indexes used by the leaderboard are declared in
[`firestore.indexes.json`](../firestore.indexes.json). That file also disables
indexing for `cfSolvedProblemKeys`, because the cached problem identifiers are
never queried and would otherwise create a large array index.

### `trainees`

Document id is the trimmed `universityId`, so a cadet can only register once.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same value as the document id |
| `fullName`, `universityId`, `email`, `phone` | string | `email` is lowercased on write |
| `authUid` | string, optional | Firebase Authentication UID. Authoritative identity for the record. Added during registration or a verified migration claim. |
| `authEmail`, `authLinkedAt` | string \| null, optional | Audit metadata for the Firebase link. Not used for authorization. |
| `authMigrationState`, `authMigrationUpdatedAt`, `authMigrationError` | string, optional | Status written by `scripts/migrate-trainee-auth.mjs`. Never contains tokens. |
| `authClaimCodeHash`, `authClaimExpiresAt` | string \| null, optional | Hashed one-time legacy claim code and its expiry. Cleared after a successful claim. |
| `academicYear` | `"Year 1" \| "Year 2" \| "Year 3" \| "Year 4"` | |
| `track` | `"level_1" \| "level_2"` | Leaderboard filter values |
| `codeforcesHandle` | string | Stored without a leading `@`; only displayed after verification |
| `codeforcesHandleLower` | string, optional | Lower-case handle used for lookup/uniqueness |
| `cfHandleVerified` | boolean, optional | Set only after `user.info` confirms the handle |
| `status` | `"active" \| "probation" \| "graduated" \| "inactive"` | Only `active` appears on the leaderboard |
| `pointsTotal` | number | Starts at 10 (welcome points) and is incremented per event. **This is the leaderboard score.** |
| `cfRating`, `cfMaxRating` | number \| null | Current/max Codeforces rating; `null` means unrated or unknown |
| `cfSolvedCount` | number \| null | Distinct accepted Codeforces problems; `null` means not synchronized yet |
| `cfSolvedProblemKeys` | string[], optional | Deduplicated canonical problem keys for incremental synchronization. Contest problems use `contestId:index` (legacy-compatible); non-contest problems use `problemset:<name>:<index>`; the ambiguous fallback is `name:<normalized-name>[:<index>]`. |
| `cfLastSubmissionId` | number \| null | Cursor for incremental `user.status` fetches |
| `cfLastSyncedAt` | string \| null | ISO-8601 time of the last successful full sync |
| `cfSyncAttemptedAt` | string \| null | ISO-8601 time of the last attempt (manual cooldown) |
| `cfSyncStatus` | `"never" \| "success" \| "failed"` | Synchronization state |
| `cfSyncError` | string \| null | Sanitized, user-safe failure explanation |
| `cfNextSyncAt` | string \| null | When the account becomes due for the cron/auto refresher |
| `attendedSessionsCount`, `qrScansCount` | number | Incremented by matching point event types |
| `registeredAt`, `updatedAt` | string | ISO-8601, not Firestore `Timestamp` |

Legacy documents may contain `cfRating: 0` / `cfSolvedCount: 0` with no
`cfLastSyncedAt`. The API treats those values as unknown until a successful sync,
so an unrated account is not confused with a missing rating.

### `point_events`

Immutable append-only ledger; the document id is auto-generated.

| Field | Type | Notes |
|---|---|---|
| `traineeId`, `universityId` | string | Both set to the trainee's university id |
| `type` | `registration_welcome` \| `qr_scan` \| `session_attendance` \| `cf_sync` \| `coach_bonus` \| `upsolve` \| `penalty` | Validated by the points route against `POINT_EVENT_TYPES`; only `qr_scan` and `session_attendance` also update counters |
| `points` | number | May be negative |
| `reason` | string | Human-readable audit text |
| `metadata` | object, optional | Free-form; `qrCodeId` is used for duplicate-scan detection |
| `createdAt` | string | ISO-8601 |

Registration and point events are committed with a Firestore batch so the
ledger entry and the aggregate counters on `trainees` stay in sync. Codeforces
synchronization never writes points: `pointsTotal` remains the only score.

### `codeforces_links`

One document per normalized handle, keyed by the lower-case handle
(`codeforces_links/tourist`). The document stores `universityId`, the canonical
`handle`, `createdAt` and `updatedAt`. Link/update/disconnect operations read and
write this registry in the same transaction as the trainee document, which makes
the handle mapping unique without a relational constraint.

### `trainee_auth_links`

One document per Firebase UID (`trainee_auth_links/{uid}`) with `traineeId`,
`uid`, `createdAt` and `updatedAt`. This is the authoritative uniqueness
registry for the UID→trainee relationship. It is written in the same transaction
as `trainees/{id}.authUid`; conflicting mappings are rejected.

`trainee_auth_links_by_trainee/{traineeId}` is the reverse mapping (`traineeId`,
`uid`). Registration and linking write both directions atomically so a trainee
cannot be linked to two Firebase UIDs even if the `authUid` field is repaired or
partially missing.

### `trainee_email_links`

One document per normalized email (`trainee_email_links/{encodeURIComponent(email)}`)
with `traineeId` and `email`. It prevents two new registrations from reserving
the same email. Legacy documents may predate the registry; reconciliation
reports those cases instead of guessing.

### `cf_sync_locks`

Short-lived lock documents keyed by `universityId`. Fields are `token`, `jobId`,
`lockedAt`, `heartbeatAt`, `expiresAt` (Firestore `Timestamp`, TTL field) and
`expiresAtMs` (the application check). Every protected write re-reads the lock
in the same transaction and rejects a stale token or expired lease. A heartbeat
renews only the current token. TTL deletion is asynchronous cleanup and is never
used for correctness.

### `system_state/codeforces_rate_limit`

A single document with `nextAllowedAt` and `updatedAt`. Every Codeforces request
reserves a slot through a transaction, enforcing the official two-second request
interval across instances. A failed transaction raises a retryable coordination
error and the API request is not made. The in-memory limiter is only used outside
production (local development and tests).

### `rate_limits`

Hashed fixed-window counters used by authentication and account-claiming
endpoints: `count`, `windowStartedAt`, `expiresAt` (TTL) and `updatedAt`. Keys
combine the operation, a trusted client IP where available and the verified UID.
Production fails closed if this storage is unavailable.

### `sync_runs`

One document per synchronization attempt. Fields: `trigger`
(`link`/`manual`/`cron`/`auto`), `traineeId`, `startedAt`, `finishedAt`,
`status`, `errorCode`, `dataChanged`, `durationMs`, `jobId` and a safe `summary`.
Statuses include `running`, `success`, `no_changes`, `failed`, `skipped`,
`lock_lost`, `time_budget` and `aborted`. Raw exceptions and credentials are
never stored.

### `admin_audit`

Append-only records for administrative and security-sensitive events. Fields:
`type`, `actorType`, `actorUid`, `targetType`, `targetId`, `outcome`, `detail`,
safe `metadata` and `createdAt`. No tokens, cookies or unnecessary personal data.

## Trainee session cookie

`pua_trainee_session` is a Firebase session cookie issued by
`createSessionCookie`. It is HTTP-only, `SameSite=Lax`, `Path=/`, `Secure` in
production and defaults to a five-day lifetime. Every private route calls
`verifySessionCookie(cookie, true)`; the UID is resolved through
`trainee_auth_links` and `trainees.authUid`. `TRAINEE_SESSION_SECRET` is no longer
used. Sign-out revokes the user's refresh tokens, so it is account-wide rather
than per-device.

## Supabase (browser-side)

`lib/bounty.ts` talks to the `public` schema directly from the browser.

### `bounty_scouts`

Matches the `ScoutProfile` interface: `id`, `full_name`, `uni_id`,
`referral_code`, `recruits_count`, `claimed_tiers`, `created_at`, `updated_at`.
Referral codes are generated as `FIRSTNAME-<last 4 of uni id>` (first name
truncated to 8 characters) and a numeric suffix is appended on collision.

### `bounty_referrals`

Written on successful registration with a referral code: `scout_id`,
`referred_name` and `referred_uni_id`. When a university id is provided, a
`(scout_id, referred_uni_id)` pair is checked first, so the same cadet is not
credited twice to the same scout.
Per the comment in `lib/bounty.ts`, a Postgres trigger increments
`bounty_scouts.recruits_count` when a referral row is inserted.

The reconstructed schema — tables, indexes, RLS policies and the
`recruits_count` trigger — lives in
[`supabase/migrations/20261012000000_bounty_schema.sql`](../supabase/migrations/20261012000000_bounty_schema.sql).
It mirrors what the client code needs; review it against the production project
before applying.

## Browser storage

| Key | Written by | Contents |
|---|---|---|
| `pua_bounty_scout` | `lib/bounty-storage.ts` | JSON `ScoutProfile` for the signed-in scout; cleared on logout or corrupt JSON |
