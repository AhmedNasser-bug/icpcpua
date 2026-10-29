# PUA ICPC Community design system

## Design rationale

- The original warm paper canvas, dark ink, and vivid cyan / violet / yellow accents preserve the site's identity.
- Updated type and sizing improve readability without changing the familiar color theme.
- A fine grid and code-like labels give the homepage a technical character without competing with content.
- Noto Sans Arabic supports Latin and Arabic in one readable family; DM Mono is reserved for code and compact data.
- 8px spacing, clear section widths, and larger controls make the system predictable on phones and desktops.
- Light and dark themes share semantic roles, with independently tuned colors rather than simple inversion.

## Tokens

| Category | Token / scale | Light | Dark / value |
| --- | --- | --- | --- |
| Canvas | `--color-canvas` | `#FFF4DF` | `#171715` |
| Surface | `--color-surface` | `#FFFAF0` | `#22211E` |
| Raised surface | `--color-surface-raised` | `#F4EEE2` | `#2B2925` |
| Text | `--color-text` | `#191712` | `#F4EFE4` |
| Muted text | `--color-muted` | `#625C52` | `#B9B3A8` |
| Border | `--color-border` | `#D8CBB4` | `#454139` |
| Primary | `--color-primary` | `#8124CE` | `#D6A7FF` |
| Primary hover | `--color-primary-hover` | `#6B1CAE` | `#E5CAFF` |
| Accent | `--color-accent` | `#765000` | `#F8D961` |
| Secondary | `--color-secondary` | `#00656D` | `#79DEDC` |
| Success | `--color-success` | `#205D42` | `#91D4A7` |
| Warning | `--color-warning` | `#713F12` | `#F8D961` |
| Error | `--color-error` | `#9C2B27` | `#FF9188` |
| Info | `--color-info` | `#2457A6` | `#9ABAFF` |
| Focus | `--color-focus` | `#8124CE` | `#D6A7FF` |
| Typography | Heading and body | Noto Sans Arabic, 400–800 | Same |
| Typography | Code / data | DM Mono, 400–500 | Same |
| Type scale | Caption / body / lead | 12 / 16 / 18px | 1.45–1.65 line height |
| Type scale | H6 / H5 / H4 / H3 / H2 / H1 | 16 / 18 / 20 / 24 / 32 / 48px | 1.2 line height |
| Spacing | `--space-1` to `--space-8` | 8 / 16 / 24 / 32 / 40 / 48 / 64 / 80px | 8px grid |
| Radius | `--radius-sm/md/lg` | 6 / 10 / 16px | Same |
| Shadow | `--shadow-sm/md` | `0 2px 8px rgb(16 42 67 / 7%)` / `0 12px 32px rgb(16 42 67 / 10%)` | Softer black shadows |
| Layout | Content / page | 1200px / 1000px max | 24px minimum gutters |
| Responsive | Breakpoints | 680 / 900 / 1200 / 1440px | Mobile-first |

Noto Sans Arabic and DM Mono are available from Google Fonts. Both are loaded with
`display=swap`, with system sans-serif / monospace fallbacks. Keep body copy at 16px
or larger and paragraphs near 60–75 characters per line.

### WCAG contrast pairs

Ratios use the WCAG relative-luminance formula. Normal text requires 4.5:1; large
text requires 3:1. The selected text and action pairs below exceed 4.5:1.

| Text or action | Background | Contrast |
| --- | --- | ---: |
| `#191712` body text | `#FFF4DF` canvas | 16.42:1 |
| `#625C52` muted text | `#FFF4DF` canvas | 6.07:1 |
| `#8124CE` links | `#FFF4DF` canvas | 6.26:1 |
| White button label | `#8124CE` primary button | 6.82:1 |
| `#765000` accent text | `#FFF4DF` canvas | 6.60:1 |
| `#00656D` secondary text | `#FFF4DF` canvas | 6.25:1 |
| `#205D42` success text | `#FFF4DF` canvas | 7.12:1 |
| `#713F12` warning text | `#FFF4CF` warning surface | 7.88:1 |
| `#9C2B27` error text | `#FFF4DF` canvas | 6.91:1 |
| `#2457A6` info text | `#FFF4DF` canvas | 6.44:1 |
| `#F4EFE4` body text | `#22211E` dark surface | 14.04:1 |
| `#B9B3A8` muted text | `#22211E` dark surface | 7.73:1 |
| `#D6A7FF` links / primary | `#22211E` dark surface | 8.30:1 |
| Dark button label | `#D6A7FF` dark primary button | 9.24:1 |
| `#F8D961` accent text | `#22211E` dark surface | 11.57:1 |
| `#79DEDC` secondary text | `#22211E` dark surface | 10.19:1 |
| `#91D4A7` success text | `#22211E` dark surface | 9.34:1 |
| `#F8D961` warning text | `#22211E` dark surface | 11.57:1 |
| `#FF9188` error text | `#22211E` dark surface | 7.40:1 |
| `#9ABAFF` info text | `#22211E` dark surface | 8.31:1 |

## Component examples

Use semantic HTML and the classes in `src/shared/styles/global.css`. The examples illustrate
patterns for future contest registration and standings screens; they do not imply
new routes or backend behavior.

### Learning roadmaps

The Roadmaps page uses a centered, responsive card grid, difficulty filter buttons, and the
Training cross-link. Cards use a fixed-height cover region with `object-fit: cover`, pill
badges, a clamped description, and a full-width primary action. Signed-in students see a
direct link when registration is open for a cycle; cycle availability without an open
cycle is labeled accurately, anonymous users are prompted to sign in, and failed
availability requests are shown rather than treated as an empty cycle list. Difficulty
badges appear only for recognized data. Use the existing semantic color and spacing tokens
instead of introducing page-specific utility frameworks.

### Header

```html
<header class="site-header">
  <a class="brand" href="/" aria-label="PUA ICPC Community home">
    <img class="brand-logo" src="/pua-icpc-logo.png" alt="">
  </a>
  <button class="icon-button menu-toggle" type="button"
          aria-expanded="false" aria-controls="primary-navigation">
    <span class="sr-only">Open navigation</span>
  </button>
  <nav id="primary-navigation" class="main-nav" aria-label="Main navigation">
    <a class="nav-link active" href="/" aria-current="page">Events</a>
    <a class="nav-link" href="/roadmaps">Roadmaps</a>
    <a class="nav-link" href="/leaderboard">Leaderboard</a>
    <a class="button button-dark nav-join" href="/login">Join the community</a>
  </nav>
</header>
```

Keep primary navigation to seven items or fewer; move account-specific destinations
into the account menu.

### Hero and role entry cards

```html
<main>
  <section class="hero" aria-labelledby="page-title">
    <div class="hero-copy">
      <span class="eyebrow">PUA ICPC COMMUNITY</span>
      <h1 id="page-title">Learn together.<br><span>Compete together.</span></h1>
      <p>Build problem-solving skills and find your next contest.</p>
      <a class="button button-dark" href="/events">Explore events</a>
    </div>
    <div class="hero-art" aria-hidden="true"></div>
  </section>
  <section class="role-entry-grid" aria-label="Choose your community path">
    <article class="role-entry-card">
      <h2>Contestants</h2><p>Find practice, teammates, and upcoming contests.</p>
      <a href="/events">Explore events <span aria-hidden="true">→</span></a>
    </article>
    <article class="role-entry-card">
      <h2>Coaches</h2><p>Support a team and follow structured learning paths.</p>
      <a href="/roadmaps">Browse roadmaps <span aria-hidden="true">→</span></a>
    </article>
    <article class="role-entry-card">
      <h2>Volunteers &amp; judges</h2><p>Help make the contest experience run smoothly.</p>
      <a href="/login">Get involved <span aria-hidden="true">→</span></a>
    </article>
  </section>
</main>
```

### Registration stepper

```html
<ol class="registration-stepper" aria-label="Registration progress">
  <li class="registration-step is-complete">
    <span class="registration-step-indicator" aria-hidden="true">✓</span> Team
  </li>
  <li class="registration-step" aria-current="step">
    <span class="registration-step-indicator" aria-hidden="true">2</span> Members
  </li>
  <li class="registration-step">
    <span class="registration-step-indicator" aria-hidden="true">3</span> Details
  </li>
  <li class="registration-step">
    <span class="registration-step-indicator" aria-hidden="true">4</span> Review
  </li>
</ol>
<label for="team-name">Team name</label>
<input id="team-name" name="teamName" required aria-describedby="team-name-error">
<p id="team-name-error" class="status-error" role="alert">Enter a team name.</p>
```

### Cycle session calendar and details

The cycle schedule uses a timezone-aware month grid. Each session is a
keyboard-accessible button; activating it opens a dialog with its date, time,
duration, instructor, description, and (for enrolled students) materials and
problem sets. Escape or clicking the backdrop closes the dialog.

```html
<section class="roadmap-calendar" aria-label="Cycle session calendar">
  <div class="roadmap-calendar-toolbar">
    <button class="roadmap-calendar-nav" type="button" aria-label="Previous month">‹</button>
    <h3 aria-live="polite">October 2026</h3>
    <button class="roadmap-calendar-nav" type="button" aria-label="Next month">›</button>
  </div>
  <button class="roadmap-calendar-event accent-1" type="button"
          aria-label="Graph theory bootcamp, October 6 at 6:00 PM">
    <span>Graph theory bootcamp</span><small>6:00 PM</small>
  </button>
</section>
<section class="roadmap-session-dialog" role="dialog" aria-modal="true"
         aria-labelledby="session-title">
  <h2 id="session-title">Graph theory bootcamp</h2>
  <p><strong>Date &amp; time:</strong> Tue, Oct 6, 6:00 PM EET</p>
  <p><strong>Duration:</strong> 120 minutes</p>
</section>
```

### Filterable, sortable results table

```html
<label for="standings-search">Search standings</label>
<input id="standings-search" type="search" placeholder="Team or university">
<div class="results-table-scroll" role="region" aria-label="Contest standings"
     tabindex="0">
  <table class="results-table">
    <caption class="sr-only">Contest standings, sorted by rank</caption>
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending">
          <button type="button">Rank <span aria-hidden="true">↑</span></button>
        </th>
        <th scope="col" aria-sort="none"><button type="button">Team</button></th>
        <th scope="col" aria-sort="none"><button type="button">Solved</button></th>
        <th scope="col" aria-sort="none"><button type="button">Penalty</button></th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Team Alexandria</td><td>8</td><td>742</td></tr>
      <tr><td>2</td><td>PUA Falcons</td><td>7</td><td>681</td></tr>
    </tbody>
  </table>
</div>
```

## Interaction and states

| Component | Default / hover / active | Focus / disabled | Loading / error |
| --- | --- | --- | --- |
| Navigation | Underline active link; use primary color for current route | 3px `:focus-visible` ring; disabled links are not rendered | Keep route changes announced by the browser |
| Buttons | Filled primary; hover deepens color; active gives a subtle pressed offset | 44px+ target; visible ring; disabled uses reduced opacity and no hover | Keep action label or show progress text; never hide submission errors |
| Cards | Surface, border, and small shadow; hover lifts 2px | Links inside remain keyboard reachable | Loading uses the existing spinner; empty/error states keep explanatory text |
| Forms | 48px fields with inline labels and helper text | Retain native keyboard behavior and visible focus | Associate errors with fields using `aria-describedby` and `aria-invalid` |
| Stepper | Distinguish completed/current/upcoming with label and shape | Current step uses `aria-current="step"` | Do not advance until required fields validate |
| Calendar | Month grid, colored session buttons, previous/next month controls | Each session opens a labelled dialog; Escape closes it | Cancelled sessions remain visible and marked as cancelled |
| Results | Sticky column headings; sort buttons expose `aria-sort` | Scroll region is keyboard focusable; announce sort direction | Show a table-level empty/error message, not an empty success state |

Transitions use 150–250ms easing. The stylesheet disables nonessential motion for
`prefers-reduced-motion: reduce`. Keep keyboard order aligned with visual order,
provide a skip link in production layouts, and never rely on color alone for state.

## Responsive, accessible, and RTL notes

- Breakpoints: 680px mobile, 900px tablet, 1200px desktop container, 1440px wide.
- On mobile, collapse card grids and stepper columns; keep dense tables in a
  labelled, keyboard-scrollable horizontal region rather than clipping columns.
- Navigation collapses behind a 44px menu control; preserve a logical focus order
  and close the menu after route selection.
- Use `loading="lazy"` for below-the-fold images, explicit image dimensions, and
  avoid adding large decorative raster assets. Font fallbacks keep text usable
  while Google Fonts load; aim for LCP below 2.5 seconds.
- All interactive targets are at least 44×44px, body text is 16px+, and focus
  rings are visible in both themes. Validate actual content and component states
  with axe/WCAG checks before release.
- Set `dir="rtl"` on the relevant page or section for Arabic. The stylesheet uses
  logical spacing and alignment where practical; mirror any future directional
  icons and verify mixed Arabic/Latin usernames, code, and dates with
  `<bdi>`/`dir="auto"` where needed.

## Before / after checklist

| Before | After |
| --- | --- |
| Existing warm paper and vivid ICPC accent colors | Original color theme retained; semantic text and action colors checked for AA |
| Three separate display/body/code families with no Arabic-first fallback | One Arabic-capable sans family plus one monospace family |
| 11–13px supporting text and form controls | 16px body and inputs; 12px minimum metadata |
| Compact controls and inconsistent borders | 44px+ targets, consistent radii, borders, and focus states |
| Dense navigation on authenticated/admin pages | Four core destinations; account routes live in the account menu |
| Light theme with scattered dark overrides | Explicit semantic light/dark tokens |
| Mobile tables could compress columns | Documented horizontally scrollable table pattern with sticky headings |
