# Core Web Vitals & Web Performance Baseline Audit
**Audit Date:** 2026-10-08  
**Scope:** LCP, INP, CLS, Asset Optimization, Turbopack Build Performance  
**Reference Skills:** `debug-optimize-lcp`, `modern-web-guidance`, `waf-performance-efficiency`

---

## 1. Metrics Baseline
- **Build Time:** Next.js Turbopack compilation runs in $\approx 9.1\text{s}$ to $11.7\text{s}$ for 33 routes.
- **Route Breakdown:** 31 routes are pre-rendered statically (`○` / `●`), minimizing SSR server TTFB.
- **Font Optimization:** Google Fonts (`Fredoka One`, `Space Mono`) utilize `preconnect` links to `fonts.gstatic.com` in `app/layout.tsx`.
- **Image Delivery:** QR code and branding assets leverage `next/image` with `priority` and responsive `sizes` attribute.
- **Dynamic Suspense Boundaries:** Search parameter readers in `/register` and `/claim` are insulated inside `<Suspense>` wrappers, preventing SSR de-optimization.

---

## 2. Recommended Next Steps
- Consider setting `display=swap` explicitly on font links (already active in `app/layout.tsx`).
- Cache `/api/leaderboard` response headers with `s-maxage=60, stale-while-revalidate=120` to reduce read operations on Firestore during peak contest times.
