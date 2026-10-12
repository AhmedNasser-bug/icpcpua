# Server-side Firestore access with an immutable point event ledger

## Status

Accepted, partially implemented (2026-10-06; verified against the code on
2026-10-12).

## Context and Problem Statement

The site needed to register cadets, award points for attendance, QR scans and
coaching, and show a leaderboard, with no authentication system in place. All
data access had to run from the server so database credentials never reach the
browser, and local development had to keep working without any credentials.

The original design gate is recorded in
[firebase-backend-plan.md](../architecture/firebase-backend-plan.md).

## Decision Drivers

- Every point mutation must be traceable; aggregates must not drift from the
  events that produced them.
- No client-side database credentials.
- Local development should not require provisioning a backend.
- The leaderboard must be cheap to read.

## Considered Options

The original gate report did not record alternative options; it documented a
single design. This ADR records the outcome and its consequences.

## Decision Outcome

Chosen: use Cloud Firestore through `firebase-admin` in Next.js route handlers,
with two collections. `trainees` stores one document per cadet keyed by
`universityId`; `point_events` is an immutable, append-only ledger. Registration
and point awards write both in a single batch, incrementing `pointsTotal` and
the relevant counters atomically. The leaderboard reads `trainees` where
`status == "active"`, ordered by `pointsTotal`.

Supabase remains in use for referral bounties only, and is accessed directly
from the browser with a publishable anon key.

### Consequences

- Good, because no database credentials are shipped to the client.
- Good, because the ledger plus batch updates keep the audit trail and the
  aggregates consistent.
- Good, because the no-credentials fallback keeps the app runnable locally and
  in tests.
- Bad, because `POST /api/points/event` has no per-user authentication; it can
  only be gated by an optional shared secret (`POINTS_EVENT_SECRET`).
- Bad, because the `leaderboard_cache` collection from the original design was
  never built and the leaderboard queries `trainees` directly.
- Bad, because the `applications` and `hr_records` collections and the
  Codeforces sync job (`cf_sync`) remain unimplemented proposals.

### Confirmation

The behaviour is covered by the route tests in `tests/api/` and documented in
[data-model.md](../data-model.md).

## Pros and Cons of the Options

Not recorded in the original design gate.

## More Information

- [Firebase backend plan](../architecture/firebase-backend-plan.md) — the
  detailed design and what remains unimplemented.
- [Architecture overview](../architecture/overview.md) — current data flows.
