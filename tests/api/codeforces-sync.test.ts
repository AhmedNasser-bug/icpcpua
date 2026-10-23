import { beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef, infoMock, solvedMock } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
  infoMock: vi.fn(),
  solvedMock: vi.fn(),
}))

vi.mock("@/lib/firebase-admin", async () => {
  const { adminAuthMock } = await import("../helpers/auth")
  return {
    get adminDb() {
      return adminDbRef.current
    },
    adminAuth: adminAuthMock,
    FieldValue: { increment: (n: number) => ({ __increment: n }) },
  }
})

vi.mock("@/lib/codeforces/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/codeforces/client")>()
  return {
    ...actual,
    fetchCodeforcesUserInfo: (handle: string) => infoMock(handle),
    fetchCodeforcesSolvedProblems: (handle: string, previous: unknown) =>
      solvedMock(handle, previous),
  }
})

import { POST } from "@/app/api/trainees/codeforces/sync/route"
import { CodeforcesApiError } from "@/lib/codeforces/client"
import {
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

const SESSION_COOKIE = sessionCookieFor("202300001")

function trainee(overrides: Record<string, unknown> = {}) {
  return {
    id: "202300001",
    universityId: "202300001",
    authUid: authUidFor("202300001"),
    fullName: "Cadet 202300001",
    status: "active",
    track: "level_1",
    pointsTotal: 100,
    codeforcesHandle: "Tourist",
    codeforcesHandleLower: "tourist",
    cfHandleVerified: true,
    cfRating: 2300,
    cfMaxRating: 2400,
    cfSolvedCount: 50,
    cfSolvedProblemKeys: ["1:A"],
    cfLastSubmissionId: 10,
    cfLastSyncedAt: "2026-01-01T00:00:00.000Z",
    cfSyncAttemptedAt: null,
    cfSyncStatus: "success",
    cfSyncError: null,
    cfNextSyncAt: null,
    attendedSessionsCount: 0,
    qrScansCount: 0,
    ...overrides,
  }
}

function request(cookie = SESSION_COOKIE) {
  return new Request("http://localhost/api/trainees/codeforces/sync", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  resetAdminAuthMock()
  delete process.env.CODEFORCES_MANUAL_COOLDOWN_MS
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

describe("POST /api/trainees/codeforces/sync", () => {
  it("requires a session", async () => {
    const response = await POST(request(""))
    expect(response.status).toBe(401)
  })

  it("returns the development fallback without a database", async () => {
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ success: false, simulated: true })
  })

  it("returns a 403 when the verified session has no trainee link", async () => {
    adminDbRef.current = new FakeFirestore()
    const response = await POST(request())
    expect(response.status).toBe(403)
  })

  it("refuses to sync before a handle is linked", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee({ codeforcesHandle: "" }))
    adminDbRef.current = db

    const response = await POST(request())
    expect(response.status).toBe(409)
  })

  it("enforces a manual refresh cooldown", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee({ cfSyncAttemptedAt: new Date().toISOString() })
    )
    adminDbRef.current = db

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.retryAfterSeconds).toBeGreaterThan(0)
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("synchronizes data and returns the updated account plus standings", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee())
    db.seed(
      "trainees",
      "202300002",
      trainee({
        id: "202300002",
        universityId: "202300002",
        authUid: authUidFor("202300002"),
        email: "202300002@example.com",
        pointsTotal: 200,
        codeforcesHandle: "",
      })
    )
    adminDbRef.current = db

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      codeforces: {
        handle: "Tourist",
        rating: 2400,
        maxRating: 2500,
        solvedCount: 2,
        syncStatus: "success",
      },
      sync: { ok: true },
      standings: { global: { eligible: true, rank: 2, total: 2 } },
    })
    expect(typeof body.sync.syncedAt).toBe("string")
  })

  it("reports a failed sync without discarding the last valid data", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee())
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    )

    const response = await POST(request())
    const body = await response.json()
    const stored = db.read("trainees", "202300001")!

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      sync: {
        ok: false,
        error: "Codeforces is temporarily unavailable. The last synchronized data was kept.",
      },
      codeforces: { rating: 2300, solvedCount: 50, syncStatus: "failed" },
    })
    expect(stored.cfRating).toBe(2300)
    expect(stored.cfSolvedCount).toBe(50)
  })

  it("returns 503 when shared coordination is unavailable", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee())
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError(
        "coordination_unavailable",
        true,
        "Codeforces synchronization coordination is temporarily unavailable. Try again shortly."
      )
    )

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ success: false, code: "rate_limit_unavailable" })
    expect(response.headers.get("retry-after")).toBe("10")
  })

  it("returns a skipped result when another sync holds the lock", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee())
    db.seed("cf_sync_locks", "202300001", {
      token: "running",
      expiresAt: Date.now() + 60_000,
    })
    adminDbRef.current = db

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.sync).toMatchObject({ ok: false, skipped: "locked" })
    expect(infoMock).not.toHaveBeenCalled()
  })
})
