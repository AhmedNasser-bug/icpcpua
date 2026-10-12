# Cleanup report — icpcpua

Date: 2026-10-12 · Branch: `chore/cleanup-2026-10-12` (base `main` @ `ac310c1`)

> Historical record. The work described here was merged into `main` with
> rewritten commit SHAs, so the SHAs quoted below are the original branch's
> commits and are not reachable from `main`. Revert the equivalent `main`
> commits when following the rollback notes. Open items listed near the end
> (for example the knip gate) have since been resolved; see `CHANGELOG.md`.

## Summary

Behavior-preserving cleanup across a series of one-concern commits. Every commit passed
`pnpm lint`, `pnpm typecheck` and `pnpm test`; the final tree also passed
`pnpm test:coverage`, a clean install + build from scratch, a startup smoke
test and the full Playwright suite (14/14, including a strengthened
recruitment spec).

Headline results:

- `/recruitment` initial JS: **1158.9 KB → 647.8 KB (−44%)** by lazy-loading the
  Three.js scene module.
- `/join` initial JS: **832.9 KB → 605.6 KB (−27%)** by lazy-loading the
  Supabase bounty client until a referral is actually credited.
- `pnpm audit --prod`: **48 advisories (2 critical, 22 high) → 1 moderate**.
- Startup: **~1.65 s → ~0.97 s** median (3 runs each).
- CI no longer runs the 180-test suite twice.

## Removed

| Item | Evidence |
|---|---|
| `export` on `RoleScene`, `ScoutLeaderboardEntry`, `TraineeRegistrationForm` | knip + ts-prune + manual grep: only referenced inside their own module |
| `export` on `MountRoleSceneOptions` | same check after extraction |
| Redundant CI `pnpm test` step | `test:coverage` runs the same suite and fails on test failures |
| Duplicate body of the Three.js effect in `Role3DCanvas.tsx` | moved to `role-canvas-scene.ts` (mechanical diff showed only intended plumbing changes) |

No source files were deleted. `@testing-library/dom` was **kept**: depcheck's
"unused" flag is a false positive because `@testing-library/react` declares it
as a peer dependency.

## Moved

| Old | New |
|---|---|
| `Role3DCanvas.tsx` mount/teardown effect body (~170 lines) | `components/recruitment/role-canvas-scene.ts` (`mountRoleScene`) |
| Three.js import in `Role3DCanvas` | dynamic `import()` inside the mount effect |
| `lib/bounty` import in `components/join/application-section.tsx` | dynamic `import()` inside the post-registration callback |

Public routes, API shapes, DOM output and data formats are unchanged. The
pre-rendered HTML still contains all six canvas containers on `/recruitment`
(verified in `.next/server/app/recruitment.html`).

## Dependencies

Updated (patch/minor only): next `16.1.6 → 16.3.8` (minimum version patched for
every Next advisory; 16.4.0 was tried but builds ~3 s slower), react/react-dom
`19.2.4 → 19.3.0`, eslint-config-next `16.3.8`, postcss `8.5.29`, tailwindcss
and `@tailwindcss/postcss` `4.3.3`, vitest and `@vitest/coverage-v8` `5.0.4`,
tw-animate-css `1.4.0`, `@types/react(-dom)` `19.3.0`,
`@supabase/supabase-js 2.117.3`.

Not updated (majors, need approval): eslint 10, typescript 7, framer-motion 14,
lucide-react 1.x, `@types/node` 26.

## Before / after

| Metric | Baseline (main) | Final | Notes |
|---|---|---|---|
| Tracked files | 203 | 207 | +AGENTS.md, +cleanup docs, +role-canvas-scene.ts |
| Source LOC (excl. lockfile/public) | 14,538 | 14,808 | +270: new module + docs |
| Runtime / dev deps | 8 / 17 | 8 / 17 | versions updated, count unchanged |
| Clean `node_modules` size | 682 MB | 729 MB | +47 MB from security updates |
| `pnpm test` (180 tests) | 12.7 s | 12.1 s | medians of 3 |
| `pnpm test:coverage` | 15.1 s | 15.9 s | medians of 3; noise-level |
| `pnpm lint` | 13.0 s | 9.5 s | single runs |
| `pnpm typecheck` | 7.5 s | 5.8 s | single runs |
| `pnpm build` | 20.7 s | 23.7 s | medians of 3; +3 s is the Next security patch |
| Startup (serve, ready) | ~1.65 s | ~0.97 s | medians of 3 |
| `.next` deployable (server+static) | 20.4 MB | 21.3 MB | flat; 76 MB local Turbopack cache is ephemeral |
| Initial JS `/` | 725.3 KB | 737.7 KB | +12 KB from dependency updates |
| Initial JS `/recruitment` | 1158.9 KB | 647.8 KB | **−44%** |
| Initial JS `/join` | 832.9 KB | 605.6 KB | **−27%** |
| Initial JS all 12 routes (total) | 9279.0 KB | 8680.1 KB | −6.5% |
| Coverage (statements) | 80.24% | 80.27% | identical test set |
| E2E | 14 pass / 17.6 s | 14 pass / ~20 s | spec now also asserts the console canvas + role-switch remount |
| `pnpm audit --prod` | 48 (2 crit, 22 high) | 1 moderate | remaining: uuid 9.0.1 via firebase-admin's gaxios (narrow `buf` path) |

Bundle numbers are raw (uncompressed) bytes served in the initial HTML for each
route, measured against the same 12 routes before and after.

## Verification

- After every commit: `pnpm lint`, `pnpm typecheck`, `pnpm test` — green.
- Final: `pnpm test:coverage` (180/180, thresholds 67/70/54/67 enforced),
  `rm -rf node_modules && pnpm install --frozen-lockfile` (lockfile in sync),
  clean `pnpm build`, startup smoke test (`/`, `/specs/technical`,
  `/api/leaderboard` returned 200), `pnpm test:e2e` 14/14.
- Independent fresh-context reviewer audited the full diff; its findings were
  addressed: stale PLAN execution list, architecture diagrams synced,
  `MountRoleSceneOptions` un-exported, e2e now covers the console canvas and the
  async remount, and `agentRules: false` keeps `next dev` from editing
  AGENTS.md. It confirmed no test, lint rule, type setting or threshold was
  weakened, and that the coverage exclusion follows the code that was already
  excluded before the move (coverage returned to the exact baseline numbers).

## Skipped items and needs decision

- **`public/` assets**: the two unreferenced zips (15.7 MB) were removed in a
  follow-up cleanup. The remaining 70 unreferenced images are kept because they
  are publicly served URLs that may be linked externally (marketing/social).
- **`.Jules/palette.md` and `docs/design/*.html`**: removed in the same
  follow-up cleanup (dated agent note and superseded mockups, referenced
  nowhere).
- **`components.json`**: unreferenced and its `@/lib/utils` alias is broken, but
  the v0 integration may read it when generating components, so it was kept.
- **Duplication between `join-modal.tsx` and `application-section.tsx`**
  (jscpd: 118 duplicated lines): intentionally not merged because the two forms
  differ in labels, aria attributes and Tailwind classes; merging risks
  user-visible output changes. The shared logic already lives in
  `use-trainee-registration.ts`.
- **Vitest jsdom recreation** (53% of suite time): `pool: 'vmThreads'` could
  help, but changing pool/isolation risks cross-test pollution; left as-is.
- **Add knip to CI**: would add a devDependency and ~50 transitive packages;
  proposed, not applied.
- **uuid advisory**: requires a major override of firebase-admin's transitive
  gaxios/uuid; not worth the risk for a moderate issue with a narrow trigger.
- **Postgres/Firestore indexes**: no new proposals this pass.

## Remaining risks and rollback

- Lazy loading changes when Three.js/Supabase are fetched (after mount / on
  referral submit) and now logs rather than throws if the module fails to load.
  Normal behavior is unchanged; E2E covers canvas mounting and remounting.
- Build time is ~3 s slower because of the Next security patch; reverting Next
  reintroduces 2 critical RCE advisories.
- Dependency majors were left untouched; no visual regression suite exists, so
  the Tailwind 4.2 → 4.3 CSS output was only checked by build + E2E.

Rollback: revert commits on `chore/cleanup-2026-10-12` in reverse order.
Each commit is self-contained; the risky ones are `c24049a` (lazy Three.js),
`3e9f278` (lazy Supabase), `7d15c8e` + `a15f693` (dependencies) and
`472fd46` (CI). `git revert <sha>` restores the previous behavior.
