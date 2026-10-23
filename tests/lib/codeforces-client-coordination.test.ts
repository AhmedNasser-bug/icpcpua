import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { acquireMock } = vi.hoisted(() => ({
  acquireMock: vi.fn(),
}))

vi.mock("@/lib/codeforces/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/codeforces/rate-limit")>()
  return {
    ...actual,
    acquireCodeforcesRateLimitSlot: (...args: unknown[]) => acquireMock(...args),
  }
})

import { CodeforcesApiError, fetchCodeforcesUserInfo } from "@/lib/codeforces/client"
import { CodeforcesCoordinationError } from "@/lib/codeforces/rate-limit"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CODEFORCES_MAX_RETRIES = "0"
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.CODEFORCES_MAX_RETRIES
})

describe("Codeforces client coordination failures", () => {
  it("does not call Codeforces when the shared reservation fails", async () => {
    acquireMock.mockRejectedValue(
      new CodeforcesCoordinationError(
        "coordination_unavailable",
        "shared limiter down"
      )
    )
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "coordination_unavailable",
      retryable: true,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not call Codeforces when the shared reservation is saturated", async () => {
    acquireMock.mockRejectedValue(
      new CodeforcesCoordinationError("reservation_busy", "busy", {
        retryAfterSeconds: 5,
      })
    )
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toBeInstanceOf(
      CodeforcesApiError
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
