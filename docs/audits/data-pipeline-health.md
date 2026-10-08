# Firebase Data Pipeline & API Health Baseline Audit
**Audit Date:** 2026-10-08  
**Scope:** `app/api/trainees/register`, `app/api/trainees/me`, `app/api/points/claim-qr`, `app/api/points/event`, `app/api/leaderboard`  
**Reference Skills:** `firebase-firestore`, `firebase-security-rules-auditor`, `waf-reliability`

---

## 1. Pipeline Status Summary
| Endpoint | Method | Input Validation | Deduplication | Firestore Batching | Dev Mock Fallback | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/trainees/register` | `POST` | Validated (Name, UniID, Track) | UniID Document Key | Yes (`batch.commit()`) | Supported | ✅ PASS |
| `/api/trainees/me` | `GET` | Validated (`email` or `uid`) | Single Doc Query | N/A (Read) | Supported | ✅ PASS |
| `/api/points/claim-qr` | `POST` | Validated (`code`, `uniId`) | `point_events` lookup | `FieldValue.increment` | Supported | ✅ PASS |
| `/api/points/event` | `POST` | Validated (Type, Points) | Optional | `FieldValue.increment` | Supported | ✅ PASS |
| `/api/leaderboard` | `GET` | Validated (`track`, `limit`) | Indexed query | N/A (Read) | Supported | ✅ PASS |

---

## 2. Schema Contract & Data Types
- **Trainee Schema:** `TraineeDocument` in `lib/firebase-schema.ts` includes `authUid`, `authProvider`, and optional `codeforcesHandle`.
- **Audit Ledger:** Point claims write immutable records to `point_events` with timestamp, campaign metadata, and cadet ID.
- **Reliability:** All database calls are wrapped in `try/catch` with structured error JSON and HTTP status codes (`400`, `404`, `409`, `500`).
