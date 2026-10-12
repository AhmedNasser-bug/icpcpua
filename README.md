# PUA ICPC

Website for the ICPC training community at Pharos University in Alexandria: the
training curriculum, events calendar, live cadet leaderboard, cadet
registration, committee recruitment specs, referral bounties and a feedback
bucket. Production runs at <https://icpcpua.vercel.app>.

It is a public marketing and community site, not a contest judge. There is no
authentication, no Codeforces sync job and the feedback bucket is local-only.
Registration and points are backed by Cloud Firestore; referral bounties live in
Supabase.

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

Without Firebase credentials you get the local fallback:

```json
{
  "success": true,
  "source": "local_cache",
  "count": 3,
  "leaderboard": [
    {
      "rank": 1,
      "handle": "dp_master",
      "fullName": "Youssef Tarek",
      "rating": 1795,
      "solved": 412,
      "pointsTotal": 960,
      "track": "level_1",
      "initials": "YT",
      "color": "#FFD500"
    }
  ]
}
```

`source` becomes `seed_defaults` when Firestore is reachable but empty, and
`firestore` when real trainees exist. Use the `track` query parameter
(`all`, `level_1`, `level_2`) and `limit` (default 50).

## Configuration

To use real backends, create a git-ignored `.env.local` with the Firebase
service-account variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`) and optionally `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Every variable, its default and the fallback
contract is documented in [docs/configuration.md](docs/configuration.md).

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

Unit and component tests run on Vitest with React Testing Library and jsdom, and
mock Supabase and Firebase Admin, so no credentials or databases are required.
The threshold that CI enforces lives in `vitest.config.mts`.

Playwright runs against a production build. Install the browser once with
`pnpm exec playwright install chromium`, then run `pnpm test:e2e`; set
`E2E_SKIP_BUILD=1` to reuse an existing build. The fixture in
`e2e/fixtures.ts` blocks Firebase, Supabase and Google hosts and fails the test
if any request is attempted.

Three.js code (`components/recruitment/Role3DCanvas.tsx`,
`role-canvas-scene.ts` and `role-scenes.ts`) is excluded from Vitest coverage
because jsdom cannot run WebGL; `e2e/recruitment.spec.ts` covers it instead.
Details and PR expectations are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Deployment

Production is hosted on Vercel at <https://icpcpua.vercel.app> and is linked to
a [v0](https://v0.app) project, which pushes commits directly to this repo;
merges to `main` deploy through that project. CI
(`.github/workflows/ci.yml`) runs the coverage suite, lint, typecheck and build,
plus the Playwright job, on every push and pull request.

## Documentation

- [docs/README.md](docs/README.md) — documentation index.
- [docs/architecture/overview.md](docs/architecture/overview.md) — routes,
  data flows and backend fallbacks.
- [docs/configuration.md](docs/configuration.md) — environment variables.
- [docs/data-model.md](docs/data-model.md) — Firestore and Supabase shapes.
- [CHANGELOG.md](CHANGELOG.md) — notable changes.
- [DESIGN.md](DESIGN.md) — design tokens and visual rules.
- [AGENTS.md](AGENTS.md) — conventions and gotchas for coding agents.

## Contributing and help

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, verification commands and the
commit/PR flow. Open an issue at
<https://github.com/AhmedNasser-bug/icpcpua/issues>.

## License

Proprietary, all rights reserved. See [LICENSE](LICENSE); reuse outside the
PUA ICPC community is not granted. Third-party dependencies keep their own
licenses.
