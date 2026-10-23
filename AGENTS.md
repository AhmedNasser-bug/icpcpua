# AGENTS.md — icpcpua

Guidance for coding agents working in this repo. Contributors should start with
`CONTRIBUTING.md`; the doc index is `docs/README.md`.

## Commands

pnpm only (see `packageManager` and `pnpm-lock.yaml`; do not use npm/yarn).

```bash
pnpm install            # install (CI uses --frozen-lockfile)
pnpm dev                # dev server on :3000
pnpm build              # production build
pnpm start              # serve the production build
pnpm lint               # eslint (flat config)
pnpm lint:md            # markdownlint
pnpm check:docs         # relative markdown link check
pnpm knip               # dead code and unused dependency check
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest run
pnpm test:coverage      # vitest run --coverage (enforces thresholds)
pnpm test:e2e           # playwright (builds + serves unless E2E_SKIP_BUILD=1)
```

Run `pnpm lint`, `pnpm typecheck` and `pnpm test` after changes; docs changes
also need `pnpm lint:md` and `pnpm check:docs`. Anything that touches
`components/recruitment/*` or `app/(site)/recruitment/page.tsx` should also run
`pnpm test:e2e` (Playwright browsers: `pnpm exec playwright install chromium`).

## Where to look

Routes live in `app/`, feature UI in `components/<feature>/`, static content in
`data/`, shared logic in `lib/` and `hooks/`. Unit tests mirror the source tree
under `tests/`; browser specs live in `e2e/`. Start architecture work from
`docs/architecture/overview.md` and `docs/data-model.md`. Codeforces work is
concentrated in `lib/codeforces/`; the authoritative ranking service is
`lib/leaderboard.ts`.

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
- Leaderboard rank is computed from the persisted `pointsTotal` ledger with
  competition ranking and a university-id tie-break. Codeforces rating and
  solved counts are synchronized display data; do not make them the score.
- Trainee authentication uses Firebase Auth session cookies; `TRAINEE_SESSION_SECRET`
  is obsolete. Deployed production needs the `NEXT_PUBLIC_FIREBASE_*` client
  variables plus Firebase Admin credentials; the cron route needs `CRON_SECRET`
  or `CF_SYNC_SECRET`. Admin routes require the verified `admin` custom claim,
  never an email or request field.
- Codeforces requests must stay behind `lib/codeforces/client.ts` and its
  Firestore rate limiter/locks. Do not call the API from page requests or bypass
  the two-second interval. A failed Firestore reservation must abort the request;
  never add a production in-memory fallback. Lock writes must be fenced by the
  owning token in the same transaction.
- API routes fall back to simulated or seed data when Firebase env vars are
  absent (`lib/firebase-admin.ts`, `lib/supabase.ts`); do not "fix" the
  fallbacks — tests assert on them.
- `components/recruitment/Role3DCanvas.tsx`, `role-canvas-scene.ts` and
  `role-scenes.ts` are excluded from Vitest coverage because jsdom cannot run
  WebGL; `e2e/recruitment.spec.ts` covers them instead.
- `role-canvas-scene` (three.js, ~550 KB) and `lib/bounty` (Supabase, ~240 KB
  on `/join`) are loaded via dynamic `import()` on purpose. Keep them lazy.
- The recruitment registry renders exactly five cards; `technical` is a URL
  alias of `instructor` and must stay out of the card count
  (`data/recruitment/roles.ts`).
- Coverage thresholds live in `vitest.config.mts`; CI runs `test:coverage`
  (which runs the suite once), then lint, markdown lint, the docs link check,
  knip, typecheck and build, plus a separate Playwright job.
- `.next/`, `coverage/`, `playwright-report/` and `test-results/` are ignored
  build artifacts; never commit them.
