# Comprehensive Plan: ICPC-PUA Firebase Spark Migration, Vercel Hosting & End-to-End Verification

> **Target Codebase:** `xByteA/ICPC-PUA` (`icpc-pua-upstream/`)
> **Backend Target:** Firebase Project `icpc-pua` (**Strict Spark $0 Free Tier** — Firebase Auth + Cloud Firestore + Security Rules, zero backend server, zero credit card)
> **Frontend Hosting Target:** Vercel Production (`https://icpcpua.vercel.app`) with rollback mirror (`https://icpcpua-legacy.vercel.app`) + Firebase Hosting mirror (`https://icpc-pua.web.app`)

---

## 1. Locked Architectural Decisions (`/grill-me` Alignment Matrix)

| # | Decision Area | Locked Choice | Architectural Consequence |
| :--- | :--- | :--- | :--- |
| **D1** | **Backend Compute & Database** | **100% Serverless Firebase Spark Migration** (`icpc-pua`) | Eliminates Express server, MongoDB Atlas runtime dependency, and `JWT_SECRET` exposure. Rewrites only `Frontend/src/shared/services/api.js` as a client-side Firestore + Firebase Auth adapter so all 77 frontend call sites and 13 UI feature modules remain untouched. |
| **D2** | **Legacy Atlas Data (`pua-icpc-community`)** | **Fresh Start + Read-Only Curriculum Seed** | No user PII or bcrypt password hashes migrated. One-time read-only export pulls `roadmaps`, `roadmapNodes`, `roadmapCycles`, `roadmapSessions`, and published `events` from `cluster0.iq3gjej.mongodb.net` into a static seed fixture (`Frontend/src/shared/data/seedFixture.json`) and seeds Firestore. |
| **D3** | **Codeforces Handle Verification** | **Self-Reported Handle (`unverified`)** | Drops server-side token-in-first-name polling against `codeforces.com/api/user.info`. Students enter their handle directly in Profile/Settings; stored as `unverified` with direct link to `https://codeforces.com/profile/<handle>`. |
| **D4** | **Authentication Providers** | **Google OAuth + GitHub OAuth (Firebase Auth v1)** | Unlimited and $0 on Firebase Spark. After first OAuth sign-in, users without a `username` or `studentId` complete the existing onboarding screen (`^[a-z0-9_]{3,20}$` username + `^\d{4,20}$` student ID). |
| **D5** | **Domain & Cutover Strategy** | **Replace Next.js on `icpcpua.vercel.app` after verification** | Current Next.js app moves to `icpcpua-legacy.vercel.app` as an instant rollback target. New Vite SPA deploys to a Vercel preview URL first, passes all automated + `/browser` gates, and then claims `icpcpua.vercel.app`. |
| **D6** | **Source Control & CI/CD** | **Fork `xByteA/ICPC-PUA` -> Auto-Deploy from `main`** | Working clone lives at `d:\Work\Instructing\prblmslving\icpc-pua-upstream`. GitHub Actions runs tests and builds on every push. |
| **D7** | **Verification Bar** | **3 Automated Gates + Mandatory Manual `/browser` Walkthrough** | (1) Firestore Rules unit tests, (2) 31-route Adapter contract tests, (3) Production Vite build & Playwright/Browser walkthrough of every student and admin flow. |

---

## 2. Environment Variables (`Frontend/.env` & Vercel Project Settings)

```dotenv
VITE_DATA_BACKEND=firebase
VITE_FIREBASE_API_KEY=AIzaSyDI9zgWc5_f_9z2-aRixG4MCr9gxBBY8BA
VITE_FIREBASE_AUTH_DOMAIN=icpc-pua.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=icpc-pua
VITE_FIREBASE_STORAGE_BUCKET=icpc-pua.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=610084876739
VITE_FIREBASE_APP_ID=1:610084876739:web:b2020d1317a7fcb2858d76
VITE_FIREBASE_MEASUREMENT_ID=G-VP3J196SB4
VITE_GOOGLE_CLIENT_ID=173832367605-5uq9g0igndfll5t4386d8njjqbvuphga.apps.googleusercontent.com
VITE_ACPC_TARGET_DATE=2027-08-01T00:00:00+03:00
VITE_ADMIN_EMAILS=enjoyplayax@gmail.com
```

---

## 3. Architecture Reference

See [`docs/architecture/graphify-index.md`](./architecture/graphify-index.md) for all five Graphify architecture diagrams and the Gate Report.
