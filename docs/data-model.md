# Data model

The app uses two remote stores plus browser `localStorage`. The TypeScript
interfaces in `lib/firebase-schema.ts` and `lib/bounty.ts` are the source of
truth; this page describes how the stores are laid out.

## Firestore (server-side)

Access goes through `lib/firebase-admin.ts` and the API routes. There is no
client-side Firestore SDK.

### `trainees`

Document id is the trimmed `universityId`, so a cadet can only register once.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same value as the document id |
| `fullName`, `universityId`, `email`, `phone` | string | `email` is lowercased on write |
| `academicYear` | `"Year 1" \| "Year 2" \| "Year 3" \| "Year 4"` | |
| `track` | `"level_1" \| "level_2"` | Leaderboard filter values |
| `codeforcesHandle` | string | Leading `@` is stripped; optional at registration |
| `status` | `"active" \| "probation" \| "graduated" \| "inactive"` | Only `active` appears on the leaderboard |
| `pointsTotal` | number | Starts at 10 (welcome points) and is incremented per event |
| `cfRating`, `cfSolvedCount` | number | Start at 0; no sync job writes them today |
| `attendedSessionsCount`, `qrScansCount` | number | Incremented by matching point event types |
| `registeredAt`, `updatedAt` | string | ISO-8601, not Firestore `Timestamp` |

### `point_events`

Immutable append-only ledger; the document id is auto-generated.

| Field | Type | Notes |
|---|---|---|
| `traineeId`, `universityId` | string | Both set to the trainee's university id |
| `type` | `registration_welcome` \| `qr_scan` \| `session_attendance` \| `cf_sync` \| `coach_bonus` \| `upsolve` \| `penalty` | The points route forwards any string as `type`; only `qr_scan` and `session_attendance` also update counters |
| `points` | number | May be negative |
| `reason` | string | Human-readable audit text |
| `metadata` | object, optional | Free-form; `qrCodeId` is used for duplicate-scan detection |
| `createdAt` | string | ISO-8601 |

Registration and point events are committed with a Firestore batch so the
ledger entry and the aggregate counters on `trainees` stay in sync.

## Supabase (browser-side)

`lib/bounty.ts` talks to the `public` schema directly from the browser. The
referral features degrade to empty results if Supabase is unreachable (for
example `getTopScouts` returns `[]`).

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

TODO(maintainer): the Supabase table definitions, RLS policies and trigger are
managed outside this repository. Add the SQL/migrations (or a link to the
Supabase project) so a fresh environment can be provisioned from the repo.

## Browser storage

| Key | Written by | Contents |
|---|---|---|
| `pua_bounty_scout` | `lib/bounty-storage.ts` | JSON `ScoutProfile` for the signed-in scout; cleared on logout or corrupt JSON |

The feedback bucket and the leaderboard/events/FAQ pages keep state in React
only; nothing else is persisted in the browser.
