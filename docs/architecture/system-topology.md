# System Topology (PUA ICPC / Code Strike)

> Last updated: 2026-10-12.

## Diagram

```mermaid
graph TD
  subgraph Client ["Client Browser"]
    UI["Next.js 16 Client Components (React 19)"]
  end

  subgraph Routes ["App Router Subsystem (app/)"]
    ROOT_LAYOUT["app/layout.tsx (fonts, metadata, skip link)"]
    SITE_LAYOUT["app/(site)/layout.tsx (navbar + marquee + footer)"]
    PAGE_HOME["/ (Home Landing Page)"]
    PAGE_EVENTS["/events (Events & Calendar)"]
    PAGE_LEADER["/leaderboard (Leaderboard)"]
    PAGE_JOIN["/join (Cadet Intake)"]
    PAGE_RESOURCES["/resources (Training Armory)"]
    PAGE_TESTIMONIALS["/testimonials (Testimonials)"]
    PAGE_RECRUIT["/recruitment (Committee Recruitment)"]
    PAGE_FEEDBACK["/feedback (Feedback Bucket)"]
    PAGE_REFERRALS["/referrals (Referral Hub)"]
    PAGE_FAQ["/faq (Knowledge Base)"]
    PAGE_HOF["/hall-of-fame (Legends Gallery)"]
    PAGE_SPECS["/specs/[role] + /recruitment/specs/[role] (Spec Sheets, own chrome)"]
    API_ROUTES["/api/trainees/register, /api/leaderboard, /api/points/event"]
  end

  subgraph SharedComponents ["Core UI & Shared Components (components/)"]
    NAV["PuaNavbar (Responsive Nav & Branding)"]
    FOOTER["Footer (Community Links & Feedback CTA)"]
    LOGO["PuaLogo (Dynamic SVG Badge)"]
    MARQUEE["PuaMarquee (Brutalist Banner)"]
    SPEC["PuaSpecSheet + RoleSpecPage (Role Specifications)"]
    CONSOLE["RoleInspectorConsole (3D Role Matrix)"]
    CANVAS["Role3DCanvas (Procedural Three.js Scenes)"]
  end

  subgraph State ["Shared Logic (hooks/, lib/, data/)"]
    REG_HOOK["useTraineeRegistration (intake form state + API call)"]
    BOUNTY["lib/bounty (Supabase referral tracking)"]
    FIREBASE["lib/firebase-schema, firebase-admin"]
    FAQ_DATA["data/faq, data/recruitment/roles"]
  end

  subgraph DesignTokens ["Design System & Tokens (DESIGN.md / globals.css)"]
    PALETTE["Neo-Brutalist Palette: #7B2CBF, #FFD500, #00E5FF, #FF0055, #FFF4E0, #0F0F0F"]
    TYPO["Self-hosted via next/font: Display Fredoka | Body/Code Space Mono | Labels Space Grotesk | Arabic Cairo"]
    ELEVATION["Mechanical Drop Shadows: 4px / 6px / 8px / 10px solid #0F0F0F"]
    VECTORS["Vector Nodes: Corner [ ] Anchor Brackets"]
  end

  UI --> Routes
  ROOT_LAYOUT --> SITE_LAYOUT
  SITE_LAYOUT --> PAGE_HOME
  SITE_LAYOUT --> PAGE_EVENTS
  SITE_LAYOUT --> PAGE_LEADER
  SITE_LAYOUT --> PAGE_JOIN
  SITE_LAYOUT --> PAGE_RESOURCES
  SITE_LAYOUT --> PAGE_TESTIMONIALS
  SITE_LAYOUT --> PAGE_RECRUIT
  SITE_LAYOUT --> PAGE_FEEDBACK
  SITE_LAYOUT --> PAGE_REFERRALS
  SITE_LAYOUT --> PAGE_FAQ
  SITE_LAYOUT --> PAGE_HOF

  PAGE_SPECS --> SPEC
  PAGE_RECRUIT --> CONSOLE
  CONSOLE --> CANVAS
  PAGE_JOIN --> REG_HOOK
  PAGE_REFERRALS --> BOUNTY
  API_ROUTES --> FIREBASE
  PAGE_FAQ --> FAQ_DATA
  SPEC --> FAQ_DATA

  SITE_LAYOUT --> NAV
  SITE_LAYOUT --> FOOTER
  SITE_LAYOUT --> MARQUEE
  SPEC --> NAV
  SPEC --> FOOTER
  SPEC --> MARQUEE
  NAV --> LOGO
  SharedComponents --> DesignTokens
```

## Analysis Notes

- **Route groups:** All standard marketing pages live in `app/(site)/` and inherit the shared navbar, marquee, and footer from `app/(site)/layout.tsx`. The two spec-sheet routes stay outside the group because `PuaSpecSheet` renders its own dir-aware chrome.
- **Critical paths:** `PuaNavbar` and `Footer` serve as global site anchors; `useTraineeRegistration` is the single entry point for cadet intake from both the home modal and `/join`.
- **Backends:** Firestore (via `firebase-admin`) powers trainee registration, point events, and the leaderboard API; Supabase powers referral bounties in `lib/bounty.ts`.
- **Risk areas:** Keep Tailwind v4 `@theme` tokens and custom classes (`vector-node`, `btn-solid`, `shadow-solid`, `shadow-neo`, `stipple-bg`) consistent across new pages.
