# Component Dependency Graph (PUA ICPC)

> Last updated: 2026-10-12.

## Diagram

```mermaid
graph TD
  ROOT["app/layout.tsx"]
  SITE_LAYOUT["app/(site)/layout.tsx"]

  PAGE_HOME["app/(site)/page.tsx"]
  PAGE_EVENTS["app/(site)/events/page.tsx"]
  PAGE_FAQ["app/(site)/faq/page.tsx"]
  PAGE_FEEDBACK["app/(site)/feedback/page.tsx"]
  PAGE_HOF["app/(site)/hall-of-fame/page.tsx"]
  PAGE_JOIN["app/(site)/join/page.tsx"]
  PAGE_LEADER["app/(site)/leaderboard/page.tsx"]
  PAGE_RECRUIT["app/(site)/recruitment/page.tsx"]
  PAGE_REFERRALS["app/(site)/referrals/page.tsx"]
  PAGE_RESOURCES["app/(site)/resources/page.tsx"]
  PAGE_TESTIMONIALS["app/(site)/testimonials/page.tsx"]
  PAGE_SPECS["app/specs/[role] + app/recruitment/specs/[role]"]

  NAV["components/pua-navbar.tsx"]
  FOOTER["components/footer.tsx"]
  LOGO["components/pua-logo.tsx"]
  MARQUEE["components/pua-marquee.tsx"]
  SPEC["components/pua-spec-sheet.tsx"]
  ROLE_PAGE["components/recruitment/RoleSpecPage.tsx"]
  CONSOLE["components/recruitment/RoleInspectorConsole.tsx"]
  CANVAS["components/recruitment/Role3DCanvas.tsx"]

  HOME_SECTIONS["components/home/*"]
  JOIN_SECTIONS["components/join/*"]
  REG_HOOK["hooks/use-trainee-registration.ts"]
  BOUNTY["lib/bounty.ts"]
  SUPABASE["lib/supabase.ts"]
  FAQ_DATA["data/faq.ts"]
  ROLE_DATA["data/recruitment/roles.ts"]
  FIREBASE_ADMIN["lib/firebase-admin.ts"]
  FIREBASE_SCHEMA["lib/firebase-schema.ts"]

  ROOT --> SITE_LAYOUT
  SITE_LAYOUT --> NAV
  SITE_LAYOUT --> MARQUEE
  SITE_LAYOUT --> FOOTER
  NAV --> LOGO

  SITE_LAYOUT --> PAGE_HOME
  SITE_LAYOUT --> PAGE_EVENTS
  SITE_LAYOUT --> PAGE_FAQ
  SITE_LAYOUT --> PAGE_FEEDBACK
  SITE_LAYOUT --> PAGE_HOF
  SITE_LAYOUT --> PAGE_JOIN
  SITE_LAYOUT --> PAGE_LEADER
  SITE_LAYOUT --> PAGE_RECRUIT
  SITE_LAYOUT --> PAGE_REFERRALS
  SITE_LAYOUT --> PAGE_RESOURCES
  SITE_LAYOUT --> PAGE_TESTIMONIALS

  PAGE_HOME --> HOME_SECTIONS
  PAGE_JOIN --> JOIN_SECTIONS
  PAGE_RECRUIT --> CONSOLE
  PAGE_RECRUIT --> CANVAS
  CONSOLE --> CANVAS
  PAGE_FAQ --> FAQ_DATA
  PAGE_REFERRALS --> BOUNTY
  BOUNTY --> SUPABASE
  PAGE_LEADER --> API_LEADER["/api/leaderboard"]

  PAGE_SPECS --> ROLE_PAGE
  ROLE_PAGE --> SPEC
  ROLE_PAGE --> ROLE_DATA
  SPEC --> NAV
  SPEC --> FOOTER
  SPEC --> MARQUEE

  JOIN_SECTIONS --> REG_HOOK
  REG_HOOK --> API_REGISTER["/api/trainees/register"]
  API_REGISTER --> FIREBASE_ADMIN
  API_REGISTER --> FIREBASE_SCHEMA
  API_LEADER --> FIREBASE_ADMIN
  API_POINTS["/api/points/event"] --> FIREBASE_ADMIN
  API_POINTS --> FIREBASE_SCHEMA

  HOME_SECTIONS -.->|"Links to /join, /events, /feedback"| PAGE_JOIN
  FOOTER -.->|"Links to /feedback, /join, /specs/*"| PAGE_FEEDBACK
```

## Analysis Notes

- **Hub nodes:** `app/(site)/layout.tsx` composes the shared chrome (`PuaNavbar`, `Marquee`, `Footer`) for every standard page; `PuaSpecSheet` composes the same chrome for the spec routes.
- **Shared logic:** `useTraineeRegistration` is consumed by both the home `JoinModal` and the `ApplicationSection` on `/join`.
- **Backends:** API routes depend on `lib/firebase-admin` and `lib/firebase-schema`; referral flows depend on `lib/bounty` -> `lib/supabase`.
- **Circular dependencies:** None. Route links are clean string hrefs.
