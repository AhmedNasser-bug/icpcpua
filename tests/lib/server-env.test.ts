import { afterEach, describe, expect, it, vi } from "vitest"
import {
  assertRuntimeConfiguration,
  legacyClaimConfiguration,
  traineeSessionMaxAgeSeconds,
  validateServerEnv,
} from "@/lib/server-env"

const PRODUCTION_ENV = {
  NODE_ENV: "production",
  FIREBASE_PROJECT_ID: "pua-training",
  FIREBASE_CLIENT_EMAIL: "firebase-adminsdk@pua-training.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
  NEXT_PUBLIC_FIREBASE_API_KEY: "public-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "pua-training.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "pua-training",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
  CRON_SECRET: "a-long-machine-cron-secret",
  POINTS_EVENT_SECRET: "a-long-points-event-secret",
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("validateServerEnv", () => {
  it("accepts a complete production configuration without TRAINEE_SESSION_SECRET", () => {
    const result = validateServerEnv(PRODUCTION_ENV)

    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it("does not require runtime secrets during development or tests", () => {
    const result = validateServerEnv({ NODE_ENV: "development" })

    expect(result.ok).toBe(true)
  })

  it("reports missing production configuration by variable name only", () => {
    const result = validateServerEnv({ NODE_ENV: "production" })

    expect(result.ok).toBe(false)
    const variables = result.errors.map((issue) => issue.variable)
    expect(variables).toEqual(
      expect.arrayContaining([
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY",
        "CRON_SECRET",
        "POINTS_EVENT_SECRET",
        "NEXT_PUBLIC_FIREBASE_API_KEY",
      ])
    )
    expect(JSON.stringify(result.errors)).not.toContain("BEGIN PRIVATE KEY")
  })

  it("warns that TRAINEE_SESSION_SECRET is obsolete", () => {
    const result = validateServerEnv({
      ...PRODUCTION_ENV,
      TRAINEE_SESSION_SECRET: "legacy-secret-value",
    })

    expect(result.ok).toBe(true)
    expect(result.warnings.map((warning) => warning.variable)).toContain(
      "TRAINEE_SESSION_SECRET"
    )
  })

  it("validates the session lifetime against Firebase limits", () => {
    expect(
      validateServerEnv({
        ...PRODUCTION_ENV,
        TRAINEE_SESSION_MAX_AGE_SECONDS: "100",
      }).ok
    ).toBe(false)
    expect(
      validateServerEnv({
        ...PRODUCTION_ENV,
        TRAINEE_SESSION_MAX_AGE_SECONDS: "9999999",
      }).ok
    ).toBe(false)
    expect(
      validateServerEnv({
        ...PRODUCTION_ENV,
        TRAINEE_SESSION_MAX_AGE_SECONDS: "86400",
      }).ok
    ).toBe(true)
  })

  it("requires a bounded deadline and secret when the legacy claim flow is enabled", () => {
    const missing = validateServerEnv({
      ...PRODUCTION_ENV,
      TRAINEE_LEGACY_CLAIM_ENABLED: "true",
    })
    expect(missing.ok).toBe(false)
    expect(missing.errors.map((error) => error.variable)).toEqual(
      expect.arrayContaining(["TRAINEE_LEGACY_CLAIM_DEADLINE", "TRAINEE_CLAIM_SECRET"])
    )

    const expired = validateServerEnv({
      ...PRODUCTION_ENV,
      TRAINEE_LEGACY_CLAIM_ENABLED: "true",
      TRAINEE_LEGACY_CLAIM_DEADLINE: "2020-01-01T00:00:00.000Z",
      TRAINEE_CLAIM_SECRET: "x".repeat(48),
    })
    expect(expired.ok).toBe(false)
  })

  it("throws only for deployed production runtimes with missing configuration", () => {
    expect(() => assertRuntimeConfiguration({ NODE_ENV: "test" })).not.toThrow()
    expect(() =>
      assertRuntimeConfiguration({ NODE_ENV: "production" })
    ).not.toThrow()
    expect(() =>
      assertRuntimeConfiguration({ NODE_ENV: "production", VERCEL: "1" })
    ).toThrow(/Server configuration is invalid/)
  })
})

describe("traineeSessionMaxAgeSeconds", () => {
  it("defaults to five days and clamps invalid values", () => {
    expect(traineeSessionMaxAgeSeconds({})).toBe(5 * 24 * 60 * 60)
    expect(traineeSessionMaxAgeSeconds({ TRAINEE_SESSION_MAX_AGE_SECONDS: "bad" })).toBe(
      5 * 24 * 60 * 60
    )
    expect(traineeSessionMaxAgeSeconds({ TRAINEE_SESSION_MAX_AGE_SECONDS: "3600" })).toBe(3600)
  })
})

describe("legacyClaimConfiguration", () => {
  it("is disabled by default and past its deadline", () => {
    expect(legacyClaimConfiguration({}).enabled).toBe(false)
    expect(
      legacyClaimConfiguration({
        TRAINEE_LEGACY_CLAIM_ENABLED: "true",
        TRAINEE_LEGACY_CLAIM_DEADLINE: new Date(Date.now() - 1000).toISOString(),
        TRAINEE_CLAIM_SECRET: "x".repeat(48),
      }).enabled
    ).toBe(false)
  })

  it("is enabled only with a future deadline and secret", () => {
    expect(
      legacyClaimConfiguration({
        TRAINEE_LEGACY_CLAIM_ENABLED: "true",
        TRAINEE_LEGACY_CLAIM_DEADLINE: new Date(Date.now() + 60_000).toISOString(),
        TRAINEE_CLAIM_SECRET: "x".repeat(48),
      }).enabled
    ).toBe(true)
  })
})
