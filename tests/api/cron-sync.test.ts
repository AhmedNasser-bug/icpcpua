import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { adminDbRef, syncBatchMock } = vi.hoisted(() => ({
  adminDbRef: { current: null as unknown },
  syncBatchMock: vi.fn(),
}))

vi.mock("@/lib/firebase-admin", () => ({
  get adminDb() {
    return adminDbRef.current
  },
  FieldValue: { increment: (n: number) => ({ __increment: n }) },
}))

vi.mock("@/lib/codeforces/sync", () => ({
  syncDueCodeforcesAccounts: (...args: unknown[]) => syncBatchMock(...args),
}))

import { GET, POST } from "@/app/api/cron/sync-codeforces/route"

function request(method: string, authorization?: string) {
  return new Request("http://localhost/api/cron/sync-codeforces", {
    method,
    headers: authorization ? { authorization } : {},
  })
}

beforeEach(() => {
  adminDbRef.current = null
  vi.clearAllMocks()
  delete process.env.CRON_SECRET
  delete process.env.CF_SYNC_SECRET
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("/api/cron/sync-codeforces", () => {
  it("rejects a request without the configured bearer secret", async () => {
    const response = await GET(request("GET", "Bearer wrong"))
    expect(response.status).toBe(401)
  })

  it("rejects every request when no secret is configured", async () => {
    const response = await GET(request("GET"))
    expect(response.status).toBe(401)
  })

  it("accepts the CRON_SECRET bearer token", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    adminDbRef.current = {}
    syncBatchMock.mockResolvedValue({
      processed: 2,
      synced: 1,
      failed: 1,
      skipped: 0,
      selected: 2,
      lockContention: 0,
      stoppedBy: "drained",
      remainingDue: 0,
      durationMs: 5000,
    })

    const response = await GET(request("GET", "Bearer s3cret"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      processed: 2,
      synced: 1,
      failed: 1,
      skipped: 0,
      stoppedBy: "drained",
    })
    expect(syncBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeBudgetMs: expect.any(Number) })
    )
  })

  it("also accepts CF_SYNC_SECRET through POST", async () => {
    vi.stubEnv("CF_SYNC_SECRET", "another-secret")
    adminDbRef.current = {}
    syncBatchMock.mockResolvedValue({ processed: 0, synced: 0, failed: 0, skipped: 0 })

    const response = await POST(request("POST", "Bearer another-secret"))
    expect(response.status).toBe(200)
  })

  it("returns the development fallback without a database", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret")

    const response = await GET(request("GET", "Bearer s3cret"))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ success: false, simulated: true })
  })

  it("does not expose internal batch errors", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    adminDbRef.current = {}
    syncBatchMock.mockRejectedValue(new Error("firestore stack trace"))
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET(request("GET", "Bearer s3cret"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      success: false,
      error: "Codeforces synchronization batch failed.",
    })
    expect(consoleError).toHaveBeenCalled()
  })
})
