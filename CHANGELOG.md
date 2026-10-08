# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-10-08

### Added
- **Dynamic 3D Canvas Splitting**: Added `Role3DCanvasWrapper` utilizing `next/dynamic({ ssr: false })` to lazy load Three.js, decoupling the 546 KB WebGL bundle from the critical loading path of `/recruitment`.
- **System TLS Support for Turbopack**: Enabled `experimental.turbopackUseSystemTlsCerts` in `next.config.mjs` to resolve proxy TLS handshakes during build-time asset optimization.

### Changed
- **Next.js Font Optimization**: Migrated external render-blocking Google Fonts `<link rel="stylesheet">` to self-hosted `@next/font/google` (`Fredoka`, `Space_Mono`) with automatic WOFF2 preloading and zero layout shift fallback tokens.
- **Image Optimization & Format Negotiation**: Removed `images.unoptimized: true` in `next.config.mjs` and configured next-gen `image/avif` and `image/webp` format negotiation alongside remote avatar patterns.
- **Testimonial Avatars**: Migrated testimonial avatar `<img />` tags to `next/image` with explicit dimensions to eliminate Cumulative Layout Shift (CLS).

### Performance & Core Web Vitals
- **Firebase Bundle Pruning**: Removed unused client-side Firestore exports from `lib/firebase.ts`, shrinking the client Firebase chunk by **561 KB** (from 683 KB down to 121.9 KB).
- **INP Reflow Elimination**: Cached Hero Emblem card geometry on pointer enter in `HeroSection`, removing repeated `getBoundingClientRect()` forced layout recalcs on every `mousemove`.
- **GPU & Animation Hygiene**: Added `will-change: transform` and `contain: paint` to `.marquee-content` for GPU compositor thread isolation. Refactored `Role3DCanvas` to halt `requestAnimationFrame` loops when offscreen via `IntersectionObserver`.
