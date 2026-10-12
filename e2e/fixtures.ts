import { test as base, expect } from "@playwright/test"

/**
 * Hosts the app must never reach in a test run. The suite mocks the only
 * first-party API it needs, so any traffic to a live backend means the test
 * is not deterministic (or a placeholder credential leaked into a spec).
 */
const BLOCKED_HOST_PATTERNS = [
  /(^|\.)supabase\.(co|in)$/,
  /(^|\.)firebaseio\.com$/,
  /(^|\.)firebaseapp\.com$/,
  /(^|\.)googleapis\.com$/,
]

type NetworkGuardFixtures = {
  externalNetworkGuard: void
}

/**
 * Aborts requests to Firebase/Supabase hosts and fails the test if any were
 * attempted, proving the specs run against local mocks only.
 */
export const test = base.extend<NetworkGuardFixtures>({
  externalNetworkGuard: [
    async ({ page }, provide) => {
      const attempted: string[] = []

      await page.route("**/*", (route) => {
        const { hostname } = new URL(route.request().url())
        if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
          attempted.push(route.request().url())
          return route.abort()
        }
        return route.continue()
      })

      await provide()

      expect(
        attempted,
        `External backend requests were attempted:\n${attempted.join("\n")}`
      ).toEqual([])
    },
    { auto: true },
  ],
})

export { expect } from "@playwright/test"
