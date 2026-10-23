# PUA ICPC

Website for the ICPC training community at Pharos University in Alexandria: the
training curriculum, events calendar, live cadet leaderboard, admissions
waitlist, committee recruitment specs, referral bounties and a feedback bucket.
Production runs at <https://icpcpua.vercel.app>.

It is a public marketing and community site, not a contest judge. The trainee
registration API, points and the leaderboard are backed by Cloud Firestore;
referral bounties live in Supabase. Trainees can sign in at `/profile` with
Firebase Authentication, link a Codeforces account and
synchronize rating and distinct-solved data from the official Codeforces API. The
leaderboard score itself remains the existing internal `pointsTotal` ledger;
Codeforces metrics are synchronized for display and never replace it. The
feedback bucket is local-only.

## Quick start

Prerequisites: Node.js 22 and pnpm 10 (`corepack enable pnpm`).

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. No credentials are needed: when the environment
variables are absent, the API routes serve simulated or seed data and the
referral pages use a public Supabase project.

## Try the API

The leaderboard is the simplest real endpoint to exercise:

```bash
curl -s "http://localhost:3000/api/leaderboard?track=level_1"
```

Without Firebase credentials you get the local fallback. Real data adds
`total`, `page`, `pageSize`, `totalPages`, `hasMore`, a `viewer` standing and a
`meta` block describing the score rule:

```json
{
  "success": true,
  "source": "local_cache",
  "count": 3,
  "total": 3,
  "page": 1,
  "pageSize": 50,
  "totalPages": 1,
  "hasMore": false,
  "viewer": null,
  "meta": {
    "scoreRule": "pointsTotal",
    "ranking": "competition",
    "tieBreaker": "universityId"
  },
  "leaderboard": [
    {
      "rank": 1,
      "handle": "dp_master",
      "codeforcesHandle": "dp_master",
      "codeforcesUrl": "https://codeforces.com/profile/dp_master",
      "fullName": "Youssef Tarek",
      "rating": 1795,
      "maxRating": 1830,
      "solved": 412,
      "pointsTotal": 960,
      "track": "level_1",
      "initials": "YT",
      "color": "#FFD500",
      "lastSyncedAt": null,
      "syncStatus": "never",
      "stale": false
    }
  ]
}
```

`source` becomes `seed_defaults` when Firestore is reachable but empty, and
`firestore` when real trainees exist. Use the `track` query parameter
(`all`, `level_1`, `level_2`), `page` (default 1) and `limit`/`pageSize`
(default 50, capped at 100). The demo fallback is labelled in the UI and is not
synchronized Codeforces data.

## Configuration

To use real backends, create a git-ignored `.env.local` from `.env.example`:
Firebase Web App variables (`NEXT_PUBLIC_FIREBASE_*`) for browser authentication,
Firebase Admin service-account variables (`FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), and optionally
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Deployed production
also needs `CRON_SECRET` for Vercel Cron and `POINTS_EVENT_SECRET` for the points
ledger. `TRAINEE_SESSION_SECRET` is obsolete and can be removed. Every variable,
its default, the Firebase console steps and the fallback contract are documented
in [docs/configuration.md](docs/configuration.md).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (flat config) |
| `pnpm lint:md` | Markdownlint |
| `pnpm check:docs` | Relative markdown link check |
| `pnpm knip` | Dead code and unused dependency check |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest suite, one run |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Vitest with the thresholds enforced by CI |
| `pnpm test:e2e` | Playwright: builds, serves on port 3000, runs the browser suite |
| `pnpm test:e2e:ui` | Playwright interactive UI mode |

## Testing

Unit and component tests run on Vitest with React Testing Library and jsdom;
Supabase and Firebase Admin are mocked, so no credentials are needed. The
browser layer runs on Playwright against a production build and blocks traffic
to Firebase, Supabase and Google hosts. See [CONTRIBUTING.md](CONTRIBUTING.md)
for commands, coverage thresholds and the WebGL testing boundary.

## Deployment

Production is hosted on Vercel at <https://icpcpua.vercel.app> and is linked to
a [v0](https://v0.app) project, which pushes commits directly to this repo;
merges to `main` deploy through that project. The daily Codeforces batch is
registered in `vercel.json` and authenticated with `CRON_SECRET`; manual and
profile-triggered refreshes work without it. CI
(`.github/workflows/ci.yml`) runs the coverage suite, lint, typecheck and build,
plus the Playwright job, on every push and pull request.

## Documentation

- [docs/README.md](docs/README.md) — documentation index: guides, architecture,
  decisions and project history.
- [DESIGN.md](DESIGN.md) — design tokens and visual rules.
- [CHANGELOG.md](CHANGELOG.md) — notable changes.
- [AGENTS.md](AGENTS.md) — conventions and gotchas for coding agents.

## Contributing and help

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, verification commands and the
commit/PR flow. Open an issue at
<https://github.com/AhmedNasser-bug/icpcpua/issues>.

## License

Proprietary, all rights reserved. See [LICENSE](LICENSE); reuse outside the
PUA ICPC community is not granted. Third-party dependencies keep their own
licenses.
