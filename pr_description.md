🎯 **What:** Removed duplicate `use-mobile` hook file (`components/ui/use-mobile.tsx`) to establish `hooks/use-mobile.ts` as the single source of truth.

💡 **Why:** Exact file duplication violates DRY principles. Having a single source of truth reduces maintenance overhead and prevents future drift or inconsistencies between the two hook implementations.

✅ **Verification:**
- Verified no remaining imports of `components/ui/use-mobile` in `*.ts`/`*.tsx` files via `grep`.
- Existing components (like `components/ui/sidebar.tsx`) were already importing it from `hooks/use-mobile`.
- Ran a successful Next.js production build via `npm run build`.

✨ **Result:** Cleaned up the codebase by removing duplicate code, ensuring better maintainability without introducing any breaking changes.
