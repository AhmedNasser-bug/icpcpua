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

import {
  TRAINEE_AUTH_LINKS_COLLECTION,
  TRAINEE_AUTH_REVERSE_COLLECTION,
  TRAINEE_SESSION_COOKIE,
  buildClearTraineeSessionCookie,
  buildTraineeSessionCookie,
  endTraineeSession,
  linkTraineeAuthUid,
  readTraineeSessionCookie,
  verifyFirebaseIdToken,
  verifyTraineeSession,
} from "@/lib/trainee-session"
import {
  adminAuthMock,
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
  useSessionClaims,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

function requestWithCookie(value: string) {
  return new Request("http://localhost/api/test", {
    headers: { cookie: value },
  })
}

function seedTrainee(db: FakeFirestore, universityId = "202300481") {
  db.seed("trainees", universityId, {
    id: universityId,
    universityId,
    fullName: "Ahmed Nasser",
    email: "ahmed@example.com",
    authUid: authUidFor(universityId),
    status: "active",
    track: "level_1",
    pointsTotal: 10,
  })
}

beforeEach(() => {
  adminDbRef.current = null
  resetAdminAuthMock()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("Firebase session cookies", () => {
  it("reads the session cookie among unrelated cookies", () => {
    expect(
      readTraineeSessionCookie(
        requestWithCookie(`theme=dark; ${TRAINEE_SESSION_COOKIE}=abc.def; lang=en`)
      )
    ).toBe("abc.def")
  })

  it("rejects missing and malformed cookies", () => {
    expect(readTraineeSessionCookie(requestWithCookie("other=1"))).toBeNull()
    expect(readTraineeSessionCookie(requestWithCookie(`${TRAINEE_SESSION_COOKIE}=`))).toBeNull()
    expect(readTraineeSessionCookie(new Request("http://localhost/api/test"))).toBeNull()
  })

  it("sets a bounded, http-only cookie and Secure in production", () => {
    const dev = buildTraineeSessionCookie("firebase-cookie", 3600)
    expect(dev).toContain("HttpOnly")
    expect(dev).toContain("SameSite=Lax")
    expect(dev).toContain("Path=/")
    expect(dev).toContain("Max-Age=3600")
    expect(dev).not.toContain("Secure")

    vi.stubEnv("NODE_ENV", "production")
    const production = buildTraineeSessionCookie("firebase-cookie", 3600)
    expect(production).toContain("Secure")
  })

  it("clears the cookie with Max-Age=0", () => {
    const cookie = buildClearTraineeSessionCookie()
    expect(cookie).toContain("Max-Age=0")
    expect(cookie).toContain("HttpOnly")
  })
})

describe("verifyTraineeSession", () => {
  it("returns unauthenticated when the cookie is missing", async () => {
    const result = await verifyTraineeSession(new Request("http://localhost/api/test"))
    expect(result).toEqual({ status: "unauthenticated", reason: "missing_session" })
  })

  it("verifies revocation checking and resolves the linked trainee", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db

    const result = await verifyTraineeSession(
      requestWithCookie(sessionCookieFor("202300481"))
    )

    expect(adminAuthMock.verifySessionCookie).toHaveBeenCalledWith(
      authUidFor("202300481"),
      true
    )
    expect(result).toMatchObject({
      status: "authenticated",
      uid: authUidFor("202300481"),
      traineeId: "202300481",
      admin: false,
    })
  })

  it("marks an admin claim as administrator", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db
    useSessionClaims({ uid: authUidFor("202300481"), admin: true })

    const result = await verifyTraineeSession(
      requestWithCookie(sessionCookieFor("202300481"))
    )

    expect(result).toMatchObject({ status: "authenticated", admin: true })
  })

  it("rejects invalid, expired and revoked cookies", async () => {
    adminDbRef.current = new FakeFirestore()
    adminAuthMock.verifySessionCookie.mockRejectedValueOnce(
      Object.assign(new Error("bad"), { code: "auth/invalid-session-cookie" })
    )
    expect(
      await verifyTraineeSession(requestWithCookie(`${TRAINEE_SESSION_COOKIE}=bad`))
    ).toMatchObject({ status: "unauthenticated", reason: "invalid_session" })

    adminAuthMock.verifySessionCookie.mockRejectedValueOnce(
      Object.assign(new Error("revoked"), { code: "auth/session-cookie-revoked" })
    )
    expect(
      await verifyTraineeSession(requestWithCookie(`${TRAINEE_SESSION_COOKIE}=revoked`))
    ).toMatchObject({ status: "unauthenticated", reason: "revoked_session" })

    adminAuthMock.verifySessionCookie.mockRejectedValueOnce(
      Object.assign(new Error("expired"), { code: "auth/session-cookie-expired" })
    )
    expect(
      await verifyTraineeSession(requestWithCookie(`${TRAINEE_SESSION_COOKIE}=expired`))
    ).toMatchObject({ status: "unauthenticated", reason: "invalid_session" })
  })

  it("rejects a verified session with no linked trainee", async () => {
    adminDbRef.current = new FakeFirestore()
    const result = await verifyTraineeSession(
      requestWithCookie(sessionCookieFor("202300999"))
    )
    expect(result).toEqual({ status: "unauthenticated", reason: "unlinked_account" })
  })

  it("rejects an ambiguous UID mapping", async () => {
    const db = new FakeFirestore()
    const uid = authUidFor("202300481")
    db.seed("trainees", "202300481", {
      id: "202300481",
      authUid: uid,
      status: "active",
    })
    db.seed("trainees", "202300482", {
      id: "202300482",
      authUid: uid,
      status: "active",
    })
    adminDbRef.current = db

    const result = await verifyTraineeSession(
      requestWithCookie(`${TRAINEE_SESSION_COOKIE}=${uid}`)
    )
    expect(result).toEqual({ status: "unauthenticated", reason: "conflicting_link" })
  })

  it("rejects a trainee document whose authUid no longer matches the registry", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300481", {
      id: "202300481",
      authUid: authUidFor("202300482"),
      status: "active",
    })
    db.seed(TRAINEE_AUTH_LINKS_COLLECTION, authUidFor("202300481"), {
      traineeId: "202300481",
      uid: authUidFor("202300481"),
    })
    adminDbRef.current = db

    const result = await verifyTraineeSession(
      requestWithCookie(sessionCookieFor("202300481"))
    )
    expect(result).toEqual({ status: "unauthenticated", reason: "conflicting_link" })
  })
})

describe("linkTraineeAuthUid", () => {
  it("links once and makes retries idempotent", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db
    const uid = authUidFor("202300481")

    await linkTraineeAuthUid({
      traineeId: "202300481",
      uid,
      email: "ahmed@example.com",
      expectedEmail: "ahmed@example.com",
    })
    await linkTraineeAuthUid({
      traineeId: "202300481",
      uid,
      email: "ahmed@example.com",
      expectedEmail: "ahmed@example.com",
    })

    expect(db.read("trainees", "202300481")!.authUid).toBe(uid)
    expect(db.read(TRAINEE_AUTH_LINKS_COLLECTION, uid)!.traineeId).toBe("202300481")
  })

  it("rejects a UID already linked to another trainee", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    seedTrainee(db, "202300482")
    db.seed(TRAINEE_AUTH_LINKS_COLLECTION, authUidFor("202300481"), {
      traineeId: "202300481",
      uid: authUidFor("202300481"),
    })
    adminDbRef.current = db

    await expect(
      linkTraineeAuthUid({
        traineeId: "202300482",
        uid: authUidFor("202300481"),
        email: "ahmed@example.com",
      })
    ).rejects.toMatchObject({ code: "conflicting_link" })
    expect(db.read("trainees", "202300482")!.authUid).toBe(authUidFor("202300482"))
  })

  it("rejects a trainee already linked to another UID", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db

    await expect(
      linkTraineeAuthUid({
        traineeId: "202300481",
        uid: "another-uid",
        email: "ahmed@example.com",
      })
    ).rejects.toMatchObject({ code: "conflicting_link" })
  })

  it("rejects a trainee that already has a different reverse UID mapping", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    db.seed(TRAINEE_AUTH_REVERSE_COLLECTION, "202300481", {
      traineeId: "202300481",
      uid: "previous-uid",
    })
    adminDbRef.current = db

    await expect(
      linkTraineeAuthUid({
        traineeId: "202300481",
        uid: "new-uid",
        email: "ahmed@example.com",
      })
    ).rejects.toMatchObject({ code: "conflicting_link" })
  })

  it("requires the verified email to match when expected", async () => {
    const db = new FakeFirestore()
    seedTrainee(db)
    adminDbRef.current = db

    await expect(
      linkTraineeAuthUid({
        traineeId: "202300481",
        uid: authUidFor("202300481"),
        email: "other@example.com",
        expectedEmail: "other@example.com",
      })
    ).rejects.toMatchObject({ code: "invalid_claim" })
  })
})

describe("Firebase ID token verification", () => {
  it("rejects a disabled Firebase user", async () => {
    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "disabled",
      email: "disabled@example.com",
      email_verified: true,
    })
    adminAuthMock.getUser.mockResolvedValue({ uid: "disabled", disabled: true })

    await expect(verifyFirebaseIdToken("token")).rejects.toMatchObject({
      code: "disabled_user",
    })
  })

  it("rejects an expired ID token", async () => {
    adminAuthMock.verifyIdToken.mockRejectedValue(
      Object.assign(new Error("expired"), { code: "auth/id-token-expired" })
    )

    await expect(verifyFirebaseIdToken("token")).rejects.toMatchObject({
      code: "expired_token",
    })
  })
})

describe("endTraineeSession", () => {
  it("revokes refresh tokens and tolerates invalid cookies", async () => {
    await endTraineeSession(requestWithCookie(sessionCookieFor("202300481")))
    expect(adminAuthMock.verifySessionCookie).toHaveBeenCalledWith(
      authUidFor("202300481"),
      false
    )
    expect(adminAuthMock.revokeRefreshTokens).toHaveBeenCalledWith(
      authUidFor("202300481")
    )

    adminAuthMock.verifySessionCookie.mockRejectedValueOnce(new Error("expired"))
    await expect(
      endTraineeSession(requestWithCookie(`${TRAINEE_SESSION_COOKIE}=expired`))
    ).resolves.toBeUndefined()
  })
})
