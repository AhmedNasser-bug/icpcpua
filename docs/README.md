# Documentation

Start with the [root README](../README.md) to set up and run the project, then
use this index to go deeper.

## Guides

| Doc | What it covers |
|---|---|
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Local setup, verification commands, commit and PR flow |
| [configuration.md](./configuration.md) | Environment variables, defaults and the no-credentials fallback contract |
| [data-model.md](./data-model.md) | Firestore collections, Supabase tables and browser storage |

## Architecture

| Doc | What it covers |
|---|---|
| [architecture/overview.md](./architecture/overview.md) | System shape, route map, runtime data flows and backend fallbacks |
| [architecture/dependency-graph.md](./architecture/dependency-graph.md) | Component import tree and shared hubs |
| [architecture/firebase-backend-plan.md](./architecture/firebase-backend-plan.md) | Historical Firestore/leaderboard design record (superseded by ADR 0001 for status) |

Design tokens, typography and visual rules live in [../DESIGN.md](../DESIGN.md).

## Decisions

- [decisions/0001-firestore-event-backend.md](./decisions/0001-firestore-event-backend.md)
  — why cadet data uses Firestore with an immutable point ledger.
- [decisions/0002-codeforces-sync.md](./decisions/0002-codeforces-sync.md)
  — Codeforces synchronization, internal-points ranking and the original
  session design (sessions superseded by ADR 0003).
- [decisions/0003-firebase-authentication.md](./decisions/0003-firebase-authentication.md)
  — Firebase Authentication, fenced Firestore locks and fail-closed rate
  limiting.
