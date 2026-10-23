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

import { GET as liveness } from "@/app/api/health/route"
import { GET as readiness } from "@/app/api/health/ready/route"
import { FakeFirestore } from "../helpers/fake-firestore"

beforeEach(() => {
  adminDbRef.current = null
})

describe("health endpoints", () => {
  it("reports liveness without dependency details", async () => {
    const response = await liveness()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("reports not ready without Firestore", async () => {
    const response = await readiness()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      status: "not_ready",
      checks: { firestore: "unavailable" },
    })
  })

  it("reports ready when configuration and Firestore are available", async () => {
    adminDbRef.current = new FakeFirestore()

    const response = await readiness()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: "ready",
      checks: { configuration: "ok", firestore: "ok" },
    })
  })
})
