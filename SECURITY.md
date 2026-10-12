# Security policy

## Supported versions

Only the `main` branch is maintained and deployed to
<https://icpcpua.vercel.app>.

## Reporting a vulnerability

Do not open a public issue for security problems. Use GitHub's private
vulnerability reporting on this repository:

<https://github.com/AhmedNasser-bug/icpcpua/security/advisories/new>

TODO(maintainer): enable private vulnerability reporting in the repository's
Security settings, or replace this section with a monitored contact address.

Include the affected route or file, reproduction steps and the impact you see.
Do not include real credentials, private user data or exploit code against the
live site.

## Relevant surfaces

- `/api/trainees/register`, `/api/points/event` and `/api/leaderboard`
  (Firestore access).
- The Supabase anon key and Row Level Security for `bounty_scouts` and
  `bounty_referrals`; the schema is in
  [`supabase/migrations/20261012000000_bounty_schema.sql`](supabase/migrations/20261012000000_bounty_schema.sql).
- Anything that renders user-supplied text (registration and feedback forms).
