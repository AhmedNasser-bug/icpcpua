import { beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
}))

vi.mock("@/lib/firebase-admin", () => ({
  get adminDb() {
    return adminDbRef.current
  },
  FieldValue: { increment: (n: number) => ({ __increment: n }) },
}))

import { GET } from "@/app/api/leaderboard/route"

interface QueryMock {
  where: ReturnType<typeof vi.fn>
  orderBy: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  collection: ReturnType<typeof vi.fn>
}

function createFirestoreMock(
  options: { docs?: Array<{ fullName?: string; [key: string]: unknown }>; empty?: boolean; failure?: Error } = {}
): QueryMock {
  const get = vi.fn(async () => {
    if (options.failure) throw options.failure
    const docs = (options.docs ?? []).map((doc) => ({ data: () => doc }))
    return { empty: options.empty ?? docs.length === 0, docs }
  })

  const query = {
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    get,
  } as unknown as QueryMock

  query.collection = vi.fn(() => query)
  return query
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
})

describe("GET /api/leaderboard", () => {
  it("serves the local fallback leaderboard when Firebase is not configured", async () => {
    const response = await GET(new Request("http://localhost/api/leaderboard"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.source).toBe("local_cache")
    expect(body.count).toBe(5)
    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 2, 3, 4, 5])
    expect(body.leaderboard[0]).toMatchObject({
      handle: "algo_queen",
      fullName: "Nourhan Ezzat",
      track: "level_2",
      color: "#FFD500",
    })
  })

  it("filters the fallback leaderboard by track and re-ranks the result", async () => {
    const response = await GET(new Request("http://localhost/api/leaderboard?track=level_1"))
    const body = await response.json()

    expect(body.source).toBe("local_cache")
    expect(body.count).toBe(3)
    expect(body.leaderboard.every((entry: { track: string }) => entry.track === "level_1")).toBe(true)
    expect(body.leaderboard.map((entry: { rank: number }) => entry.rank)).toEqual([1, 2, 3])
    expect(body.leaderboard[0]).toMatchObject({ handle: "dp_master", color: "#FFD500" })
  })

  it("returns every fallback entry for the 'all' track filter", async () => {
    const response = await GET(new Request("http://localhost/api/leaderboard?track=all"))
    const body = await response.json()

    expect(body.count).toBe(5)
  })

  it("returns an empty list when the fallback has no matching track", async () => {
    const response = await GET(new Request("http://localhost/api/leaderboard?track=level_3"))
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.count).toBe(0)
    expect(body.leaderboard).toEqual([])
  })

  it("falls back to seed defaults when the trainee collection is empty", async () => {
    const firestore = createFirestoreMock({ empty: true })
    adminDbRef.current = firestore

    const response = await GET(new Request("http://localhost/api/leaderboard?track=level_2"))
    const body = await response.json()

    expect(body.source).toBe("seed_defaults")
    expect(body.count).toBe(2)
    expect(body.leaderboard.every((entry: { track: string }) => entry.track === "level_2")).toBe(true)
  })

  it("maps Firestore documents into ranked leaderboard rows", async () => {
    const firestore = createFirestoreMock({
      docs: [
        {
          fullName: "Nourhan Ezzat",
          codeforcesHandle: "algo_queen",
          cfRating: 2100,
          cfSolvedCount: 540,
          pointsTotal: 1240,
          track: "level_2",
          universityId: "202300001",
          attendedSessionsCount: 3,
          qrScansCount: 4,
        },
        {
          fullName: "Karim Mostafa",
          codeforcesHandle: "",
          cfRating: 1850,
          cfSolvedCount: 487,
          pointsTotal: 1050,
          track: "level_1",
          universityId: "PUA-98765",
        },
        { fullName: "", universityId: "PUA-0000" },
      ],
    })
    adminDbRef.current = firestore

    const response = await GET(new Request("http://localhost/api/leaderboard"))
    const body = await response.json()

    expect(body.source).toBe("firestore")
    expect(body.count).toBe(3)
    expect(body.leaderboard[0]).toMatchObject({
      rank: 1,
      handle: "@algo_queen",
      fullName: "Nourhan Ezzat",
      rating: 2100,
      solved: 540,
      pointsTotal: 1240,
      track: "level_2",
      initials: "NE",
      color: "#FFD500",
      universityId: "202300001",
      attendedSessionsCount: 3,
      qrScansCount: 4,
    })
    expect(body.leaderboard[1]).toMatchObject({
      rank: 2,
      handle: "@user_8765",
      initials: "KM",
      color: "#E0E0E0",
      rating: 1850,
      solved: 487,
      pointsTotal: 1050,
      attendedSessionsCount: 0,
      qrScansCount: 0,
    })
    expect(body.leaderboard[2]).toMatchObject({
      rank: 3,
      handle: "@user_0000",
      initials: "T",
      color: "#FF0055",
      pointsTotal: 0,
    })
  })

  it("cycles the podium colours for rows beyond the palette length", async () => {
    const docs = Array.from({ length: 6 }, (_, index) => ({
      fullName: `Cadet ${index}`,
      codeforcesHandle: `coder_${index}`,
      pointsTotal: 100 - index,
      track: "level_1",
      universityId: `20230000${index}`,
    }))
    adminDbRef.current = createFirestoreMock({ docs })

    const response = await GET(new Request("http://localhost/api/leaderboard"))
    const body = await response.json()

    expect(body.leaderboard[0].color).toBe("#FFD500")
    expect(body.leaderboard[4].color).toBe("#7B2CBF")
    expect(body.leaderboard[5].color).toBe("#FFD500")
  })

  it("applies the track filter and the requested limit to the Firestore query", async () => {
    const firestore = createFirestoreMock({ docs: [{ fullName: "A", track: "level_2" }] })
    adminDbRef.current = firestore

    await GET(new Request("http://localhost/api/leaderboard?track=level_2&limit=10"))

    expect(firestore.collection).toHaveBeenCalledWith("trainees")
    expect(firestore.where).toHaveBeenNthCalledWith(1, "status", "==", "active")
    expect(firestore.where).toHaveBeenNthCalledWith(2, "track", "==", "level_2")
    expect(firestore.orderBy).toHaveBeenCalledWith("pointsTotal", "desc")
    expect(firestore.limit).toHaveBeenCalledWith(10)
  })

  it("defaults the query limit to 50 and skips the track filter for 'all'", async () => {
    const firestore = createFirestoreMock({ docs: [{ fullName: "A" }] })
    adminDbRef.current = firestore

    await GET(new Request("http://localhost/api/leaderboard?track=all"))

    expect(firestore.where).toHaveBeenCalledTimes(1)
    expect(firestore.limit).toHaveBeenCalledWith(50)
  })

  it("falls back to the default limit for invalid values and clamps large ones", async () => {
    const firestore = createFirestoreMock({ docs: [{ fullName: "A" }] })
    adminDbRef.current = firestore

    await GET(new Request("http://localhost/api/leaderboard?limit=abc"))
    expect(firestore.limit).toHaveBeenLastCalledWith(50)

    await GET(new Request("http://localhost/api/leaderboard?limit=0"))
    expect(firestore.limit).toHaveBeenLastCalledWith(50)

    await GET(new Request("http://localhost/api/leaderboard?limit=500"))
    expect(firestore.limit).toHaveBeenLastCalledWith(100)
  })

  it("returns a 500 response when the Firestore query fails", async () => {
    adminDbRef.current = createFirestoreMock({ failure: new Error("firestore unavailable") })

    const response = await GET(new Request("http://localhost/api/leaderboard"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ success: false, error: "firestore unavailable" })
  })
})
