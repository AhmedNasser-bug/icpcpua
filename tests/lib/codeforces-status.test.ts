import { describe, expect, it } from "vitest"
import {
  isCodeforcesDataStale,
  toCodeforcesAccountView,
} from "@/lib/codeforces/status"

describe("toCodeforcesAccountView", () => {
  it("treats legacy zeroes without sync evidence as unknown, not real data", () => {
    const view = toCodeforcesAccountView({
      codeforcesHandle: "Tourist",
      cfRating: 0,
      cfSolvedCount: 0,
    })

    expect(view).toMatchObject({
      handle: null,
      pendingHandle: "Tourist",
      linked: true,
      verified: false,
      rating: null,
      solvedCount: null,
      lastSyncedAt: null,
      syncStatus: "never",
    })
  })

  it("preserves a genuine zero rating and solved count after sync", () => {
    const view = toCodeforcesAccountView({
      codeforcesHandle: "newbie",
      cfHandleVerified: true,
      cfRating: 0,
      cfMaxRating: 0,
      cfSolvedCount: 0,
      cfLastSyncedAt: new Date().toISOString(),
      cfSyncStatus: "success",
    })

    expect(view.handle).toBe("newbie")
    expect(view.rating).toBe(0)
    expect(view.maxRating).toBe(0)
    expect(view.solvedCount).toBe(0)
    expect(view.verified).toBe(true)
  })

  it("distinguishes an unrated verified account from an unavailable rating", () => {
    const view = toCodeforcesAccountView({
      codeforcesHandle: "unrated",
      cfHandleVerified: true,
      cfRating: null,
      cfMaxRating: null,
      cfSolvedCount: 0,
      cfLastSyncedAt: new Date().toISOString(),
      cfSyncStatus: "success",
    })

    expect(view.rating).toBeNull()
    expect(view.solvedCount).toBe(0)
  })

  it("keeps the last valid data and exposes a failed status", () => {
    const syncedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const view = toCodeforcesAccountView({
      codeforcesHandle: "Tourist",
      cfHandleVerified: true,
      cfRating: 3800,
      cfMaxRating: 3900,
      cfSolvedCount: 500,
      cfLastSyncedAt: syncedAt,
      cfSyncStatus: "failed",
      cfSyncError: "Codeforces is temporarily unavailable.",
      cfSyncAttemptedAt: new Date().toISOString(),
    })

    expect(view.rating).toBe(3800)
    expect(view.solvedCount).toBe(500)
    expect(view.syncStatus).toBe("failed")
    expect(view.syncError).toContain("temporarily unavailable")
    expect(view.stale).toBe(true)
  })

  it("reports an unlinked account", () => {
    const view = toCodeforcesAccountView({ codeforcesHandle: "" })

    expect(view.linked).toBe(false)
    expect(view.handle).toBeNull()
    expect(view.pendingHandle).toBeNull()
    expect(view.profileUrl).toBeNull()
  })

  it("builds the public profile URL only for a verified handle", () => {
    const view = toCodeforcesAccountView({
      codeforcesHandle: "Tourist",
      cfHandleVerified: true,
      cfRating: 3800,
      cfSolvedCount: 1,
      cfLastSyncedAt: new Date().toISOString(),
      cfSyncStatus: "success",
    })

    expect(view.profileUrl).toBe("https://codeforces.com/profile/Tourist")
  })
})

describe("isCodeforcesDataStale", () => {
  it("is false for never-synced data and fresh data", () => {
    expect(isCodeforcesDataStale(undefined)).toBe(false)
    expect(isCodeforcesDataStale(new Date().toISOString())).toBe(false)
  })

  it("is true after the stale window", () => {
    const stale = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(isCodeforcesDataStale(stale)).toBe(true)
  })

  it("is false for an invalid timestamp", () => {
    expect(isCodeforcesDataStale("not-a-date")).toBe(false)
  })
})
