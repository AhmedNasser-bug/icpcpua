import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
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
