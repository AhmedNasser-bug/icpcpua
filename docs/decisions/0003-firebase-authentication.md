# Firebase Authentication and fenced Firestore coordination

## Status

Accepted (2026-10-23). Supersedes the session decision in
[ADR 0002](./0002-codeforces-sync.md).

## Context

The previous trainee "session" was an HMAC-signed cookie containing only a
university id, issued after matching a lower-cased registration email. That
credential was guessable in practice for a known cadet, had no password, no
revocation and no verified email ownership. The Codeforces rate limiter silently
fell back to a per-instance queue when Firestore failed, and synchronization
locks had no fencing: a job whose lock expired could still overwrite newer
results.

## Decision

### Authentication

- Use Firebase Authentication with the **email/password** provider.
- Registration creates the Firebase user in the browser, obtains an ID token and
  sends it to `POST /api/trainees/register`. The server verifies the token and
  atomically creates the trainee, `trainee_auth_links/{uid}`,
  `trainee_email_links/{email}` and the handle registry entry.
- `POST /api/trainees/session` verifies the ID token with
  `verifyIdToken(token, true)`, checks that the user is not disabled, creates a
  Firebase session cookie (`createSessionCookie`) and stores it in an HTTP-only,
  `SameSite=Lax`, production-`Secure` cookie. The lifetime defaults to five days
  (Firebase maximum is fourteen).
- Every private route verifies the cookie with
  `verifySessionCookie(cookie, true)` and resolves the trainee from the
  `trainee_auth_links` registry plus the `authUid` field. Client-supplied user
  ids are ignored.
- Existing trainees are migrated by an administrative script that creates
  Firebase users and records migration status. Linking requires a verified email
  and an explicit university-id confirmation, or a bounded one-time claim code
  controlled by `TRAINEE_LEGACY_CLAIM_ENABLED`/`_DEADLINE` and
  `TRAINEE_CLAIM_SECRET`.
- Administrators are authorized only by the verified custom claim
  `admin === true`. `scripts/grant-admin.mjs` is the trusted provisioning path;
  no HTTP endpoint can grant claims.
- Sign-out revokes refresh tokens. This is account-wide by design, not a
  per-device logout.

### Firestore coordination

- The shared `system_state/codeforces_rate_limit` reservation is mandatory in
  production. A failed transaction raises a retryable coordination error and
  the Codeforces request is never made. The in-memory limiter is local-only.
- Lock acquisition uses bounded retries with jitter. The lock stores a random
  token/job id, `expiresAt` (Timestamp for TTL cleanup) and `expiresAtMs` (the
  application check). A heartbeat renews the lock only while the current job
  owns it.
- Every protected write reads the lock inside the same Firestore transaction and
  verifies token ownership and expiry before writing. A stale job cannot write
  after losing ownership.
- Cron processing is time-budgeted, oldest-due-first and bounded. `cfNextSyncAt`
  is advanced only after a fenced success, which makes interrupted runs
  resumable without a cursor.
- A `sync_runs` collection records trigger, trainee, timing, safe status and
  sanitized error code for every attempt, including lock and rate-limit
  failures.

## Alternatives considered

1. Keep the HMAC cookie and add a password. Rejected: it would duplicate
   Firebase's password storage, token rotation, revocation and email tooling.
2. Passwordless email-link authentication. It proves ownership directly but
   adds a multi-step callback/continuation flow and depends on email delivery
   for every sign-in. Email/password with password reset is the smaller secure
   change and is supported by the existing Firebase project.
3. Redis or a queue for coordination. Rejected for now: Firestore transactions
   already provide the required atomic compare-and-set and keep the
   no-new-infrastructure constraint. A queue can be revisited if cron throughput
   becomes the bottleneck.

## Consequences

- Good: no custom cryptography, password storage or session signing.
- Good: revocation checking is required on every private request.
- Good: rate-limit and lock failures fail closed.
- Good: stale jobs cannot overwrite newer results.
- Bad: sign-out revokes every Firebase session for the user. This is documented
  and tested.
- Bad: new registrations can establish a Firebase email before verifying it.
  The app never uses that email to claim an **existing** record; claiming
  existing records requires `email_verified` plus the university-id confirmation
  or a one-time claim code.
- Bad: Firebase session cookies are not individually revocable per device.

## Confirmation

Covered by `tests/lib/trainee-session.test.ts`, `tests/api/trainees-session.test.ts`,
`tests/api/trainees-register.test.ts`, `tests/api/admin-routes.test.ts`,
`tests/lib/codeforces-rate-limit.test.ts`, `tests/lib/codeforces-sync.test.ts`,
`tests/lib/server-env.test.ts` and the existing Codeforces/client tests.
