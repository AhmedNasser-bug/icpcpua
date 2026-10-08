# Data Layer Regression & Health Check Baseline Report
**Audit Date:** 2026-10-08  
**Scope:** Trainee registration, points increment calculation, duplicate claim rejections, leaderboard sorting  
**Reference Skills:** `qa`, `qa-only`, `investigate`

---

## 1. Test Suite Matrix
- [x] **Registration Happy Path:** Full name, University ID, track, and optional CF handle correctly serialize into `TraineeDocument`.
- [x] **Registration Deduplication:** Existing University IDs are updated with linked auth UID rather than throwing raw unhandled exceptions.
- [x] **QR Claim Deduplication:** Duplicate claims for `CAMPUS_BOOTH_DAY1` with same cadet ID return HTTP `409` (`alreadyClaimed: true`).
- [x] **Unregistered Cadet Protection:** Claiming QR points with an unlisted ID returns HTTP `404` (`needsRegistration: true`), preventing orphan point events.
- [x] **Leaderboard Sorting:** Cadets are sorted descending by `pointsTotal` with tie-breaking on `rating` and `solved`.

---

## 2. Identified Opportunities
1. Add automated smoke tests running via node script in `scripts/test-data-pipeline.mjs` for CI/CD pipeline integration.
2. Ensure Firestore security rules strictly enforce field types for `pointsTotal` as numeric integer $\ge 0$.
