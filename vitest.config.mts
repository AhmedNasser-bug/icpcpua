import { configDefaults, defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Playwright specs and config are run by Playwright, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**", "playwright.config.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "data/**/*.ts", "hooks/**/*.ts", "lib/**/*.ts"],
      // WebGL scenes are covered by end-to-end tests, not jsdom unit tests.
      exclude: [
        "**/*.d.ts",
        "components/recruitment/Role3DCanvas.tsx",
        "components/recruitment/role-scenes.ts",
      ],
      thresholds: {
        statements: 67,
        branches: 70,
        functions: 54,
        lines: 67,
      },
    },
  },
})
