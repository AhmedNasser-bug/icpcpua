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

import { GET } from "@/app/api/leaderboard/me/route"
import {
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

function request(universityId?: string) {
  const cookie = universityId ? sessionCookieFor(universityId) : ""
  return new Request("http://localhost/api/leaderboard/me", {
    headers: cookie ? { cookie } : {},
  })
}

function trainee(universityId: string, pointsTotal: number, overrides: Record<string, unknown> = {}) {
  return {
    id: universityId,
    universityId,
    authUid: authUidFor(universityId),
    fullName: `Cadet ${universityId}`,
    status: "active",
    track: "level_1",
    pointsTotal,
    codeforcesHandle: "",
    cfRating: null,
    cfSolvedCount: null,
    ...overrides,
  }
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  resetAdminAuthMock()
})

describe("GET /api/leaderboard/me", () => {
  it("requires a session", async () => {
    const response = await GET(request())
    expect(response.status).toBe(401)
  })

  it("returns the development fallback without a database", async () => {
    const response = await GET(request("202300001"))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ success: false, simulated: true })
  })

  it("returns global and track standings for the signed-in trainee", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100))
    db.seed("trainees", "202300002", trainee("202300002", 200))
    db.seed("trainees", "202300003", trainee("202300003", 150, { track: "level_2" }))
    adminDbRef.current = db

    const response = await GET(request("202300001"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.standings.global).toMatchObject({ eligible: true, rank: 3, total: 3 })
    expect(body.standings.track).toMatchObject({ eligible: true, rank: 2, total: 2 })
  })

  it("shows ties with the same rank", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100))
    db.seed("trainees", "202300002", trainee("202300002", 100))
    db.seed("trainees", "202300003", trainee("202300003", 90))
    adminDbRef.current = db

    const response = await GET(request("202300001"))
    const body = await response.json()

    expect(body.standings.global).toMatchObject({ rank: 1 })
    expect(body.standings.track).toMatchObject({ rank: 1 })
  })

  it("does not fabricate a standing for an inactive trainee", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", 100, { status: "inactive" }))
    adminDbRef.current = db

    const response = await GET(request("202300001"))
    const body = await response.json()

    expect(body.standings.global).toMatchObject({
      eligible: false,
      reason: "inactive",
      rank: null,
    })
  })

  it("returns a 403 for a verified session whose trainee link is missing", async () => {
    adminDbRef.current = new FakeFirestore()
    const response = await GET(request("202300001"))
    expect(response.status).toBe(403)
  })

  it("fails closed with a 503 when Firestore is unavailable during authentication", async () => {
    adminDbRef.current = {
      collection: () => {
        throw new Error("firestore unavailable")
      },
    }
    const response = await GET(request("202300001"))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.success).toBe(false)
  })
})
