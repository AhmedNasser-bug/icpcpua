import { afterEach, describe, expect, it } from "vitest"
import {
  SCOUT_STORAGE_KEY,
  clearStoredScout,
  readStoredScout,
  writeStoredScout,
} from "@/lib/bounty-storage"
import type { ScoutProfile } from "@/lib/bounty"

const scout: ScoutProfile = {
  id: "scout-1",
  full_name: "Ahmed Nasser",
  uni_id: "202300481",
  referral_code: "AHMED-0481",
  recruits_count: 2,
  claimed_tiers: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

afterEach(() => {
  window.localStorage.clear()
})

describe("bounty scout storage", () => {
  it("keeps the published localStorage key stable", () => {
    expect(SCOUT_STORAGE_KEY).toBe("pua_bounty_scout")
  })

  it("returns null when nothing is stored", () => {
    expect(readStoredScout()).toBeNull()
  })

  it("round-trips a scout profile", () => {
    writeStoredScout(scout)

    expect(JSON.parse(window.localStorage.getItem(SCOUT_STORAGE_KEY)!)).toEqual(scout)
    expect(readStoredScout()).toEqual(scout)
  })

  it("drops corrupted entries instead of throwing", () => {
    window.localStorage.setItem(SCOUT_STORAGE_KEY, "{not-json")

    expect(readStoredScout()).toBeNull()
    expect(window.localStorage.getItem(SCOUT_STORAGE_KEY)).toBeNull()
  })

  it("clears the stored scout", () => {
    writeStoredScout(scout)
    clearStoredScout()

    expect(window.localStorage.getItem(SCOUT_STORAGE_KEY)).toBeNull()
    expect(readStoredScout()).toBeNull()
  })
})
