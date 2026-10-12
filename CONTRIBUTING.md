# Contributing

This is the website for the PUA ICPC training community. Contributions are
welcome as pull requests against `main`; CI must pass before merge.

## Prerequisites

- Node.js 22 (what CI uses).
- pnpm 10 via [Corepack](https://pnpm.io/installation): `corepack enable pnpm`.
  The repo is pnpm-only (`packageManager` field and `pnpm-lock.yaml`); do not
  use npm or yarn.

## Setup

```bash
git clone https://github.com/AhmedNasser-bug/icpcpua.git
cd icpcpua
pnpm install
pnpm dev
```

The dev server runs on <http://localhost:3000>. No credentials are needed:
without environment variables the API routes serve simulated or seed data. See
[docs/configuration.md](docs/configuration.md) to connect real Firebase and
Supabase projects.

## Verification commands

Run these before opening a pull request:

```bash
pnpm lint          # eslint (flat config)
pnpm typecheck     # tsc --noEmit
pnpm test          # Vitest, one run
```

Anything that touches `components/recruitment/*` or
`app/(site)/recruitment/page.tsx` should also run the browser suite:

```bash
pnpm exec playwright install chromium   # once per machine
pnpm test:e2e                           # builds, serves on :3000, runs Playwright
```

Set `E2E_SKIP_BUILD=1` to reuse an existing production build. The shared
fixture in `e2e/fixtures.ts` aborts requests to Firebase, Supabase and Google
hosts and fails the test if any are attempted, so the suite never touches a live
backend.

Use `pnpm test:watch` while developing and `pnpm test:coverage` to see the
coverage report; `vitest.config.mts` enforces the thresholds that CI checks.
WebGL code (`Role3DCanvas.tsx`, `role-canvas-scene.ts`, `role-scenes.ts`) is
covered by Playwright instead and is excluded from Vitest coverage.

## CI

`.github/workflows/ci.yml` runs two jobs on every push to `main` and every pull
request:

- **quality** — `pnpm test:coverage`, then `pnpm lint`, `pnpm typecheck` and
  `pnpm build`.
- **e2e** — a production build followed by `pnpm test:e2e` with
  `E2E_SKIP_BUILD=1`; the Playwright report is uploaded as an artifact.

## Commits and branches

- Branch from `main` and open a pull request; CI must pass before merge.
- Keep one concern per commit. Prefix messages with the type used in this
  repo's history: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`,
  `chore:` or `ci:`.
- Update the docs in `docs/` when behaviour changes; commands and paths in
  docs should stay verified against the code.

## Code conventions

See [AGENTS.md](AGENTS.md) for the TypeScript, component and styling
conventions, and [DESIGN.md](DESIGN.md) for the visual system. In short:
strict TypeScript, `@/*` imports from the repo root, feature folders under
`components/<feature>/`, and Tailwind v4 with the neo-brutalist tokens in
`app/globals.css`.

## v0 integration

The repository is linked to a [v0](https://v0.app) project. v0 pushes its
generated changes directly to this repo, so expect commits touching the same
components. `next.config.mjs` sets `agentRules: false` to keep `AGENTS.md`
hand-maintained.

## Questions

Open an issue at <https://github.com/AhmedNasser-bug/icpcpua/issues>.
