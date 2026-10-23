import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

import { DELETE, GET, POST } from "@/app/api/trainees/session/route"
import { TRAINEE_AUTH_LINKS_COLLECTION, TRAINEE_SESSION_COOKIE } from "@/lib/trainee-session"
import {
  adminAuthMock,
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

const TOKEN = "id-token-202300481"

function post(body: unknown) {
  return new Request("http://localhost/api/trainees/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function get(cookie?: string) {
  return new Request("http://localhost/api/trainees/session", {
    headers: cookie ? { cookie } : {},
  })
}

function seedTrainee(db: FakeFirestore, overrides: Record<string, unknown> = {}) {
  db.seed("trainees", "202300481", {
    id: "202300481",
    universityId: "202300481",
    fullName: "Ahmed Nasser",
    email: "ahmed@example.com",
    authUid: authUidFor("202300481"),
    track: "level_2",
    academicYear: "Year 2",
    status: "active",
    pointsTotal: 10,
    ...overrides,
  })
}

beforeEach(() => {
  adminDbRef.current = null
  resetAdminAuthMock()
  adminAuthMock.verifyIdToken.mockResolvedValue({
    uid: authUidFor("202300481"),
    email: "ahmed@example.com",
    email_verified: true,
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("POST /api/trainees/session", () => {
  it("requires an ID token", async () => {
    const response = await POST(post({}))
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ success: false })
  })

  it("returns the development fallback without a database", async () => {
    const response = await POST(post({ idToken: TOKEN }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ success: false, simulated: true })
  })

  it("creates a session cookie for a valid token and linked trainee", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db
    adminAuthMock.createSessionCookie.mockResolvedValue("firebase-session-cookie")

    const response = await POST(post({ idToken: TOKEN }))
    const body = await response.json()
    const cookie = response.headers.get("set-cookie") ?? ""

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      trainee: { universityId: "202300481", fullName: "Ahmed Nasser" },
      admin: false,
    })
    expect(adminAuthMock.createSessionCookie).toHaveBeenCalledWith(TOKEN, {
      expiresIn: 5 * 24 * 60 * 60 * 1000,
    })
    expect(cookie).toContain("pua_trainee_session=")
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("firebase-session-cookie")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("rejects missing, invalid and expired ID tokens", async () => {
    adminDbRef.current = new FakeFirestore()

    adminAuthMock.verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error("bad"), { code: "auth/invalid-id-token" })
    )
    expect((await POST(post({ idToken: "bad" }))).status).toBe(401)

    adminAuthMock.verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error("expired"), { code: "auth/id-token-expired" })
    )
    expect((await POST(post({ idToken: "expired" }))).status).toBe(401)
  })

  it("rejects a disabled Firebase user", async () => {
    adminDbRef.current = new FakeFirestore()
    adminAuthMock.getUser.mockResolvedValue({ uid: "firebase-202300481", disabled: true })

    const response = await POST(post({ idToken: TOKEN }))
    expect(response.status).toBe(403)
  })

  it("rejects an unlinked Firebase account", async () => {
    adminDbRef.current = new FakeFirestore()
    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "firebase-unlinked",
      email: "unlinked@example.com",
      email_verified: true,
    })

    const response = await POST(post({ idToken: "unlinked" }))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.code).toBe("TRAINEE_NOT_REGISTERED")
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("requires an explicit university id before linking a verified email", async () => {
    const db = new FakeFirestore()
    seedTrainee(db, { authUid: undefined })
    adminDbRef.current = db

    const response = await POST(post({ idToken: TOKEN }))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toMatchObject({ code: "ACCOUNT_LINK_REQUIRED", universityIdRequired: true })
    expect(db.read("trainees", "202300481")!.authUid).toBeUndefined()
  })

  it("links a verified email to a requested trainee exactly once", async () => {
    const db = new FakeFirestore()
    seedTrainee(db, { authUid: undefined })
    adminDbRef.current = db
    adminAuthMock.createSessionCookie.mockResolvedValue("linked-session")

    const first = await POST(post({ idToken: TOKEN, universityId: "202300481" }))
    const second = await POST(post({ idToken: TOKEN, universityId: "202300481" }))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(db.read("trainees", "202300481")!.authUid).toBe(authUidFor("202300481"))
    expect(
      db.read(TRAINEE_AUTH_LINKS_COLLECTION, authUidFor("202300481"))!.traineeId
    ).toBe("202300481")
  })

  it("ignores a client-supplied uid and rejects a mismatched trainee", async () => {
    const db = new FakeFirestore()
    seedTrainee(db, { authUid: undefined })
    db.seed("trainees", "202300999", {
      id: "202300999",
      universityId: "202300999",
      fullName: "Other",
      email: "other@example.com",
      status: "active",
    })
    adminDbRef.current = db

    const response = await POST(
      post({
        idToken: TOKEN,
        universityId: "202300999",
        uid: authUidFor("202300999"),
        traineeId: "202300999",
      })
    )

    expect(response.status).toBe(403)
    expect(db.read("trainees", "202300999")!.authUid).toBeUndefined()
    expect(db.read("trainees", "202300481")!.authUid).toBeUndefined()
  })

  it("rejects an ambiguous duplicate email mapping", async () => {
    const db = new FakeFirestore()
    seedTrainee(db, { authUid: undefined })
    db.seed("trainees", "202300482", {
      id: "202300482",
      universityId: "202300482",
      email: "ahmed@example.com",
      status: "active",
    })
    adminDbRef.current = db

    const response = await POST(post({ idToken: TOKEN }))
    expect(response.status).toBe(409)
  })

  it("rate-limits repeated session creation attempts", async () => {
    adminDbRef.current = new FakeFirestore()
    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "firebase-unlinked",
      email: "unlinked@example.com",
      email_verified: true,
    })

    let lastStatus = 0
    for (let attempt = 0; attempt < 21; attempt += 1) {
      const response = await POST(post({ idToken: "unlinked" }))
      lastStatus = response.status
    }

    expect(lastStatus).toBe(429)
  })
})

describe("GET and DELETE /api/trainees/session", () => {
  it("requires a session cookie", async () => {
    const response = await GET(get())
    expect(response.status).toBe(401)
  })

  it("returns the signed-in trainee from the verified session", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db
    const cookie = sessionCookieFor("202300481")

    const response = await GET(get(cookie))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      trainee: { universityId: "202300481", track: "level_2", pointsTotal: 10 },
      admin: false,
    })
  })

  it("clears a session whose Firebase account is unlinked", async () => {
    adminDbRef.current = new FakeFirestore()
    const cookie = sessionCookieFor("202300481")

    const response = await GET(get(cookie))

    expect(response.status).toBe(403)
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })

  it("rejects a revoked session cookie", async () => {
    adminDbRef.current = new FakeFirestore()
    adminAuthMock.verifySessionCookie.mockRejectedValue(
      Object.assign(new Error("revoked"), { code: "auth/session-cookie-revoked" })
    )

    const response = await GET(get(`${TRAINEE_SESSION_COOKIE}=revoked`))
    expect(response.status).toBe(401)
  })

  it("rejects a cross-site sign-out request", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/trainees/session", {
        method: "DELETE",
        headers: {
          cookie: sessionCookieFor("202300481"),
          origin: "https://evil.example",
        },
      })
    )

    expect(response.status).toBe(403)
    expect(adminAuthMock.revokeRefreshTokens).not.toHaveBeenCalled()
  })

  it("signs out by revoking refresh tokens and expiring the cookie", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/trainees/session", {
        method: "DELETE",
        headers: { cookie: sessionCookieFor("202300481") },
      })
    )

    expect(response.status).toBe(200)
    expect(adminAuthMock.revokeRefreshTokens).toHaveBeenCalledWith(
      authUidFor("202300481")
    )
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })
})
