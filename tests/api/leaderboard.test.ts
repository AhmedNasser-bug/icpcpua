import { beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
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

import { GET } from "@/app/api/leaderboard/route"
import {
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

function trainee(
  universityId: string,
  pointsTotal: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    id: universityId,
    universityId,
    authUid: authUidFor(universityId),
    fullName: `Cadet ${universityId}`,
    status: "active",
    track: "level_1",
    pointsTotal,
    cfRating: null,
    cfSolvedCount: null,
    cfHandleVerified: false,
    codeforcesHandle: "",
    attendedSessionsCount: 0,
    qrScansCount: 0,
    ...overrides,
  }
}

function request(path: string, universityId?: string) {
  const headers: Record<string, string> = {}
  if (universityId) {
    headers.cookie = sessionCookieFor(universityId)
  }
  return new Request(`http://localhost${path}`, { headers })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  resetAdminAuthMock()
})

describe("GET /api/leaderboard", () => {
  it("serves the local fallback leaderboard when Firebase is not configured", async () => {
    const response = await GET(request("/api/leaderboard"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.source).toBe("local_cache")
    expect(body.total).toBe(5)
    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 2, 3, 4, 5])
    expect(body.leaderboard[0]).toMatchObject({
      handle: "algo_queen",
      fullName: "Nourhan Ezzat",
      track: "level_2",
      color: "#FFD500",
    })
  })

  it("filters the fallback leaderboard by track and re-ranks the result", async () => {
    const response = await GET(request("/api/leaderboard?track=level_1"))
    const body = await response.json()

    expect(body.source).toBe("local_cache")
    expect(body.total).toBe(3)
    expect(body.leaderboard.every((entry: { track: string }) => entry.track === "level_1")).toBe(
      true
    )
    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 2, 3])
    expect(body.leaderboard[0]).toMatchObject({ handle: "dp_master", color: "#FFD500" })
  })

  it("returns every fallback entry for the 'all' track filter and paginates", async () => {
    const response = await GET(request("/api/leaderboard?track=all&page=2&limit=2"))
    const body = await response.json()

    expect(body.total).toBe(5)
    expect(body.page).toBe(2)
    expect(body.pageSize).toBe(2)
    expect(body.totalPages).toBe(3)
    expect(body.leaderboard.map((entry: { handle: string }) => entry.handle)).toEqual([
      "dp_master",
      "graph_wiz",
    ])
    expect(body.leaderboard[0].rank).toBe(3)
  })

  it("returns an empty list when the fallback has no matching track", async () => {
    const response = await GET(request("/api/leaderboard?track=level_3"))
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.total).toBe(0)
    expect(body.leaderboard).toEqual([])
  })

  it("falls back to seed defaults when the trainee collection is empty", async () => {
    adminDbRef.current = new FakeFirestore()

    const response = await GET(request("/api/leaderboard?track=level_2"))
    const body = await response.json()

    expect(body.source).toBe("seed_defaults")
    expect(body.total).toBe(2)
    expect(body.leaderboard.every((entry: { track: string }) => entry.track === "level_2")).toBe(
      true
    )
  })

  it("does not show seed data when real trainees exist but none are active", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100, { status: "inactive" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard", "202300001"))
    const body = await response.json()

    expect(body.source).toBe("firestore")
    expect(body.total).toBe(0)
    expect(body.leaderboard).toEqual([])
    expect(body.viewer).toMatchObject({ eligible: false, reason: "inactive", rank: null })
  })

  it("maps Firestore documents into ranked leaderboard rows", async () => {
    const db = new FakeFirestore()
    db.seed(
      "trainees",
      "202300001",
      trainee("202300001", 1240, {
        fullName: "Nourhan Ezzat",
        track: "level_2",
        codeforcesHandle: "algo_queen",
        codeforcesHandleLower: "algo_queen",
        cfHandleVerified: true,
        cfRating: 2100,
        cfMaxRating: 2200,
        cfSolvedCount: 540,
        cfLastSyncedAt: new Date().toISOString(),
        cfSyncStatus: "success",
        attendedSessionsCount: 3,
        qrScansCount: 4,
      })
    )
    db.seed("trainees", "PUA-98765", trainee("PUA-98765", 1050, { cfRating: 1850 }))
    db.seed("trainees", "PUA-0000", trainee("PUA-0000", 0, { fullName: "" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard"))
    const body = await response.json()

    expect(body.source).toBe("firestore")
    expect(body.total).toBe(3)
    expect(body.leaderboard[0]).toMatchObject({
      rank: 1,
      handle: "@algo_queen",
      codeforcesHandle: "algo_queen",
      fullName: "Nourhan Ezzat",
      rating: 2100,
      maxRating: 2200,
      solved: 540,
      pointsTotal: 1240,
      track: "level_2",
      initials: "NE",
      color: "#FFD500",
      universityId: "202300001",
      attendedSessionsCount: 3,
      qrScansCount: 4,
      syncStatus: "success",
    })
    expect(body.leaderboard[1]).toMatchObject({
      rank: 2,
      handle: "@user_8765",
      initials: "CP",
      color: "#E0E0E0",
      rating: null,
      solved: null,
      pointsTotal: 1050,
    })
    expect(body.leaderboard[2]).toMatchObject({
      rank: 3,
      handle: "@user_0000",
      initials: "T",
      pointsTotal: 0,
    })
  })

  it("uses competition ranking and the documented tie-break order", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300003", trainee("202300003", 100, { fullName: "Third" }))
    db.seed("trainees", "202300001", trainee("202300001", 100, { fullName: "First" }))
    db.seed("trainees", "202300004", trainee("202300004", 90, { fullName: "Fourth" }))
    db.seed("trainees", "202300002", trainee("202300002", 100, { fullName: "Second" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?limit=10"))
    const body = await response.json()

    expect(body.leaderboard.map((entry: { universityId: string }) => entry.universityId)).toEqual([
      "202300001",
      "202300002",
      "202300003",
      "202300004",
    ])
    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 1, 1, 4])
  })

  it("keeps ranks stable when a page starts inside a tie", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100))
    db.seed("trainees", "202300002", trainee("202300002", 100))
    db.seed("trainees", "202300003", trainee("202300003", 100))
    db.seed("trainees", "202300004", trainee("202300004", 90))
    db.seed("trainees", "202300005", trainee("202300005", 80))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?page=2&limit=2"))
    const body = await response.json()

    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 4])
    expect(body.leaderboard.map((entry: { universityId: string }) => entry.universityId)).toEqual([
      "202300003",
      "202300004",
    ])
  })

  it("filters by track and paginates with the correct total", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100, { track: "level_1" }))
    db.seed("trainees", "202300002", trainee("202300002", 90, { track: "level_2" }))
    db.seed("trainees", "202300003", trainee("202300003", 80, { track: "level_1" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?track=level_1&limit=1"))
    const body = await response.json()

    expect(body.total).toBe(2)
    expect(body.totalPages).toBe(2)
    expect(body.leaderboard).toHaveLength(1)
    expect(body.leaderboard[0].universityId).toBe("202300001")
  })

  it("returns the authenticated trainee's standing even outside the current page", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300))
    db.seed("trainees", "202300002", trainee("202300002", 200))
    db.seed("trainees", "202300003", trainee("202300003", 100))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?page=2&limit=1", "202300003"))
    const body = await response.json()

    expect(body.leaderboard).toHaveLength(1)
    expect(body.leaderboard[0].universityId).toBe("202300002")
    expect(body.viewer).toMatchObject({
      eligible: true,
      rank: 3,
      total: 3,
      universityId: "202300003",
      pointsTotal: 100,
    })
  })

  it("marks the viewer row on the current page", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300))
    db.seed("trainees", "202300002", trainee("202300002", 200))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard", "202300002"))
    const body = await response.json()

    expect(body.leaderboard[1]).toMatchObject({ isViewer: true, rank: 2 })
    expect(body.leaderboard[0].isViewer).toBeUndefined()
  })

  it("reports an ineligible viewer without inventing a rank", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300))
    db.seed("trainees", "202300002", trainee("202300002", 200, { status: "inactive" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard", "202300002"))
    const body = await response.json()

    expect(body.viewer).toMatchObject({
      eligible: false,
      reason: "inactive",
      rank: null,
    })
  })

  it("reports a viewer outside the selected track without inventing a rank", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300, { track: "level_1" }))
    db.seed("trainees", "202300002", trainee("202300002", 200, { track: "level_2" }))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?track=level_2", "202300001"))
    const body = await response.json()

    expect(body.viewer).toMatchObject({
      eligible: false,
      reason: "track",
      rank: null,
    })
  })

  it("ignores an invalid session cookie", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300))
    adminDbRef.current = db

    const response = await GET(
      new Request("http://localhost/api/leaderboard", {
        headers: { cookie: "pua_trainee_session=forged.value" },
      })
    )
    const body = await response.json()

    expect(body.viewer).toBeNull()
  })

  it("returns an empty page beyond the last row without dropping the total", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 300))
    adminDbRef.current = db

    const response = await GET(request("/api/leaderboard?page=5&limit=10"))
    const body = await response.json()

    expect(body.leaderboard).toEqual([])
    expect(body.total).toBe(1)
    expect(body.hasMore).toBe(false)
  })

  it("defaults the page size to 50 and clamps large limits", async () => {
    const db = new FakeFirestore()
    for (let index = 0; index < 120; index += 1) {
      db.seed(
        "trainees",
        `2023${String(index).padStart(5, "0")}`,
        trainee(`2023${String(index).padStart(5, "0")}`, 1000 - index)
      )
    }
    adminDbRef.current = db

    const defaultResponse = await GET(request("/api/leaderboard"))
    expect((await defaultResponse.json()).leaderboard).toHaveLength(50)

    const clampedResponse = await GET(request("/api/leaderboard?limit=500"))
    expect((await clampedResponse.json()).leaderboard).toHaveLength(100)

    const invalidResponse = await GET(request("/api/leaderboard?limit=abc"))
    expect((await invalidResponse.json()).leaderboard).toHaveLength(50)
  })

  it("returns a generic 500 response when the Firestore query fails", async () => {
    adminDbRef.current = {
      collection: () => {
        throw new Error("firestore unavailable")
      },
    }

    const response = await GET(request("/api/leaderboard"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ success: false, error: "Failed to load leaderboard." })
  })
})
