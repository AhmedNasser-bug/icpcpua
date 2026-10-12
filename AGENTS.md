# AGENTS.md — icpcpua

Guidance for agents and contributors working in this repo.

## Commands

pnpm only (see `packageManager` and `pnpm-lock.yaml`; do not use npm/yarn).

```bash
pnpm install            # install (CI uses --frozen-lockfile)
pnpm dev                # dev server on :3000
pnpm build              # production build
pnpm start              # serve the production build
pnpm lint               # eslint (flat config)
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest run
pnpm test:coverage      # vitest run --coverage (enforces thresholds)
pnpm test:e2e           # playwright (builds + serves unless E2E_SKIP_BUILD=1)
```

Run `pnpm lint`, `pnpm typecheck` and `pnpm test` after changes. Anything that
touches `components/recruitment/*` or `app/(site)/recruitment/page.tsx` should
also run `pnpm test:e2e` (Playwright browsers: `pnpm exec playwright install chromium`).

## Structure

```text
app/                      App Router
  layout.tsx              fonts, metadata, skip link
  (site)/                 shared chrome (navbar + marquee + footer) pages
  specs/[role]/           spec sheet route
  recruitment/specs/[role]/ alias of the spec sheet route
  api/                    route handlers (leaderboard, points, registration)
components/<feature>/     feature-scoped UI; shared chrome at components/*.tsx
components/spec-sheet/    spec sheet sections
data/                     static registries (recruitment roles, FAQ)
hooks/                    shared hooks
lib/                      firebase-admin, supabase, bounty, errors, schema
tests/                    Vitest suites mirroring source folders
e2e/                      Playwright specs + fixtures
docs/architecture/        living diagrams (keep in sync with imports/routes)
docs/cleanup/             cleanup plan and reports
```

## Conventions

- TypeScript strict mode; `@/*` maps to the repo root.
- Components: `kebab-case.tsx` files, named exports; recruitment components use
  PascalCase filenames.
- Feature folders own their components; put shared code next to its owner
  instead of a catch-all `utils`.
- Styling is Tailwind v4 with the neo-brutalist tokens in `app/globals.css`
  (`#0F0F0F` borders/shadows, `#7B2CBF`, `#FFD500`, `#00E5FF`, `#FF0055`,
  `#FFF4E0`). Custom utilities: `vector-node`, `btn-solid`, `shadow-solid`,
  `shadow-neo`, `filter-pill`, `text-shadow-cyan`.
- Do not add comments unless they explain non-obvious intent.

## Gotchas

- Tests mock Supabase and Firebase Admin; no credentials needed. E2E fixtures
  abort any request to Supabase/Firebase/Google hosts and fail the test.
- `components/recruitment/Role3DCanvas.tsx`, `role-canvas-scene.ts` and
  `role-scenes.ts` are excluded from Vitest coverage because jsdom cannot run
  WebGL; `e2e/recruitment.spec.ts` covers them instead.
- `role-canvas-scene` (three.js, ~550 KB) and `lib/bounty` (Supabase, ~240 KB
  on `/join`) are loaded via dynamic `import()` on purpose. Keep them lazy.
- The recruitment registry renders exactly five cards; `technical` is a URL
  alias of `instructor` and must stay out of the card count
  (`data/recruitment/roles.ts`).
- Coverage thresholds live in `vitest.config.mts`; CI runs `test:coverage`
  (which runs the suite once), then lint, typecheck and build.
- `lib/supabase.ts` falls back to a public anon key when env vars are absent;
  `lib/firebase-admin.ts` degrades to `adminDb = null` and API routes return
  seed/fallback data.
- `.next/`, `coverage/`, `playwright-report/` and `test-results/` are ignored
  build artifacts; never commit them.
