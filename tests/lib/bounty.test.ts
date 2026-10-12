import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScoutProfile } from "@/lib/bounty"

const { supabaseMock, tableQueues, insertedRows, builders } = vi.hoisted(() => {
  const tableQueues = new Map<string, Array<{ data?: unknown; error?: { message: string } | null }>>()
  const insertedRows: Array<{ table: string; payload: unknown }> = []
  const builders: Array<{ table: string; update: ReturnType<typeof vi.fn> }> = []

  function nextResult(table: string) {
    const queue = tableQueues.get(table)
    if (!queue || queue.length === 0) return { data: null, error: null }
    return queue.shift()!
  }

  const supabaseMock = {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {}
      const terminal = () => Promise.resolve(nextResult(table))

      builder.select = vi.fn(() => builder)
      builder.eq = vi.fn(() => builder)
      builder.order = vi.fn(() => builder)
      builder.limit = vi.fn(() => builder)
      builder.maybeSingle = vi.fn(terminal)
      builder.single = vi.fn(terminal)
      builder.then = (onFulfilled: (value: unknown) => unknown) => terminal().then(onFulfilled)
      builder.insert = vi.fn((payload: unknown) => {
        insertedRows.push({ table, payload })
        return builder
      })
      builder.update = vi.fn(() => builder)

      builders.push({ table, update: builder.update as ReturnType<typeof vi.fn> })
      return builder
    }),
  }

  return { supabaseMock, tableQueues, insertedRows, builders }
})

vi.mock("@/lib/supabase", () => ({ supabase: supabaseMock }))

import {
  generateReferralCode,
  getScoutByUniId,
  getTopScouts,
  recordBountyReferral,
  registerOrGetScout,
} from "@/lib/bounty"

const scout: ScoutProfile = {
  id: "scout-1",
  full_name: "Ahmed Nasser",
  uni_id: "202300481",
  referral_code: "AHMED-0481",
  recruits_count: 0,
  claimed_tiers: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

beforeEach(() => {
  tableQueues.clear()
  insertedRows.length = 0
  builders.length = 0
  vi.clearAllMocks()
})

describe("generateReferralCode", () => {
  it("combines the first name and the last four characters of the university ID", () => {
    expect(generateReferralCode("Ahmed Nasser", "202300481")).toBe("AHMED-0481")
  })

  it("strips punctuation and whitespace, uppercases both parts, then truncates", () => {
    expect(generateReferralCode("  mohamed-amin  ", "pua-2023-00481")).toBe("MOHAMEDA-0481")
  })

  it("truncates the name prefix to eight characters", () => {
    expect(generateReferralCode("Alexandrian Student", "12345678")).toBe("ALEXANDR-5678")
  })

  it("falls back to the SCOUT prefix when the name has no usable characters", () => {
    expect(generateReferralCode("!!!", "12345678")).toBe("SCOUT-5678")
  })

  it("generates a four-digit suffix when the university ID has no usable characters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    expect(generateReferralCode("Ahmed", "!!!")).toBe("AHMED-5500")
    vi.restoreAllMocks()
  })
})

describe("registerOrGetScout", () => {
  it("rejects a name shorter than two characters without hitting the database", async () => {
    const result = await registerOrGetScout(" A ", "202300481")
    expect(result).toEqual({ scout: null, error: "Please provide a valid full name.", isNew: false })
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("rejects a university ID shorter than three characters without hitting the database", async () => {
    const result = await registerOrGetScout("Ahmed Nasser", " 12 ")
    expect(result).toEqual({ scout: null, error: "Please provide a valid University ID.", isNew: false })
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("returns an existing scout without creating a new profile", async () => {
    tableQueues.set("bounty_scouts", [{ data: scout, error: null }])

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result.scout).toEqual(scout)
    expect(result.isNew).toBe(false)
    expect(result.error).toBeNull()
    expect(insertedRows).toHaveLength(0)
  })

  it("updates the stored name when an existing scout returns with a different one", async () => {
    tableQueues.set("bounty_scouts", [{ data: { ...scout }, error: null }])

    const result = await registerOrGetScout("Ahmed Updated", "202300481")

    expect(result.scout?.full_name).toBe("Ahmed Updated")
    expect(result.isNew).toBe(false)
    expect(builders.some((b) => b.table === "bounty_scouts" && b.update.mock.calls.length > 0)).toBe(true)
    expect(insertedRows).toHaveLength(0)
  })

  it("surfaces a lookup failure", async () => {
    tableQueues.set("bounty_scouts", [{ data: null, error: { message: "connection reset" } }])

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result).toEqual({ scout: null, error: "connection reset", isNew: false })
  })

  it("creates a new scout with a generated referral code", async () => {
    const created = { ...scout, id: "scout-new" }
    tableQueues.set("bounty_scouts", [
      { data: null, error: null },
      { data: null, error: null },
      { data: created, error: null },
    ])

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result.isNew).toBe(true)
    expect(result.error).toBeNull()
    expect(result.scout).toEqual(created)
    expect(insertedRows).toEqual([
      {
        table: "bounty_scouts",
        payload: [
          expect.objectContaining({
            full_name: "Ahmed Nasser",
            uni_id: "202300481",
            referral_code: "AHMED-0481",
            recruits_count: 0,
            claimed_tiers: [],
          }),
        ],
      },
    ])
  })

  it("disambiguates a referral code that already exists", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const created = { ...scout, id: "scout-new", referral_code: "AHMED-0481-55" }
    tableQueues.set("bounty_scouts", [
      { data: null, error: null },
      { data: { id: "scout-other" }, error: null },
      { data: created, error: null },
    ])

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result.isNew).toBe(true)
    const payload = insertedRows[0].payload as Array<{ referral_code: string }>
    expect(payload[0].referral_code).toBe("AHMED-0481-55")
    vi.restoreAllMocks()
  })

  it("surfaces an insert failure", async () => {
    tableQueues.set("bounty_scouts", [
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: { message: "duplicate key value" } },
    ])

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result).toEqual({ scout: null, error: "duplicate key value", isNew: false })
  })

  it("returns the thrown error message for unexpected failures", async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw new Error("supabase offline")
    })

    const result = await registerOrGetScout("Ahmed Nasser", "202300481")

    expect(result).toEqual({ scout: null, error: "supabase offline", isNew: false })
  })
})

describe("getScoutByUniId", () => {
  it("returns the scout for a known university ID", async () => {
    tableQueues.set("bounty_scouts", [{ data: scout, error: null }])

    await expect(getScoutByUniId("202300481")).resolves.toEqual({ scout, error: null })
  })

  it("surfaces a query error", async () => {
    tableQueues.set("bounty_scouts", [{ data: null, error: { message: "row level security" } }])

    await expect(getScoutByUniId("202300481")).resolves.toEqual({
      scout: null,
      error: "row level security",
    })
  })

  it("returns the thrown error message for unexpected failures", async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw new Error("network down")
    })

    await expect(getScoutByUniId("202300481")).resolves.toEqual({ scout: null, error: "network down" })
  })
})

describe("recordBountyReferral", () => {
  it("records a referral for an existing code", async () => {
    tableQueues.set("bounty_scouts", [{ data: { id: scout.id, recruits_count: 0 }, error: null }])
    tableQueues.set("bounty_referrals", [{ error: null }])

    const result = await recordBountyReferral(" ahmed-0481 ", "Mona Ali", "202300999")

    expect(result).toEqual({ success: true, error: null })
    expect(insertedRows).toEqual([
      {
        table: "bounty_referrals",
        payload: [
          {
            scout_id: scout.id,
            referred_name: "Mona Ali",
            referred_uni_id: "202300999",
          },
        ],
      },
    ])
  })

  it("stores a null university ID when one is not provided", async () => {
    tableQueues.set("bounty_scouts", [{ data: { id: scout.id, recruits_count: 0 }, error: null }])
    tableQueues.set("bounty_referrals", [{ error: null }])

    await recordBountyReferral("AHMED-0481", "Mona Ali")

    const payload = insertedRows[0].payload as Array<{ referred_uni_id: string | null }>
    expect(payload[0].referred_uni_id).toBeNull()
  })

  it("rejects an unknown referral code", async () => {
    tableQueues.set("bounty_scouts", [{ data: null, error: null }])

    await expect(recordBountyReferral("NOPE-0000", "Mona Ali")).resolves.toEqual({
      success: false,
      error: "Referral code not found.",
    })
    expect(insertedRows).toHaveLength(0)
  })

  it("reports an unknown code when the lookup fails", async () => {
    tableQueues.set("bounty_scouts", [{ data: null, error: { message: "timeout" } }])

    await expect(recordBountyReferral("AHMED-0481", "Mona Ali")).resolves.toEqual({
      success: false,
      error: "Referral code not found.",
    })
  })

  it("treats a duplicate referral as already credited", async () => {
    tableQueues.set("bounty_scouts", [{ data: { id: scout.id, recruits_count: 1 }, error: null }])
    tableQueues.set("bounty_referrals", [{ data: { id: "referral-1" }, error: null }])

    await expect(recordBountyReferral("AHMED-0481", "Mona Ali", " 202300999 ")).resolves.toEqual({
      success: true,
      error: null,
    })
    expect(insertedRows).toHaveLength(0)
  })

  it("surfaces an insert failure", async () => {
    tableQueues.set("bounty_scouts", [{ data: { id: scout.id, recruits_count: 0 }, error: null }])
    tableQueues.set("bounty_referrals", [{ error: { message: "foreign key violation" } }])

    await expect(recordBountyReferral("AHMED-0481", "Mona Ali")).resolves.toEqual({
      success: false,
      error: "foreign key violation",
    })
  })

  it("returns the thrown error message for unexpected failures", async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw new Error("socket hang up")
    })

    await expect(recordBountyReferral("AHMED-0481", "Mona Ali")).resolves.toEqual({
      success: false,
      error: "socket hang up",
    })
  })
})

describe("getTopScouts", () => {
  it("returns the scouts ordered by recruit count", async () => {
    const top = [scout, { ...scout, id: "scout-2" }]
    tableQueues.set("bounty_scouts", [{ data: top, error: null }])

    await expect(getTopScouts()).resolves.toEqual(top)
  })

  it("returns an empty list when the query fails", async () => {
    tableQueues.set("bounty_scouts", [{ data: null, error: { message: "boom" } }])

    await expect(getTopScouts()).resolves.toEqual([])
  })

  it("returns an empty list when the request throws", async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw new Error("offline")
    })

    await expect(getTopScouts()).resolves.toEqual([])
  })
})
