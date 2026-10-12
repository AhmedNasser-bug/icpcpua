import type { ScoutProfile } from "./bounty"

/** localStorage key holding the enrolled scout profile. */
export const SCOUT_STORAGE_KEY = "pua_bounty_scout"

export function readStoredScout(): ScoutProfile | null {
  if (typeof window === "undefined") return null

  const cached = window.localStorage.getItem(SCOUT_STORAGE_KEY)
  if (!cached) return null

  try {
    return JSON.parse(cached) as ScoutProfile
  } catch {
    window.localStorage.removeItem(SCOUT_STORAGE_KEY)
    return null
  }
}

export function writeStoredScout(scout: ScoutProfile) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SCOUT_STORAGE_KEY, JSON.stringify(scout))
}

export function clearStoredScout() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(SCOUT_STORAGE_KEY)
}
