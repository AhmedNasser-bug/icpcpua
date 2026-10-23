# Changelog

Notable, user-facing changes to the PUA ICPC site. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before this file was introduced are not backfilled. The changelog is a
draft until the first tagged release.

## [Unreleased]

### Added

- Firebase Authentication email/password registration and sign-in, with
  server-verified ID tokens and HTTP-only Firebase session cookies.
- `/profile` account linking: a trainee can link their Firebase UID to an
  existing trainee record with a verified email and explicit university-id
  confirmation.
- Codeforces account linking and automatic synchronization from the official
  API, with fail-closed rate limiting, fenced locks, retries and last-valid-data
  retention.
- Leaderboard pagination, competition ranking with deterministic tie-breaking,
  a highlighted personal row and an out-of-page personal standing summary.
- Vercel Cron entry for fleet-wide Codeforces refreshes, guarded by
  `CRON_SECRET`/`CF_SYNC_SECRET`, with a time budget, due-first ordering and
  resumable state.
- `sync_runs` observability, admin sync-run reporting, admin Codeforces
  reconciliation/repair endpoints and a bounded legacy claim-code migration
  flow.
- `GET /api/health` and readiness checks, plus `lib/server-env.ts` production
  configuration validation.
- Migration and provisioning scripts: `pnpm auth:migrate` and
  `pnpm auth:grant-admin`.
- Firestore Security Rules that deny direct client access, plus TTL policies
  for synchronization locks and authentication rate limits.
- Firestore composite index definitions for the leaderboard queries.

### Changed

- The leaderboard continues to rank by the existing internal `pointsTotal`;
  Codeforces rating and solved counts are synchronized display data only.
- `/events` now shows the October 2026 season calendar instead of 2023 sample
  dates.
- `/testimonials` is no longer linked from the navigation or footer while it is
  empty.
- The README is a landing page with a verified quick start and API example.

### Fixed

- Legacy `cfRating: 0`/`cfSolvedCount: 0` documents no longer look like real
  synchronized data; unknown values render as unrated/unknown.
- `POST /api/points/event` rejects unknown event types and points outside
  `|points| <= 1000` with `400` instead of writing them.
- `GET /api/leaderboard` defaults and clamps the `limit` parameter instead of
  passing `NaN` to Firestore, and re-ranks filtered fallback entries from 1.
- Referral credit is skipped when registration runs in simulated fallback mode,
  so a dev-mode signup cannot earn referral points.
- `DESIGN.md` names the Fredoka font family actually loaded by `app/fonts.ts`.

### Security

- Trainee authentication now uses Firebase Authentication email/password
  sessions. ID tokens are verified server-side, session cookies are HTTP-only
  and revocation-checked, and legacy HMAC sessions are rejected.
- Trainee records link to Firebase UIDs through `authUid` plus transactional
  UID, reverse-UID and email registries; account claiming requires a verified
  email and an explicit university-id confirmation.
- Administrative routes require the verified `admin === true` custom claim.
  `scripts/grant-admin.mjs` is the only provisioning path.
- Codeforces rate-limit reservation failures now abort the API request instead
  of falling back to a per-instance limiter. Sync locks use fencing tokens,
  heartbeats and in-transaction ownership checks so stale jobs cannot overwrite
  newer results.
- `POST /api/points/event` now requires `POINTS_EVENT_SECRET` in production.
- Firestore Security Rules deny all direct client access; the app has no client
  Firestore SDK.
- The Codeforces problem identity now covers problemsets without `contestId`
  with prefixed, deterministic keys, and documents the ambiguous name fallback.

## [0.2.0] - 2026-10-18

### Added

- "Wait For It" admissions teaser on `/join` (`ApplicationSection`) and the home `JoinModal`.
- Pitching for the two Training tracks: Level 1 (Fundamentals: C++ STL, Math, Two Pointers) and Level 2 (Advanced: Graph Theory, Dynamic Programming, ECPC qualification).
- Pitching for the live Leaderboard: real-time solves, gym ratings, point audit ledger, and national team selection.
- Early access priority waitlist notification form with local persistence and referral scout tracking.
- Supabase migration for the referral schema (`bounty_scouts`, `bounty_referrals`, RLS policies and the `recruits_count` trigger).
- `SECURITY.md` with the private vulnerability reporting path.
- Documentation: docs index, architecture overview, configuration reference, data model, contributing guide and a Firestore backend ADR.

### Removed

- Unverified fake cadet enrollment forms from `/join` and home modal in preparation for multi-provider authentication (Google, GitHub, Phone).

### Changed

- `/events` now shows the October 2026 season calendar instead of 2023 sample dates.
- `/testimonials` is no longer linked from the navigation or footer while it is empty.
- The README is a landing page with a verified quick start and API example.

### Fixed

- `POST /api/points/event` rejects unknown event types and points outside `|points| <= 1000` with `400` instead of writing them.
- `GET /api/leaderboard` defaults and clamps the `limit` parameter instead of passing `NaN` to Firestore, and re-ranks filtered fallback entries from 1.
- Referral credit is skipped when registration runs in simulated fallback mode, so a dev-mode signup cannot earn referral points.
- `DESIGN.md` names the Fredoka font family actually loaded by `app/fonts.ts`.

### Security

- The points endpoint can require an `Authorization: Bearer <secret>` header via `POINTS_EVENT_SECRET`.
