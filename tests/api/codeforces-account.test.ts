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

import { DELETE, GET, PUT } from "@/app/api/trainees/codeforces/route"
import { CodeforcesApiError } from "@/lib/codeforces/client"
import {
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

const SESSION_COOKIE = sessionCookieFor("202300001")

function trainee(universityId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: universityId,
    universityId,
    authUid: authUidFor(universityId),
    fullName: `Cadet ${universityId}`,
    email: `${universityId}@example.com`,
    status: "active",
    track: "level_1",
    pointsTotal: 100,
    codeforcesHandle: "",
    codeforcesHandleLower: "",
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
    cfNextSyncAt: null,
    attendedSessionsCount: 0,
    qrScansCount: 0,
    registeredAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function request(method: string, body?: unknown, cookie = SESSION_COOKIE) {
  return new Request("http://localhost/api/trainees/codeforces", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  resetAdminAuthMock()
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

describe("GET /api/trainees/codeforces", () => {
  it("requires a trainee session", async () => {
    const response = await GET(request("GET", undefined, ""))
    expect(response.status).toBe(401)
  })

  it("rejects a verified session that is not linked to a trainee", async () => {
    adminDbRef.current = new FakeFirestore()

    const response = await GET(request("GET"))
    expect(response.status).toBe(403)
  })

  it("returns the development fallback without a database", async () => {
    const response = await GET(request("GET"))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ success: false, simulated: true })
  })

  it("returns the profile dashboard with global and track standings", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("trainees", "202300002", trainee("202300002", { pointsTotal: 200 }))
    adminDbRef.current = db

    const response = await GET(request("GET"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      trainee: { universityId: "202300001", pointsTotal: 100 },
      codeforces: { linked: false, verified: false, rating: null },
    })
    expect(body.standings.global).toMatchObject({ eligible: true, rank: 2, total: 2 })
    expect(body.standings.track).toMatchObject({ eligible: true, rank: 2, total: 2 })
  })
})

describe("PUT /api/trainees/codeforces", () => {
  it("requires a session", async () => {
    const response = await PUT(request("PUT", { handle: "tourist" }, ""))
    expect(response.status).toBe(401)
  })

  it("rejects an invalid handle format before calling Codeforces", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    const response = await PUT(request("PUT", { handle: "bad handle!" }))

    expect(response.status).toBe(400)
    expect(infoMock).not.toHaveBeenCalled()
  })

  it("returns a 404 when Codeforces does not know the handle", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError("not_found", false, "Codeforces handle was not found.")
    )

    const response = await PUT(request("PUT", { handle: "missing" }))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ success: false, error: "Codeforces handle was not found." })
  })

  it("returns a 503 when Codeforces is unavailable", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    infoMock.mockRejectedValue(
      new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    )

    const response = await PUT(request("PUT", { handle: "tourist" }))

    expect(response.status).toBe(503)
    expect(db.read("trainees", "202300001")!.codeforcesHandle).toBe("")
  })

  it("links a verified handle, persists synchronized data and ignores mass-assignment fields", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    const response = await PUT(
      request("PUT", {
        handle: " @Tourist ",
        cfRating: 9999,
        cfSolvedCount: 9999,
        pointsTotal: 9999,
        universityId: "202300999",
      })
    )
    const body = await response.json()
    const stored = db.read("trainees", "202300001")!

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      codeforces: {
        handle: "Tourist",
        verified: true,
        rating: 2400,
        maxRating: 2500,
        solvedCount: 2,
      },
      sync: { ok: true },
    })
    expect(stored).toMatchObject({
      codeforcesHandle: "Tourist",
      codeforcesHandleLower: "tourist",
      cfRating: 2400,
      cfSolvedCount: 2,
      cfSyncStatus: "success",
      pointsTotal: 100,
      universityId: "202300001",
    })
    expect(db.has("codeforces_links", "tourist")).toBe(true)
    expect(db.read("codeforces_links", "tourist")!.universityId).toBe("202300001")
  })

  it("rejects a handle already linked to another trainee", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("trainees", "202300002", trainee("202300002"))
    db.seed("codeforces_links", "tourist", {
      universityId: "202300002",
      handle: "Tourist",
    })
    adminDbRef.current = db

    const response = await PUT(request("PUT", { handle: "tourist" }))
    const stored = db.read("trainees", "202300001")!

    expect(response.status).toBe(409)
    expect(stored.codeforcesHandle).toBe("")
    expect(db.read("codeforces_links", "tourist")!.universityId).toBe("202300002")
  })

  it("updates a handle, clears the old aggregates and moves the uniqueness registry", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", {
        codeforcesHandle: "OldHandle",
        codeforcesHandleLower: "oldhandle",
        cfHandleVerified: true,
        cfRating: 1200,
        cfMaxRating: 1300,
        cfSolvedCount: 30,
        cfSolvedProblemKeys: ["5:E"],
        cfLastSubmissionId: 5,
        cfLastSyncedAt: new Date().toISOString(),
        cfSyncStatus: "success",
      })
    )
    db.seed("codeforces_links", "oldhandle", {
      universityId: "202300001",
      handle: "OldHandle",
    })
    adminDbRef.current = db

    const response = await PUT(request("PUT", { handle: "Tourist" }))
    const stored = db.read("trainees", "202300001")!

    expect(response.status).toBe(200)
    expect(stored).toMatchObject({
      codeforcesHandle: "Tourist",
      codeforcesHandleLower: "tourist",
      cfRating: 2400,
      cfSolvedCount: 2,
      cfSolvedProblemKeys: ["1:A", "2:B"],
      cfSyncStatus: "success",
    })
    expect(db.has("codeforces_links", "oldhandle")).toBe(false)
    expect(db.has("codeforces_links", "tourist")).toBe(true)
  })
})

describe("DELETE /api/trainees/codeforces", () => {
  it("requires a session", async () => {
    const response = await DELETE(request("DELETE", undefined, ""))
    expect(response.status).toBe(401)
  })

  it("disconnects the account without changing internal points", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", {
        codeforcesHandle: "Tourist",
        codeforcesHandleLower: "tourist",
        cfHandleVerified: true,
        cfRating: 2400,
        cfMaxRating: 2500,
        cfSolvedCount: 500,
        cfLastSyncedAt: new Date().toISOString(),
        cfSyncStatus: "success",
      })
    )
    db.seed("codeforces_links", "tourist", {
      universityId: "202300001",
      handle: "Tourist",
    })
    adminDbRef.current = db

    const response = await DELETE(request("DELETE"))
    const body = await response.json()
    const stored = db.read("trainees", "202300001")!

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      codeforces: { linked: false, handle: null, rating: null, solvedCount: null },
    })
    expect(stored).toMatchObject({
      codeforcesHandle: "",
      cfRating: null,
      cfSolvedCount: null,
      cfSyncStatus: "never",
      pointsTotal: 100,
    })
    expect(db.has("codeforces_links", "tourist")).toBe(false)
  })
})
