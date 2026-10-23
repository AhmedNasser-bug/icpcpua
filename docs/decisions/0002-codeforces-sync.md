# Codeforces synchronization with internal-points ranking

## Status

Accepted (2026-10-23). The session, rate-limiter fallback and lock decisions
below are superseded by
[ADR 0003](./0003-firebase-authentication.md); the points ranking and Codeforces
synchronization semantics remain current.

## Context and Problem Statement

The site already stored a `codeforcesHandle`, `cfRating` and `cfSolvedCount` on
each trainee document, but nothing wrote the Codeforces fields. Trainees could
not link or change an account through the UI, the leaderboard showed zeroed
ratings, and there was no authentication at all. The requirement was to add
automatic Codeforces synchronization and accurate personal leaderboard
positions without replacing the existing scoring system.

The existing leaderboard ranks `trainees` where `status == "active"` by
`pointsTotal`, an aggregate maintained by the immutable `point_events` ledger.
That metric must remain authoritative.

## Decision Drivers

- Preserve the internal points ledger as the leaderboard score.
- Use the official Codeforces API and never scrape or store submission source.
- Keep the leaderboard available when Codeforces is down.
- Do not add Redis, a broker, or a second database.
- Keep the no-credentials development fallback and the existing test setup.
- Act on a deployment (Vercel) that can run a cron but not a long-lived worker.

## Considered Options

1. Rank by Codeforces rating or accepted-problem count. Rejected: it would
   silently replace the community's attendance/QR/upsolve scoring.
2. Award `pointsTotal` automatically from Codeforces solves. Rejected: no
   documented conversion rule exists, so it would invent business logic.
3. Add Firebase Authentication. Rejected for this change: no identity provider
   is configured, and it would expand the scope beyond linking Codeforces.
4. A lightweight signed trainee cookie established at registration or by
   verifying the registration university id and email. Chosen as the minimum
   mechanism that lets the server derive the acting trainee without trusting a
   client-supplied id.

## Decision Outcome

Keep `pointsTotal` as the score and rank with competition ranking
(`100, 100, 90` → `1, 1, 3`), tie-broken deterministically by document id.
Codeforces rating, maximum rating and distinct solved problems are synchronized
display data only.

The synchronization design:

- `user.info` verifies the handle and reads rating fields; `user.status` pages
  through submissions, deduplicating accepted problems by `contestId:index`.
- Solved-problem keys and the highest submission id are persisted for
  incremental refreshes; a history larger than the page budget fails safely
  rather than undercounting.
- A Firestore rate-limit document enforces the official two-second request
  interval across instances; per-trainee lock documents prevent concurrent
  jobs.
- Failures write only `cfSyncStatus`, `cfSyncError` and retry timestamps. The
  last successful rating/solved data is never cleared by a failed refresh.
- Linking, handle changes and manual refreshes sync immediately; `/profile`
  auto-syncs when due; the Vercel Cron route exercises a bounded fleet-wide
  batch.

At the time of this decision, sessions were HMAC-signed HTTP-only cookies and
the rate limiter fell back to an in-process queue. Both were replaced by
[ADR 0003](./0003-firebase-authentication.md) (Firebase sessions, fail-closed
Firestore reservations, fenced locks). The cron route remains protected by
`CRON_SECRET`/`CF_SYNC_SECRET`.

### Consequences

- Good: the leaderboard remains based on the same `pointsTotal` and is served
  entirely from Firestore.
- Good: page requests never block on Codeforces and stale data is labelled.
- Good: no new infrastructure; Firestore also coordinates rate limiting and
  locks.
- Good: re-linking validates the handle before it becomes visible.
- Bad (resolved by ADR 0003): the email-based trainee sign-in was a weak
  credential and has been replaced by Firebase Authentication.
- Bad (resolved by ADR 0003): the Firestore rate limiter and lock previously
  degraded under Firestore outages; they now fail closed and use fencing.
- Bad: the cron batch is deliberately small for Vercel's 60-second limit, so a
  large cohort relies partly on profile auto-sync and manual refreshes unless the
  plan and batch size are increased.
- Bad: Firestore does not support server-side unique constraints. The
  `codeforces_links` registry plus transactional writes provide the same
  guarantee, but direct database edits can bypass it.

### Confirmation

Covered by `tests/lib/codeforces-*.test.ts`, `tests/lib/leaderboard.test.ts`,
`tests/api/leaderboard*.test.ts`, `tests/api/codeforces-*.test.ts`,
`tests/api/trainees-session.test.ts` and
`tests/components/{leaderboard-page,profile-page}.test.tsx`.
