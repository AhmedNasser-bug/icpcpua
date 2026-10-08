# WCAG Accessibility (a11y) & Screen Reader Baseline Audit
**Audit Date:** 2026-10-08  
**Standard:** WCAG 2.2 AA / AAA  
**Pages Evaluated:** `/`, `/register`, `/claim`, `/flyer`, `/leaderboard`  
**Reference Skills:** `accessibility`, `a11y-debugging`

---

## 1. Compliance Checklist
- [x] **Skip Link:** Global skip-to-content link present in `app/layout.tsx` targeting `#main-content`.
- [x] **Color Contrast:**
  - High-contrast Neo-Brutalist elements (`#0F0F0F` text on `#FFD500` yellow: `12.5:1` contrast ratio $\ge 7:1$ AAA).
  - `#0F0F0F` on white (`#FFFFFF`): `19.8:1` contrast ratio (AAA).
  - Dark header background (`#7B2CBF` with white text: `5.4:1` contrast ratio $\ge 4.5:1$ AA).
- [x] **Form Labels & ARIA:**
  - `app/register/page.tsx` input elements feature explicit `htmlFor` and `id` bindings.
  - Required fields annotated with `*` and `required` attributes.
  - Dropdowns feature `aria-expanded` and `aria-controls` bindings in navbar.
- [x] **Touch Targets:**
  - Buttons (`btn-solid`, CTA buttons) exceed $44 \times 44\text{px}$ minimum clickable area on mobile screens.
- [x] **Images:**
  - Logos and QR codes contain descriptive `alt` tags (`alt="ICPC PUA +10 Points Challenge QR Code"`).
