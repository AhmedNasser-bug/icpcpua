import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

import { POST as adminSync } from "@/app/api/admin/codeforces/sync/route"
import {
  GET as adminReconcile,
  POST as adminReconcilePost,
} from "@/app/api/admin/codeforces/reconcile/route"
import { GET as adminSyncRuns } from "@/app/api/admin/sync-runs/route"
import { POST as createClaimCode } from "@/app/api/admin/trainees/claim-code/route"
import { POST as claimAccount } from "@/app/api/trainees/claim/route"
import {
  authUidFor,
  resetAdminAuthMock,
  sessionCookieFor,
} from "../helpers/auth"
import { FakeFirestore } from "../helpers/fake-firestore"

function adminCookie(id = "202300001") {
  return sessionCookieFor(id, { admin: true })
}

function trainee(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    universityId: id,
    authUid: authUidFor(id),
    fullName: `Cadet ${id}`,
    email: `${id}@example.com`,
    phone: "01000000000",
    status: "active",
    track: "level_1",
    academicYear: "Year 2",
    pointsTotal: 100,
    codeforcesHandle: "tourist",
    codeforcesHandleLower: "tourist",
    cfHandleVerified: true,
    cfRating: 2400,
    cfMaxRating: 2500,
    cfSolvedCount: 2,
    cfSolvedProblemKeys: ["1:A"],
    cfLastSubmissionId: 10,
    cfLastSyncedAt: "2026-01-01T00:00:00.000Z",
    cfSyncAttemptedAt: null,
    cfSyncStatus: "success",
    cfSyncError: null,
    cfNextSyncAt: null,
    ...overrides,
  }
}

function request(path: string, options: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new Request(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  resetAdminAuthMock()
  delete process.env.TRAINEE_LEGACY_CLAIM_ENABLED
  delete process.env.TRAINEE_LEGACY_CLAIM_DEADLINE
  delete process.env.TRAINEE_CLAIM_SECRET
  infoMock.mockResolvedValue({
    handle: "tourist",
    rating: 2450,
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

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("administrative authorization", () => {
  it("returns 401 without a session", async () => {
    adminDbRef.current = new FakeFirestore()
    expect((await adminSyncRuns(request("/api/admin/sync-runs"))).status).toBe(401)
  })

  it("returns 403 for a non-admin trainee on every admin route", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    const cookie = sessionCookieFor("202300001")

    expect(
      (await adminSyncRuns(request("/api/admin/sync-runs", { cookie }))).status
    ).toBe(403)
    expect(
      (await adminReconcile(request("/api/admin/codeforces/reconcile", { cookie }))).status
    ).toBe(403)
    expect(
      (
        await adminSync(
          request("/api/admin/codeforces/sync", {
            method: "POST",
            cookie,
            body: { traineeId: "202300001" },
          })
        )
      ).status
    ).toBe(403)
    expect(
      (
        await createClaimCode(
          request("/api/admin/trainees/claim-code", {
            method: "POST",
            cookie,
            body: { traineeId: "202300001" },
          })
        )
      ).status
    ).toBe(403)
  })

  it("does not accept a cron bearer secret as administrator authentication", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db
    vi.stubEnv("CRON_SECRET", "machine-only-secret")

    const response = await adminSyncRuns(
      new Request("http://localhost/api/admin/sync-runs", {
        headers: { authorization: "Bearer machine-only-secret" },
      })
    )
    expect(response.status).toBe(401)
  })

  it("allows an admin to read the sync-run summary", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    db.seed("sync_runs", "run-1", {
      trigger: "cron",
      traineeId: "202300002",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:10.000Z",
      status: "failed",
      errorCode: "codeforces_unavailable",
      dataChanged: null,
      durationMs: 10_000,
      jobId: "job-1",
      summary: "unavailable",
    })
    adminDbRef.current = db

    const response = await adminSyncRuns(
      request("/api/admin/sync-runs", { cookie: adminCookie() })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary).toMatchObject({
      total: 1,
      byStatus: { failed: 1 },
      byErrorCode: { codeforces_unavailable: 1 },
      averageDurationMs: 10_000,
    })
  })

  it("allows an admin to trigger synchronization and records an audit event", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001"))
    adminDbRef.current = db

    const response = await adminSync(
      request("/api/admin/codeforces/sync", {
        method: "POST",
        cookie: adminCookie(),
        body: { traineeId: "202300001" },
      })
    )
    const body = await response.json()
    const audit = await db.collection("admin_audit").get()

    expect(response.status).toBe(200)
    expect(body.sync).toMatchObject({ ok: true })
    expect(audit.docs[0]!.data()).toMatchObject({
      type: "admin.codeforces_sync",
      actorUid: authUidFor("202300001"),
      targetId: "202300001",
    })
  })
})

describe("reconciliation and repair", () => {
  it("reports duplicates, missing registry entries and orphaned entries", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "Tourist" }))
    db.seed("trainees", "202300002", trainee("202300002", { codeforcesHandle: "tourist" }))
    db.seed("trainees", "202300003", trainee("202300003", { codeforcesHandle: "orphan_handle" }))
    db.seed("codeforces_links", "tourist", {
      universityId: "202300001",
      handle: "Tourist",
    })
    db.seed("codeforces_links", "gone", {
      universityId: "202399999",
      handle: "gone",
    })
    adminDbRef.current = db

    const response = await adminReconcile(
      request("/api/admin/codeforces/reconcile", { cookie: adminCookie() })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.report.counts.duplicate_handle).toBeGreaterThanOrEqual(1)
    expect(body.report.counts.missing_registry).toBeGreaterThanOrEqual(1)
    expect(body.report.counts.orphaned_registry).toBeGreaterThanOrEqual(1)
  })

  it("requires an explicit non-dry-run repair and refuses conflicting ownership", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "tourist" }))
    db.seed("codeforces_links", "tourist", {
      universityId: "202300999",
      handle: "tourist",
    })
    adminDbRef.current = db

    const dryRun = await adminReconcilePost(
      request("/api/admin/codeforces/reconcile", {
        method: "POST",
        cookie: adminCookie(),
        body: {},
      })
    )
    expect(dryRun.status).toBe(200)
    expect((await dryRun.json()).dryRun).toBe(true)

    const repair = await adminReconcilePost(
      request("/api/admin/codeforces/reconcile", {
        method: "POST",
        cookie: adminCookie(),
        body: { dryRun: false, action: "repair_missing_registry", traineeId: "202300001" },
      })
    )
    expect(repair.status).toBe(409)
    expect(db.read("codeforces_links", "tourist")!.universityId).toBe("202300999")
  })

  it("repairs an unambiguous missing registry entry idempotently", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "202300001", trainee("202300001", { codeforcesHandle: "tourist" }))
    db.seed(
      "trainees",
      "202300002",
      trainee("202300002", {
        codeforcesHandle: "other",
        codeforcesHandleLower: "other",
      })
    )
    adminDbRef.current = db

    const first = await adminReconcilePost(
      request("/api/admin/codeforces/reconcile", {
        method: "POST",
        cookie: adminCookie(),
        body: { dryRun: false, action: "repair_missing_registry", traineeId: "202300001" },
      })
    )
    const second = await adminReconcilePost(
      request("/api/admin/codeforces/reconcile", {
        method: "POST",
        cookie: adminCookie(),
        body: { dryRun: false, action: "repair_missing_registry", traineeId: "202300001" },
      })
    )

    expect(first.status).toBe(200)
    expect((await first.json()).repair).toMatchObject({ repaired: true })
    expect(second.status).toBe(200)
    expect((await second.json()).repair).toMatchObject({ repaired: false })
    expect(db.read("codeforces_links", "tourist")!.universityId).toBe("202300001")
  })
})

describe("legacy claim flow", () => {
  function enableClaimFlow(deadline = Date.now() + 60 * 60 * 1000) {
    vi.stubEnv("TRAINEE_LEGACY_CLAIM_ENABLED", "true")
    vi.stubEnv("TRAINEE_LEGACY_CLAIM_DEADLINE", new Date(deadline).toISOString())
    vi.stubEnv("TRAINEE_CLAIM_SECRET", "x".repeat(48))
  }

  it("is disabled by default and after the configured deadline", async () => {
    const db = new FakeFirestore()
    db.seed("trainees", "admin-100", trainee("admin-100"))
    db.seed("trainees", "202300001", trainee("202300001", { authUid: undefined }))
    adminDbRef.current = db

    const disabled = await createClaimCode(
      request("/api/admin/trainees/claim-code", {
        method: "POST",
        cookie: adminCookie("admin-100"),
        body: { traineeId: "202300001" },
      })
    )
    expect(disabled.status).toBe(404)

    enableClaimFlow(Date.now() - 1000)
    const expired = await createClaimCode(
      request("/api/admin/trainees/claim-code", {
        method: "POST",
        cookie: adminCookie("admin-100"),
        body: { traineeId: "202300001" },
      })
    )
    expect(expired.status).toBe(404)

    const closed = await claimAccount(
      request("/api/trainees/claim", {
        method: "POST",
        body: {
          idToken: "claim-token",
          universityId: "202300001",
          claimCode: "anything",
        },
      })
    )
    expect(closed.status).toBe(410)
  })

  it("issues a one-time code and completes the claim exactly once", async () => {
    enableClaimFlow()
    const db = new FakeFirestore()
    db.seed("trainees", "admin-100", trainee("admin-100"))
    db.seed("trainees", "202300001", trainee("202300001", { authUid: undefined }))
    adminDbRef.current = db
    const { adminAuthMock } = await import("../helpers/auth")
    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "claim-token",
      email: "202300001@example.com",
      email_verified: true,
    })

    const codeResponse = await createClaimCode(
      request("/api/admin/trainees/claim-code", {
        method: "POST",
        cookie: adminCookie("admin-100"),
        body: { traineeId: "202300001" },
      })
    )
    const codeBody = await codeResponse.json()
    expect(codeResponse.status).toBe(200)
    expect(typeof codeBody.claimCode).toBe("string")

    const claimResponse = await claimAccount(
      request("/api/trainees/claim", {
        method: "POST",
        body: {
          idToken: "claim-token",
          universityId: "202300001",
          claimCode: codeBody.claimCode,
        },
      })
    )

    expect(claimResponse.status).toBe(200)
    expect(claimResponse.headers.get("set-cookie")).toContain("session%3Aclaim-token")
    expect(db.read("trainees", "202300001")!.authUid).toBe("claim-token")
    expect(db.read("trainees", "202300001")!.authClaimCodeHash).toBeNull()

    const replay = await claimAccount(
      request("/api/trainees/claim", {
        method: "POST",
        body: {
          idToken: "claim-token",
          universityId: "202300001",
          claimCode: codeBody.claimCode,
        },
      })
    )
    expect(replay.status).toBe(409)
  })

  it("rejects an invalid claim code and an email mismatch", async () => {
    enableClaimFlow()
    const db = new FakeFirestore()
    db.seed("trainees", "admin-100", trainee("admin-100"))
    db.seed("trainees", "202300001", trainee("202300001", { authUid: undefined }))
    adminDbRef.current = db
    const { adminAuthMock } = await import("../helpers/auth")
    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "claim-token",
      email: "202300001@example.com",
      email_verified: true,
    })

    const codeResponse = await createClaimCode(
      request("/api/admin/trainees/claim-code", {
        method: "POST",
        cookie: adminCookie("admin-100"),
        body: { traineeId: "202300001" },
      })
    )
    const { claimCode } = await codeResponse.json()

    const wrongCode = await claimAccount(
      request("/api/trainees/claim", {
        method: "POST",
        body: {
          idToken: "claim-token",
          universityId: "202300001",
          claimCode: `${claimCode}x`,
        },
      })
    )
    expect(wrongCode.status).toBe(403)

    adminAuthMock.verifyIdToken.mockResolvedValue({
      uid: "claim-token",
      email: "other@example.com",
      email_verified: true,
    })

    const wrongEmail = await claimAccount(
      request("/api/trainees/claim", {
        method: "POST",
        body: {
          idToken: "claim-token",
          universityId: "202300001",
          claimCode,
        },
      })
    )
    expect(wrongEmail.status).toBe(403)
  })
})
