# icpcpua

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_qOV5juIZw5VroPia66WCyePYKGWU)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the home page by modifying `app/(site)/page.tsx`. The page auto-updates as you edit the file.

## Testing

The unit and component suite runs on [Vitest](https://vitest.dev) with React Testing Library and jsdom:

```bash
pnpm test           # run the suite once (CI mode)
pnpm test:coverage  # run the suite with coverage thresholds (CI mode)
pnpm test:watch     # re-run on change
```

Tests mock Supabase and Firebase Admin, so no production credentials or live databases are required.
Coverage thresholds are configured in `vitest.config.mts` and enforced by CI.

The browser layer runs on [Playwright](https://playwright.dev) against a production build:

```bash
pnpm exec playwright install chromium  # once per machine (downloads the browser)
pnpm test:e2e                          # build, start on port 3000 and run headless
pnpm test:e2e:ui                       # interactive UI mode
```

`pnpm test:e2e` builds the app and serves it on `http://localhost:3000` before
the specs run; set `E2E_SKIP_BUILD=1` to reuse an existing build. The shared
fixture blocks Firebase and Supabase traffic and fails the test if any is
attempted, so no credentials are needed. A dedicated `e2e` job in
`.github/workflows/ci.yml` runs the same suite.

### Testing boundaries

`components/recruitment/Role3DCanvas.tsx` and the procedural scenes in
`components/recruitment/role-scenes.ts` are intentionally excluded from the
Vitest suite and from coverage (`vitest.config.mts`). They require a real
WebGL/Three.js rendering context that jsdom cannot provide, so unit tests would
only exercise brittle mocks instead of observable 3D behavior. The E2E suite
covers that boundary instead: `e2e/recruitment.spec.ts` asserts that each of
the five recruitment cards mounts a visible canvas and obtains a live WebGL
context with no context-loss errors. It does not compare pixels and is not a
visual regression check.

The surrounding `RoleInspectorConsole` is unit-tested with `Role3DCanvas`
mocked, so the console's selection, telemetry and dossier logic stays covered.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/AhmedNasser-bug/icpcpua" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
