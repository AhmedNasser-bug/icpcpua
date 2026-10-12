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

import { POST } from "@/app/api/trainees/register/route"

const VALID_BODY = {
  fullName: "  Ahmed Nasser ",
  universityId: " 202300481 ",
  email: "  Ahmed@Example.com ",
  phone: " 01000000000 ",
  academicYear: "Year 2",
  track: "level_2",
  codeforcesHandle: "@ahmed_cp",
}

function createRegisterDbMock(options: { exists?: boolean; commitFailure?: Error } = {}) {
  const setCalls: Array<{ ref: unknown; data: unknown }> = []
  const docRef = {
    id: "trainee-1",
    get: vi.fn(async () => ({ exists: options.exists ?? false })),
  }
  const traineeDoc = vi.fn((id: string) => {
    void id
    return docRef
  })
  const eventDocRef = { id: "event-1" }
  const eventDoc = vi.fn(() => eventDocRef)
  const batch = {
    set: vi.fn((ref: unknown, data: unknown) => {
      setCalls.push({ ref, data })
    }),
    commit: vi.fn(async () => {
      if (options.commitFailure) throw options.commitFailure
    }),
  }
  const adminDb = {
    collection: vi.fn((name: string) => {
      if (name === "trainees") return { doc: traineeDoc }
      if (name === "point_events") return { doc: eventDoc }
      throw new Error(`unexpected collection: ${name}`)
    }),
    batch: vi.fn(() => batch),
  }
  return { adminDb, setCalls, batch, docRef, traineeDoc }
}

function post(body: unknown) {
  return new Request("http://localhost/api/trainees/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
})

describe("POST /api/trainees/register", () => {
  it("rejects a request that is missing required fields", async () => {
    const response = await POST(post({ ...VALID_BODY, email: "" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ success: false, error: "Please fill in all required fields." })
  })

  it("returns a simulated trainee when Firebase is not configured", async () => {
    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toBe("Registration received (development fallback mode).")
    expect(body.trainee).toEqual({
      id: "sim_202300481",
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 2",
      track: "level_2",
      codeforcesHandle: "ahmed_cp",
      pointsTotal: 10,
      status: "active",
    })
  })

  it("normalises the input and writes the trainee plus the welcome point event", async () => {
    const db = createRegisterDbMock()
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.trainee).toMatchObject({
      id: "202300481",
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 2",
      track: "level_2",
      codeforcesHandle: "ahmed_cp",
      status: "active",
      pointsTotal: 10,
      cfRating: 0,
      cfSolvedCount: 0,
      attendedSessionsCount: 0,
      qrScansCount: 0,
    })
    expect(body.trainee.registeredAt).toEqual(expect.any(String))
    expect(body.trainee.updatedAt).toEqual(expect.any(String))

    expect(db.traineeDoc).toHaveBeenCalledWith("202300481")
    expect(db.batch.set).toHaveBeenCalledTimes(2)
    expect(db.setCalls[0]).toEqual({
      ref: db.docRef,
      data: body.trainee,
    })
    expect(db.setCalls[1]).toEqual({
      ref: { id: "event-1" },
      data: {
        id: "event-1",
        traineeId: "202300481",
        universityId: "202300481",
        type: "registration_welcome",
        points: 10,
        reason: "Initial onboarding & profile creation bonus",
        createdAt: body.trainee.registeredAt,
      },
    })
    expect(db.batch.commit).toHaveBeenCalledTimes(1)
  })

  it("rejects a duplicate university ID with a 409", async () => {
    const db = createRegisterDbMock({ exists: true })
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      success: false,
      error: "A trainee with this University ID is already registered in the system.",
    })
    expect(db.batch.set).not.toHaveBeenCalled()
  })

  it("returns a 500 response when the batch write fails", async () => {
    const db = createRegisterDbMock({ commitFailure: new Error("write conflict") })
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ success: false, error: "write conflict" })
  })

  it("returns a 500 response for a malformed JSON body", async () => {
    const response = await POST(post("{not-json"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
