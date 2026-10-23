import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
}))

vi.mock("@/lib/firebase-admin", () => ({
  get adminDb() {
    return adminDbRef.current
  },
  FieldValue: { increment: (n: number) => ({ __increment: n }) },
}))

import {
  CodeforcesCoordinationError,
  acquireCodeforcesRateLimitSlot,
  resetCodeforcesRateLimitForTests,
} from "@/lib/codeforces/rate-limit"
import { FakeFirestore } from "../helpers/fake-firestore"

beforeEach(() => {
  adminDbRef.current = null
  resetCodeforcesRateLimitForTests()
  delete process.env.CODEFORCES_RATE_LIMIT_MAX_WAIT_MS
})

afterEach(() => {
  delete process.env.CODEFORCES_MIN_INTERVAL_MS
  delete process.env.CODEFORCES_RATE_LIMIT_MAX_WAIT_MS
  vi.unstubAllEnvs()
})

describe("Codeforces rate limiter", () => {
  it("spaces requests to the documented interval in local development", async () => {
    process.env.CODEFORCES_MIN_INTERVAL_MS = "40"

    const start = Date.now()
    await acquireCodeforcesRateLimitSlot()
    await acquireCodeforcesRateLimitSlot()

    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
  })

  it("does not wait when the interval is explicitly disabled", async () => {
    process.env.CODEFORCES_MIN_INTERVAL_MS = "0"

    const start = Date.now()
    await Promise.all([
      acquireCodeforcesRateLimitSlot(),
      acquireCodeforcesRateLimitSlot(),
      acquireCodeforcesRateLimitSlot(),
    ])

    expect(Date.now() - start).toBeLessThan(30)
  })

  it("reserves a shared Firestore window when a database is configured", async () => {
    process.env.CODEFORCES_MIN_INTERVAL_MS = "40"
    const db = new FakeFirestore()
    adminDbRef.current = db

    const start = Date.now()
    await acquireCodeforcesRateLimitSlot()
    await acquireCodeforcesRateLimitSlot()
    const state = db.read("system_state", "codeforces_rate_limit")!

    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
    expect(typeof state.nextAllowedAt).toBe("number")
    expect(state.nextAllowedAt as number).toBeGreaterThanOrEqual(start + 80)
  })

  it("fails closed instead of using the in-memory limiter when Firestore fails", async () => {
    process.env.CODEFORCES_MIN_INTERVAL_MS = "40"
    adminDbRef.current = {
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async () => {
        throw new Error("firestore unavailable")
      },
    }

    const start = Date.now()
    await expect(acquireCodeforcesRateLimitSlot()).rejects.toBeInstanceOf(
      CodeforcesCoordinationError
    )
    await expect(acquireCodeforcesRateLimitSlot()).rejects.toMatchObject({
      code: "coordination_unavailable",
      retryable: true,
    })
    expect(Date.now() - start).toBeLessThan(200)
  })

  it("fails explicitly in production when no shared store exists", async () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.CODEFORCES_MIN_INTERVAL_MS = "40"
    adminDbRef.current = null

    await expect(acquireCodeforcesRateLimitSlot()).rejects.toMatchObject({
      code: "coordination_unavailable",
    })
  })

  it("rejects reservations that would exceed the maximum wait", async () => {
    process.env.CODEFORCES_MIN_INTERVAL_MS = "1000"
    process.env.CODEFORCES_RATE_LIMIT_MAX_WAIT_MS = "1"
    const db = new FakeFirestore()
    adminDbRef.current = db

    await acquireCodeforcesRateLimitSlot()
    await expect(acquireCodeforcesRateLimitSlot()).rejects.toMatchObject({
      code: "reservation_busy",
    })
  })
})
