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

import { POST } from "@/app/api/trainees/register/route"
import {
  TRAINEE_AUTH_LINKS_COLLECTION,
  TRAINEE_AUTH_REVERSE_COLLECTION,
  TRAINEE_EMAIL_LINKS_COLLECTION,
  traineeEmailLinkDocumentId,
} from "@/lib/trainee-session"
import { adminAuthMock, authUidFor, resetAdminAuthMock } from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

const VALID_BODY = {
  fullName: "  Ahmed Nasser ",
  universityId: " 202300481 ",
  email: "  Ahmed@Example.com ",
  phone: " 01000000000 ",
  academicYear: "Year 2",
  track: "level_2",
  codeforcesHandle: "@ahmed_cp",
  idToken: "firebase-id-token",
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
  resetAdminAuthMock()
  adminAuthMock.verifyIdToken.mockResolvedValue({
    uid: authUidFor("202300481"),
    email: "ahmed@example.com",
    email_verified: false,
  })
  adminAuthMock.createSessionCookie.mockResolvedValue("registered-session")
})

describe("POST /api/trainees/register", () => {
  it("rejects a request that is missing required fields", async () => {
    const response = await POST(post({ ...VALID_BODY, email: "" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ success: false, error: "Please fill in all required fields." })
  })

  it("rejects a malformed Codeforces handle before writing", async () => {
    const db = new FakeFirestore()
    adminDbRef.current = db

    const response = await POST(post({ ...VALID_BODY, codeforcesHandle: "@bad handle!" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(db.read("trainees", "202300481")).toBeUndefined()
  })

  it("requires authentication once a database is configured", async () => {
    adminDbRef.current = new FakeFirestore()

    const response = await POST(post({ ...VALID_BODY, idToken: "" }))
    expect(response.status).toBe(401)
  })

  it("returns a simulated trainee when Firebase is not configured", async () => {
    const response = await POST(post({ ...VALID_BODY, idToken: "" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.simulated).toBe(true)
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

  it("writes the trainee, auth links, handle registry and welcome event atomically", async () => {
    const db = new FakeFirestore()
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    const body = await response.json()
    const trainee = db.read("trainees", "202300481")!

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.simulated).toBe(false)
    expect(trainee).toMatchObject({
      id: "202300481",
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 2",
      track: "level_2",
      codeforcesHandle: "ahmed_cp",
      codeforcesHandleLower: "ahmed_cp",
      authUid: authUidFor("202300481"),
      status: "active",
      pointsTotal: 10,
      cfRating: null,
      cfSolvedCount: null,
    })
    expect(db.read(TRAINEE_AUTH_LINKS_COLLECTION, authUidFor("202300481"))).toMatchObject({
      traineeId: "202300481",
    })
    expect(db.read(TRAINEE_EMAIL_LINKS_COLLECTION, traineeEmailLinkDocumentId("ahmed@example.com"))).toMatchObject({
      traineeId: "202300481",
    })
    expect(db.read("codeforces_links", "ahmed_cp")).toMatchObject({
      universityId: "202300481",
      handle: "ahmed_cp",
    })
    expect((await db.collection("point_events").get()).docs).toHaveLength(1)
    expect(response.headers.get("set-cookie")).toContain("registered-session")
  })

  it("is idempotent for a retry from the same Firebase UID", async () => {
    const db = new FakeFirestore()
    adminDbRef.current = db

    const first = await POST(post(VALID_BODY))
    const second = await POST(post(VALID_BODY))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect((await db.collection("point_events").get()).docs).toHaveLength(1)
  })

  it("rejects a duplicate university ID with a 409", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300481", {
      id: "202300481",
      email: "other@example.com",
      authUid: "someone-else",
      status: "active",
    })
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })

  it("rejects a UID already linked to another trainee", async () => {
    const db = new FakeFirestore()
    db.seed(TRAINEE_AUTH_LINKS_COLLECTION, authUidFor("202300481"), {
      traineeId: "202300999",
      uid: authUidFor("202300481"),
    })
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    expect(response.status).toBe(409)
    expect(db.read("trainees", "202300481")).toBeUndefined()
  })

  it("rejects a trainee with a different reverse UID mapping", async () => {
    const db = new FakeFirestore()
    db.seed(TRAINEE_AUTH_REVERSE_COLLECTION, "202300481", {
      traineeId: "202300481",
      uid: "someone-else",
    })
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    expect(response.status).toBe(409)
    expect(db.read("trainees", "202300481")).toBeUndefined()
  })

  it("rejects an email already owned by another trainee", async () => {
    const db = new FakeFirestore()
    db.seed(TRAINEE_EMAIL_LINKS_COLLECTION, traineeEmailLinkDocumentId("ahmed@example.com"), {
      traineeId: "202300999",
      email: "ahmed@example.com",
    })
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    expect(response.status).toBe(409)
  })

  it("rejects a Codeforces handle already owned by another trainee", async () => {
    const db = new FakeFirestore()
    db.seed("codeforces_links", "ahmed_cp", {
      universityId: "202300999",
      handle: "ahmed_cp",
    })
    adminDbRef.current = db

    const response = await POST(post(VALID_BODY))
    expect(response.status).toBe(409)
    expect(db.read("trainees", "202300481")).toBeUndefined()
  })

  it("rejects a body email that differs from the verified token email", async () => {
    adminDbRef.current = new FakeFirestore()

    const response = await POST(post({ ...VALID_BODY, email: "other@example.com" }))
    expect(response.status).toBe(400)
  })

  it("rate-limits repeated registration attempts", async () => {
    const db = new FakeFirestore()
    adminDbRef.current = db

    let lastStatus = 0
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await POST(post(VALID_BODY))
      lastStatus = response.status
    }

    expect(lastStatus).toBe(429)
  })

  it("returns a 400 response for a malformed JSON body", async () => {
    const response = await POST(post("{not-json"))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ success: false, error: "Request body must be valid JSON." })
  })
})
