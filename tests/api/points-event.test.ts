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

import { POST } from "@/app/api/points/event/route"

const VALID_BODY = {
  universityId: " 202300481 ",
  type: "qr_scan",
  points: 25,
  reason: "Campus challenge QR",
  metadata: { qrCodeId: "QR-1", sessionId: "S-1" },
}

function createPointsDbMock(
  options: { traineeExists?: boolean; duplicateScan?: boolean; commitFailure?: Error } = {}
) {
  const traineeRef = {
    get: vi.fn(async () => ({ exists: options.traineeExists ?? true })),
  }
  const eventDocRef = { id: "event-9" }
  const queryGet = vi.fn(async () => ({ empty: !options.duplicateScan }))
  const query = {
    where: vi.fn(() => query),
    limit: vi.fn(() => query),
    get: queryGet,
  }
  const pointEvents = Object.assign(query, { doc: vi.fn(() => eventDocRef) })
  const batch = {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(async () => {
      if (options.commitFailure) throw options.commitFailure
    }),
  }
  const adminDb = {
    collection: vi.fn((name: string) => {
      if (name === "trainees") return { doc: vi.fn(() => traineeRef) }
      if (name === "point_events") return pointEvents
      throw new Error(`unexpected collection: ${name}`)
    }),
    batch: vi.fn(() => batch),
  }
  return { adminDb, batch, traineeRef, pointEvents, eventDocRef }
}

function post(body: unknown) {
  return new Request("http://localhost/api/points/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  adminDbRef.current = null
  delete process.env.POINTS_EVENT_SECRET
  vi.clearAllMocks()
})

describe("POST /api/points/event", () => {
  it("rejects a request with missing parameters", async () => {
    const response = await POST(post({ universityId: "202300481", type: "qr_scan" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      success: false,
      error: "Missing required parameters: universityId, type, points, reason",
    })
  })

  it("rejects a non-numeric points value", async () => {
    const response = await POST(post({ ...VALID_BODY, points: "25" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it("rejects an unknown point event type", async () => {
    const response = await POST(post({ ...VALID_BODY, type: "free_money" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ success: false, error: "Unknown point event type: free_money" })
  })

  it("rejects points that are not positive-range integers", async () => {
    for (const points of [25.5, 1001, -1001]) {
      const response = await POST(post({ ...VALID_BODY, points }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    }
  })

  it("requires the bearer secret when POINTS_EVENT_SECRET is configured", async () => {
    process.env.POINTS_EVENT_SECRET = "s3cret"

    const unauthorized = await POST(post(VALID_BODY))
    expect(unauthorized.status).toBe(401)

    const authorized = await POST(
      new Request("http://localhost/api/points/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer s3cret",
        },
        body: JSON.stringify(VALID_BODY),
      })
    )
    expect(authorized.status).toBe(200)
  })

  it("simulates success when Firebase is not configured", async () => {
    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message: "Simulated: Awarded 25 points to 202300481 (Campus challenge QR)",
    })
  })

  it("returns a 404 when the trainee does not exist", async () => {
    const db = createPointsDbMock({ traineeExists: false })
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      success: false,
      error: "Trainee with University ID 202300481 was not found.",
    })
    expect(db.batch.set).not.toHaveBeenCalled()
  })

  it("rejects a QR code already claimed by the same trainee with a 409", async () => {
    const db = createPointsDbMock({ duplicateScan: true })
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      success: false,
      error: "This QR code has already been claimed by this student.",
    })
    expect(db.pointEvents.where).toHaveBeenNthCalledWith(1, "universityId", "==", "202300481")
    expect(db.pointEvents.where).toHaveBeenNthCalledWith(2, "type", "==", "qr_scan")
    expect(db.pointEvents.where).toHaveBeenNthCalledWith(3, "metadata.qrCodeId", "==", "QR-1")
    expect(db.pointEvents.limit).toHaveBeenCalledWith(1)
    expect(db.batch.set).not.toHaveBeenCalled()
    expect(db.batch.update).not.toHaveBeenCalled()
    expect(db.batch.commit).not.toHaveBeenCalled()
  })

  it("records a QR scan and increments both counters atomically", async () => {
    const db = createPointsDbMock()
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toBe("Successfully processed 25 points event for 202300481!")
    expect(body.event).toMatchObject({
      id: "event-9",
      traineeId: "202300481",
      universityId: "202300481",
      type: "qr_scan",
      points: 25,
      reason: "Campus challenge QR",
      metadata: { qrCodeId: "QR-1", sessionId: "S-1" },
    })

    expect(db.batch.set).toHaveBeenCalledWith(db.eventDocRef, body.event)
    expect(db.batch.update).toHaveBeenCalledWith(expect.anything(), {
      pointsTotal: { __increment: 25 },
      updatedAt: body.event.createdAt,
      qrScansCount: { __increment: 1 },
    })
    expect(db.batch.commit).toHaveBeenCalledTimes(1)
  })

  it("increments the attendance counter for session attendance", async () => {
    const db = createPointsDbMock()
    adminDbRef.current = db.adminDb

    const response = await POST(
      post({ ...VALID_BODY, type: "session_attendance", metadata: { sessionId: "S-2" } })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    const updatePayload = db.batch.update.mock.calls[0][1]
    expect(updatePayload).toMatchObject({
      pointsTotal: { __increment: 25 },
      attendedSessionsCount: { __increment: 1 },
    })
    expect(updatePayload).not.toHaveProperty("qrScansCount")
    expect(body.event.metadata).toEqual({ sessionId: "S-2" })
  })

  it("only updates the point total for other event types", async () => {
    const db = createPointsDbMock()
    adminDbRef.current = db.adminDb

    await POST(post({ ...VALID_BODY, type: "coach_bonus", metadata: undefined }))

    const updatePayload = db.batch.update.mock.calls[0][1]
    expect(Object.keys(updatePayload).sort()).toEqual(["pointsTotal", "updatedAt"])
  })

  it("does not run the duplicate check for QR scans without a code id", async () => {
    const db = createPointsDbMock({ duplicateScan: true })
    adminDbRef.current = db.adminDb

    const response = await POST(post({ ...VALID_BODY, metadata: {} }))

    expect(response.status).toBe(200)
    expect(db.pointEvents.get).not.toHaveBeenCalled()
    expect(db.batch.commit).toHaveBeenCalledTimes(1)
  })

  it("returns a 400 response for a malformed JSON body", async () => {
    const response = await POST(post("{not-json"))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ success: false, error: "Request body must be valid JSON." })
  })

  it("returns a 500 response when the batch commit fails", async () => {
    const db = createPointsDbMock({ commitFailure: new Error("transaction aborted") })
    adminDbRef.current = db.adminDb

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ success: false, error: "transaction aborted" })
  })
})
