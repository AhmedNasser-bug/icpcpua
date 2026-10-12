# Cleanup plan — icpcpua

Date: 2026-10-12 · Branch: `chore/cleanup-2026-10-12`

Behavior-preserving cleanup of the PUA ICPC Next.js site. Baseline was taken on
`main` at `ac310c1` before any edit.

## Stack and commands

- Next.js 16.1.6 App Router, React 19.2.4, TypeScript 5.7.3, Tailwind CSS 4
- pnpm 10.34.6 (only lockfile present), Node 22
- Tests: Vitest 5 + Testing Library (jsdom), Playwright (chromium)
- CI: `.github/workflows/ci.yml` — `quality` job (test, coverage, lint, typecheck,
  build) and `e2e` job (build + Playwright).

## Baseline (main @ ac310c1)

| Metric | Value |
|---|---|
| Tracked files | 203 |
| Source LOC (excl. lockfile/public) | 14,538 |
| Runtime deps / dev deps | 8 / 17 |
| `node_modules` size | 1.1 GB (pnpm store links) |
| `pnpm test` (180 tests, 25 files) | 13.2 s — pass |
| `pnpm test:coverage` | 11.9 s — pass (80.2% stmts) |
| `pnpm lint` | 13.0 s — pass |
| `pnpm typecheck` | 7.5 s — pass |
| `pnpm build` | 18.8 s — pass |
| `.next` / static chunks | 22 MB / 2.0 MB |
| `pnpm test:e2e` (14 tests, skip build) | 17.6 s — pass |
| Startup (`pnpm start` → HTTP 200) | ~1.2 s |
| Initial JS `/` | 725.3 KB (+84.3 KB CSS) |
| Initial JS `/recruitment` | 1158.9 KB (+84.3 KB CSS) |
| Initial JS `/join` | 832.9 KB |
| Public assets | 72 files, 30 MB, **zero references in repo** |
| `pnpm audit --prod` | 48 advisories (2 critical, 22 high) |

## Findings

### Tier 1 — safe and mechanical

| # | Finding | Evidence | Risk |
|---|---|---|---|
| 1.1 | `RoleScene` exported but only used inside `role-scenes.ts` | knip 5.88.1 + ts-prune both flag it; `git grep RoleScene` shows only the declaring file | none |
| 1.2 | `ScoutLeaderboardEntry` exported but only used inside `scout-leaderboard.tsx` | same two tools; grep shows only declaring file | none |
| 1.3 | `TraineeRegistrationForm` exported but only used inside `use-trainee-registration.ts` | same two tools; grep shows only declaring file | none |
| 1.4 | ~~`@testing-library/dom` unused devDependency~~ **false positive, kept** | depcheck flags it, but `@testing-library/react` declares it as a **peer** (`peerDependencies["@testing-library/dom"] = ^10.0.0`), so the explicit declaration is correct; knip does not flag it | skip |
| 1.5 | README documents `npm run dev` / `yarn dev` although the repo is pnpm-only (`pnpm-lock.yaml`, `packageManager`) | `README.md:15-21` vs `package.json:5` | none |
| 1.6 | `docs/architecture/dependency-graph.md` is accurate on spot-check; one edge is missing (`components/home/join-modal.tsx` also consumes `hooks/use-trainee-registration.ts`) | `JoinModal` imports the hook; the doc only draws `JOIN_SECTIONS --> REG_HOOK` | none (docs) |
| 1.7 | `.Jules/palette.md` is a dated AI-agent note (2026-04-27) referenced nowhere | `git grep Jules` → only the file itself | low — list as proposal |
| 1.8 | 72 files / 30 MB under `public/` are unreferenced anywhere in the repo (incl. two zips, 15.7 MB) | loop over `git ls-files public` with `git grep --fixed-strings` → 0 matches each | **medium** — public URLs; see Needs decision |

### Tier 2 — structure

The layout is already idiomatic: `app/` route groups, `components/<feature>/`,
`lib/`, `hooks/`, `data/`, `tests/`, `e2e/`, `docs/`. No file is unreferenced
(import-graph script over all `.ts/.tsx`), no circular imports found. No moves
proposed except the Tier 4 extraction of the 3D scene module (own commit).

- `app/specs/[role]/page.tsx` and `app/recruitment/specs/[role]/page.tsx` are
  byte-identical 16-line glue over `RoleSpecPage`. Both are public routes, so
  neither can be deleted. Leaving as-is (duplication is trivial and any shared
  re-export would couple two public routes).

### Tier 3 — technical debt

| # | Finding | Evidence | Decision |
|---|---|---|---|
| 3.1 | `components/home/join-modal.tsx` and `components/join/application-section.tsx` duplicate form markup (jscpd: 3 clones, 118 lines) | `jscpd --min-lines 8 --min-tokens 60` | **leave** — copies differ in labels, aria attributes and classes; merging would change user-visible output |
| 3.2 | Inline vector-node spans duplicated vs `VectorNodes` in several files | `RoleInspectorConsole.tsx:85-88`, `app/(site)/referrals/page.tsx:164-167`, `role-card.tsx:50-51` | leave — markup variants differ (`z-10/z-30`, sizes); cosmetic only |
| 3.3 | `pua-navbar.tsx:31-35` and `use-trainee-registration.ts:54-59` set state during render | React-endorsed "adjust state on prop change" pattern; covered by tests | leave |
| 3.4 | Hardcoded Supabase anon key fallback in `lib/supabase.ts:6` | publishable anon key (RLS-gated), used as fallback when env missing | report only; removing changes behavior |
| 3.5 | Vulnerable deps: next 16.1.6 (2 critical, DoS), postcss 8.5.6, sharp, uuid, nanoid, source-map-js transitives | `pnpm audit --prod` | **update** patch/minor within semver (Next 16.4.0) |
| 3.6 | Test-only duplication (API test mocks, hook test blocks) | jscpd | leave — test clarity beats DRY |

### Tier 4 — efficiency (measured)

| # | Finding | Baseline evidence | Plan |
|---|---|---|---|
| 4.1 | `three` (546 KB chunk `c5daef07…js`) is in the **initial** `/recruitment` JS because `Role3DCanvas` is statically imported by `RoleCard` and `RoleInspectorConsole` | `/recruitment` HTML includes the THREE chunk; route JS 1158.9 KB vs 577 KB on sibling routes | extract scene code to `role-canvas-scene.ts` (pure move), then load it with dynamic `import()` inside `useEffect`; canvas container stays server-rendered so layout is unchanged |
| 4.2 | CI runs the whole unit suite twice (`pnpm test` then `pnpm test:coverage`) | `.github/workflows/ci.yml:36-40` | drop the redundant `pnpm test` step; coverage run executes the same tests |
| 4.3 | Vitest spends 53% of time recreating jsdom (25×) | Vitest output: "Environment jsdom was created 25 times · 56.91s total, 53%" | investigate `pool`/`isolate` only if low-risk; not part of this pass |

## Execution order (one concern per commit)

1. docs: plan + baseline
2. refactor: un-export module-local types (Tier 1.1–1.3)
3. chore(deps): drop unused `@testing-library/dom` (Tier 1.4)
4. docs: fix README commands and stale architecture claims (Tier 1.5–1.6)
5. refactor: move three.js scene code into `role-canvas-scene.ts` (pure move)
6. perf: lazy-load the 3D scene module (Tier 4.1)
7. chore(deps): patch/minor + security updates (Tier 3.5)
8. ci: drop duplicate unit-test step (Tier 4.2)
9. docs: AGENTS.md + cleanup report

## Needs decision (not executed)

- Delete unreferenced `public/` assets (30 MB; two zips 15.7 MB). They are not
  referenced by any tracked file, but they are publicly served URLs and may be
  linked externally (marketing/social). Evidence in Tier 1.8.
- Remove `.Jules/palette.md` (dated AI-agent note).
- Add a dead-code/unused-dependency gate (knip) to CI: adds a devDependency and
  ~50 transitive packages, so it needs approval.
- Postgres/Firestore index proposals: none identified this pass.
