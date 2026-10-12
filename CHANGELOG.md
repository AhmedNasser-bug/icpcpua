# Changelog

Notable, user-facing changes to the PUA ICPC site. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before this file was introduced are not backfilled. The changelog is a
draft until the first tagged release.

## [Unreleased]

### Added

- Supabase migration for the referral schema (`bounty_scouts`,
  `bounty_referrals`, RLS policies and the `recruits_count` trigger).
- `SECURITY.md` with the private vulnerability reporting path.
- Documentation: docs index, architecture overview, configuration reference,
  data model, contributing guide and a Firestore backend ADR.

### Changed

- `/events` now shows the October 2026 season calendar instead of 2023 sample
  dates.
- `/testimonials` is no longer linked from the navigation or footer while it is
  empty.
- The README is a landing page with a verified quick start and API example.

### Fixed

- `POST /api/points/event` rejects unknown event types and points outside
  `|points| <= 1000` with `400` instead of writing them.
- `GET /api/leaderboard` defaults and clamps the `limit` parameter instead of
  passing `NaN` to Firestore, and re-ranks filtered fallback entries from 1.
- Referral credit is skipped when registration runs in simulated fallback mode,
  so a dev-mode signup cannot earn referral points.
- `DESIGN.md` names the Fredoka font family actually loaded by `app/fonts.ts`.

### Security

- The points endpoint can require an `Authorization: Bearer <secret>` header via
  `POINTS_EVENT_SECRET`.
