import { beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef, infoMock, solvedMock } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
  infoMock: vi.fn(),
  solvedMock: vi.fn(),
}))

vi.mock("@/lib/firebase-admin", () => ({
  get adminDb() {
    return adminDbRef.current
  },
  FieldValue: { increment: (n: number) => ({ __increment: n }) },
}))

vi.mock("@/lib/codeforces/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/codeforces/client")>()
  return {
    ...actual,
    fetchCodeforcesUserInfo: (handle: string) => infoMock(handle),
    fetchCodeforcesSolvedProblems: (handle: string, previous: unknown) =>
      solvedMock(handle, previous),
  }
})

import { CodeforcesApiError } from "@/lib/codeforces/client"
import {
  renewCodeforcesSyncLock,
  syncDueCodeforcesAccounts,
  syncTraineeCodeforces,
} from "@/lib/codeforces/sync"
import { FakeFirestore } from "../helpers/fake-firestore"

function trainee(universityId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: universityId,
    universityId,
    fullName: `Cadet ${universityId}`,
    email: `${universityId}@example.com`,
    status: "active",
    track: "level_1",
    pointsTotal: 10,
    codeforcesHandle: "Tourist",
    codeforcesHandleLower: "tourist",
    cfHandleVerified: false,
    cfRating: null,
    cfMaxRating: null,
    cfSolvedCount: null,
    cfSolvedProblemKeys: [],
    cfLastSubmissionId: null,
    cfLastSyncedAt: null,
    cfSyncAttemptedAt: null,
    cfSyncStatus: "never",
    cfSyncError: null,
    cfNextSyncAt: new Date(Date.now() - 60_000).toISOString(),
    attendedSessionsCount: 0,
    qrScansCount: 0,
    registeredAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function registry(universityId: string) {
  return {
    universityId,
    handle: "Tourist",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  infoMock.mockResolvedValue({
    handle: "Tourist",
    rating: 2400,
    maxRating: 2500,
    rank: "grandmaster",
    maxRank: "grandmaster",
  })
  solvedMock.mockResolvedValue({
    problemKeys: ["1:A", "2:B"],
    solvedCount: 2,
    lastSubmissionId: 20,
  })
})

describe("syncTraineeCodeforces", () => {
  it("returns a fallback result when the database is not configured", async () => {
    const result = await syncTraineeCodeforces("202300001")
    expect(result).toMatchObject({ ok: false, skipped: "fallback" })
  })

  it("persists synchronized rating, max rating and distinct solved problems", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001", { trigger: "manual" })
    const stored = db.read("trainees", "202300001")!

    expect(result.ok).toBe(true)
    expect(stored).toMatchObject({
      codeforcesHandle: "Tourist",
      codeforcesHandleLower: "tourist",
      cfHandleVerified: true,
      cfRating: 2400,
      cfMaxRating: 2500,
      cfSolvedCount: 2,
      cfSolvedProblemKeys: ["1:A", "2:B"],
      cfLastSubmissionId: 20,
      cfSyncStatus: "success",
      cfSyncError: null,
    })
    expect(typeof stored.cfLastSyncedAt).toBe("string")
    expect(typeof stored.cfNextSyncAt).toBe("string")
    expect(db.has("codeforces_links", "tourist")).toBe(true)
    expect(db.has("cf_sync_locks", "202300001")).toBe(false)
  })

  it("keeps the last valid data when a refresh fails", async () => {
    const db = new FakeFirestore()
    const syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", {
        cfHandleVerified: true,
        cfRating: 2300,
        cfMaxRating: 2400,
        cfSolvedCount: 500,
        cfSolvedProblemKeys: ["1:A"],
        cfLastSubmissionId: 10,
        cfLastSyncedAt: syncedAt,
        cfSyncStatus: "success",
      })
    )
    db.seed("codeforces_links", "tourist", registry("202300001"))
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    )

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result.ok).toBe(false)
    expect(stored.cfRating).toBe(2300)
    expect(stored.cfMaxRating).toBe(2400)
    expect(stored.cfSolvedCount).toBe(500)
    expect(stored.cfSolvedProblemKeys).toEqual(["1:A"])
    expect(stored.cfLastSubmissionId).toBe(10)
    expect(stored.cfLastSyncedAt).toBe(syncedAt)
    expect(stored.cfSyncStatus).toBe("failed")
    expect(stored.cfSyncError).toContain("temporarily unavailable")
    expect(db.has("cf_sync_locks", "202300001")).toBe(false)
  })

  it("records a failure for a never-synced account without inventing data", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError("not_found", false, "Codeforces handle was not found.")
    )

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result).toMatchObject({ ok: false, code: "codeforces_not_found" })
    expect(stored.cfRating).toBeNull()
    expect(stored.cfSolvedCount).toBeNull()
    expect(stored.cfLastSyncedAt).toBeNull()
    expect(stored.cfSyncStatus).toBe("failed")
    expect(stored.cfSyncError).toBe("Codeforces handle was not found.")
    expect(db.has("codeforces_links", "tourist")).toBe(false)
  })

  it("keeps the previous solved data when submission synchronization fails", async () => {
    const db = new FakeFirestore()
    const syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", {
        cfHandleVerified: true,
        cfRating: 2300,
        cfMaxRating: 2400,
        cfSolvedCount: 500,
        cfSolvedProblemKeys: ["1:A"],
        cfLastSubmissionId: 10,
        cfLastSyncedAt: syncedAt,
        cfSyncStatus: "success",
      })
    )
    db.seed("codeforces_links", "tourist", registry("202300001"))
    adminDbRef.current = db
    infoMock.mockResolvedValue({
      handle: "Tourist",
      rating: 2450,
      maxRating: 2500,
      rank: null,
      maxRank: null,
    })
    solvedMock.mockRejectedValue(
      new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    )

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result.ok).toBe(false)
    expect(stored.cfRating).toBe(2450)
    expect(stored.cfSolvedCount).toBe(500)
    expect(stored.cfSolvedProblemKeys).toEqual(["1:A"])
    expect(stored.cfLastSubmissionId).toBe(10)
    expect(stored.cfLastSyncedAt).toBe(syncedAt)
    expect(stored.cfSyncStatus).toBe("failed")
  })

  it("refuses a handle already owned by another trainee", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("codeforces_links", "tourist", registry("202300002"))
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result).toMatchObject({ ok: false, code: "handle_conflict" })
    expect(stored.cfSyncStatus).toBe("failed")
    expect(stored.cfSyncError).toContain("already linked")
    expect(stored.cfSolvedCount).toBeNull()
  })

  it("does not write a failure status when the handle changed mid-sync", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    infoMock.mockImplementation(async () => {
      db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "Other" }))
      return {
        handle: "Tourist",
        rating: 2400,
        maxRating: 2500,
        rank: null,
        maxRank: null,
      }
    })

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result).toMatchObject({ ok: false, skipped: "handle_changed" })
    expect(stored.codeforcesHandle).toBe("Other")
    expect(stored.cfSyncStatus).toBe("never")
    expect(stored.cfSyncError).toBeNull()
  })

  it("does not record a failure against a handle that changed mid-sync", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    solvedMock.mockImplementation(async () => {
      db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "Other" }))
      throw new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    })

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result.ok).toBe(false)
    expect(stored.codeforcesHandle).toBe("Other")
    expect(stored.cfSyncStatus).toBe("never")
    expect(stored.cfSyncError).toBeNull()
  })

  it("skips a trainee with an active synchronization lock", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("cf_sync_locks", "202300001", {
      token: "other-job",
      expiresAt: Date.now() + 60_000,
    })
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")

    expect(result).toMatchObject({ ok: false, skipped: "locked" })
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("prevents a second job from acquiring an active lock", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    let release!: (value: unknown) => void
    infoMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )

    const first = syncTraineeCodeforces("202300001")
    await vi.waitFor(() => {
      expect(db.has("cf_sync_locks", "202300001")).toBe(true)
    })

    const second = await syncTraineeCodeforces("202300001")
    expect(second).toMatchObject({ ok: false, skipped: "locked" })

    release({
      handle: "Tourist",
      rating: 2400,
      maxRating: 2500,
      rank: null,
      maxRank: null,
    })
    expect((await first).ok).toBe(true)
  })

  it("takes over an expired lock", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("cf_sync_locks", "202300001", {
      token: "stale-job",
      expiresAt: Date.now() - 1_000,
    })
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")

    expect(result.ok).toBe(true)
    expect(db.has("cf_sync_locks", "202300001")).toBe(false)
  })

  it("does not sync inactive trainees from a cron run", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", { status: "inactive" }))
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001", { trigger: "cron" })

    expect(result).toMatchObject({ ok: false, skipped: "ineligible" })
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("returns not_linked for an invalid stored handle", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "no" }))
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")

    expect(result).toMatchObject({ ok: false, skipped: "not_linked" })
  })

  it("clears old aggregates when the stored handle changed outside the link flow", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", {
        codeforcesHandle: "old_handle",
        codeforcesHandleLower: "old_handle",
        cfHandleVerified: true,
        cfRating: 1200,
        cfSolvedCount: 30,
        cfSolvedProblemKeys: ["5:E"],
        cfLastSubmissionId: 5,
        cfLastSyncedAt: new Date().toISOString(),
        cfSyncStatus: "success",
      })
    )
    db.seed("codeforces_links", "old_handle", {
      ...registry("202300001"),
      handle: "old_handle",
    })
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result.ok).toBe(true)
    expect(stored.cfRating).toBe(2400)
    expect(stored.cfSolvedCount).toBe(2)
    expect(stored.cfSolvedProblemKeys).toEqual(["1:A", "2:B"])
    expect(db.has("codeforces_links", "old_handle")).toBe(false)
    expect(db.has("codeforces_links", "tourist")).toBe(true)
  })
})

describe("syncDueCodeforcesAccounts", () => {
  it("synchronizes a bounded batch of due accounts", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", { cfNextSyncAt: new Date(Date.now() - 10_000).toISOString() })
    )
    db.seed(
      "trainees",
      "202300002",
      trainee("202300002", {
        codeforcesHandle: "Other",
        codeforcesHandleLower: "other",
        cfNextSyncAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
    )
    adminDbRef.current = db
    infoMock.mockResolvedValue({
      handle: "Tourist",
      rating: 2400,
      maxRating: 2500,
      rank: null,
      maxRank: null,
    })

    const result = await syncDueCodeforcesAccounts(5)

    expect(result).toMatchObject({
      processed: 1,
      synced: 1,
      failed: 0,
      skipped: 0,
      stoppedBy: "drained",
    })
    expect(db.read("trainees", "202300001")!.cfSyncStatus).toBe("success")
    expect(db.read("trainees", "202300002")!.cfSyncStatus).toBe("never")
  })

  it("stops before starting work when the time budget is exhausted", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", { cfNextSyncAt: new Date(Date.now() - 10_000).toISOString() })
    )
    adminDbRef.current = db

    const result = await syncDueCodeforcesAccounts({
      limit: 10,
      timeBudgetMs: 1,
      minAttemptMs: 5_000,
    })

    expect(result.stoppedBy).toBe("time_budget")
    expect(result.processed).toBe(0)
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("records a sync run for a successful synchronization", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001", { trigger: "manual" })
    const runs = await db.collection("sync_runs").get()

    expect(result.runId).toBeTruthy()
    expect(runs.docs).toHaveLength(1)
    expect(runs.docs[0]!.data()).toMatchObject({
      trigger: "manual",
      traineeId: "202300001",
      status: "success",
      errorCode: null,
    })
  })

  it("records lock contention without calling Codeforces", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("cf_sync_locks", "202300001", {
      token: "other-job",
      expiresAt: Date.now() + 60_000,
    })
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001", { trigger: "cron" })
    const runs = await db.collection("sync_runs").get()

    expect(result).toMatchObject({ skipped: "locked", code: "lock_contended" })
    expect(runs.docs[0]!.data()).toMatchObject({
      status: "skipped",
      errorCode: "lock_contended",
    })
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("rejects final writes after losing the lock", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    infoMock.mockImplementation(async () => {
      db.seed("cf_sync_locks", "202300001", {
        token: "newer-job",
        expiresAt: Date.now() + 60_000,
      })
      db.seed(
        "trainees",
        "202300001",
        trainee("202300001", {
          cfRating: 9999,
          cfSyncStatus: "success",
        })
      )
      return {
        handle: "Tourist",
        rating: 2400,
        maxRating: 2500,
        rank: null,
        maxRank: null,
      }
    })

    const result = await syncTraineeCodeforces("202300001")
    const stored = db.read("trainees", "202300001")!

    expect(result).toMatchObject({ ok: false, skipped: "lock_lost" })
    expect(stored.cfRating).toBe(9999)
    expect(stored.cfSyncStatus).toBe("success")
  })

  it("cannot renew a lock owned by another job or an expired lease", async () => {
    const db = new FakeFirestore()
    db.seed("cf_sync_locks", "202300001", {
      token: "owner",
      expiresAt: Date.now() + 60_000,
    })
    adminDbRef.current = db

    expect(await renewCodeforcesSyncLock("202300001", "other")).toBe(false)
    expect(db.read("cf_sync_locks", "202300001")!.token).toBe("owner")

    expect(await renewCodeforcesSyncLock("202300001", "owner")).toBe(true)

    db.seed("cf_sync_locks", "202300001", {
      token: "owner",
      expiresAt: Date.now() - 1_000,
    })
    expect(await renewCodeforcesSyncLock("202300001", "owner")).toBe(false)
  })

  it("does not start a job when lock acquisition exhausts retries", async () => {
    process.env.CODEFORCES_LOCK_ACQUIRE_RETRIES = "2"
    process.env.CODEFORCES_LOCK_RETRY_BASE_MS = "1"
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    const original = db.runTransaction.bind(db)
    let attempts = 0
    db.runTransaction = async () => {
      attempts += 1
      throw new Error("transaction unavailable")
    }
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")

    expect(result).toMatchObject({ ok: false, skipped: "lock_unavailable" })
    expect(attempts).toBe(3)
    expect(infoMock).not.toHaveBeenCalled()
    void original
    delete process.env.CODEFORCES_LOCK_ACQUIRE_RETRIES
    delete process.env.CODEFORCES_LOCK_RETRY_BASE_MS
  })

  it("retries transient lock transaction failures", async () => {
    process.env.CODEFORCES_LOCK_ACQUIRE_RETRIES = "2"
    process.env.CODEFORCES_LOCK_RETRY_BASE_MS = "1"
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    const original = db.runTransaction.bind(db)
    let attempts = 0
    db.runTransaction = async (callback) => {
      attempts += 1
      if (attempts === 1) throw new Error("transient")
      return original(callback)
    }
    adminDbRef.current = db

    const result = await syncTraineeCodeforces("202300001")

    expect(result.ok).toBe(true)
    expect(attempts).toBeGreaterThanOrEqual(2)
    delete process.env.CODEFORCES_LOCK_ACQUIRE_RETRIES
    delete process.env.CODEFORCES_LOCK_RETRY_BASE_MS
  })

  it("returns an empty summary without a database", async () => {
    expect(await syncDueCodeforcesAccounts()).toMatchObject({
      processed: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
      stoppedBy: "fallback",
    })
  })
})
