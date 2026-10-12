import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScoutProfile } from "@/lib/bounty"
import { SCOUT_STORAGE_KEY } from "@/lib/bounty-storage"

vi.mock("@/lib/bounty", () => ({
  registerOrGetScout: vi.fn(),
  getScoutByUniId: vi.fn(),
  getTopScouts: vi.fn(),
}))

import { getScoutByUniId, getTopScouts, registerOrGetScout } from "@/lib/bounty"
import ReferralRewardPage from "@/app/(site)/referrals/page"

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

function mock<T extends (...args: never[]) => unknown>(fn: T) {
  return fn as unknown as ReturnType<typeof vi.fn>
}

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Ahmed Nasser"), {
    target: { value: "Ahmed Nasser" },
  })
  fireEvent.change(screen.getByPlaceholderText("e.g. 202300481"), {
    target: { value: "202300481" },
  })
  fireEvent.submit(screen.getByPlaceholderText("e.g. Ahmed Nasser").closest("form")!)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
  mock(registerOrGetScout).mockResolvedValue({ scout, error: null, isNew: true })
  mock(getScoutByUniId).mockResolvedValue({ scout, error: null })
  mock(getTopScouts).mockResolvedValue([])
})

describe("ReferralRewardPage", () => {
  it("shows the enrollment form with the fallback leaderboard by default", () => {
    render(<ReferralRewardPage />)

    expect(screen.getByRole("button", { name: /GET MY REFERRAL LINK/ })).toBeTruthy()
    expect(screen.getByText("KHALID_ALGO")).toBeTruthy()
    expect(screen.getByText("YOUSSEF_DP")).toBeTruthy()
  })

  it("rejects an empty full name before calling the API", () => {
    render(<ReferralRewardPage />)

    fireEvent.submit(screen.getByPlaceholderText("e.g. Ahmed Nasser").closest("form")!)

    expect(screen.getByText("Please enter your Full Name.")).toBeTruthy()
    expect(registerOrGetScout).not.toHaveBeenCalled()
  })

  it("rejects a missing university ID before calling the API", () => {
    render(<ReferralRewardPage />)

    fireEvent.change(screen.getByPlaceholderText("e.g. Ahmed Nasser"), {
      target: { value: "Ahmed Nasser" },
    })
    fireEvent.submit(screen.getByPlaceholderText("e.g. Ahmed Nasser").closest("form")!)

    expect(screen.getByText("Please enter your University ID.")).toBeTruthy()
    expect(registerOrGetScout).not.toHaveBeenCalled()
  })

  it("enrols a scout, persists the profile and shows the referral dashboard", async () => {
    render(<ReferralRewardPage />)

    await act(async () => {
      fillAndSubmit()
    })

    expect(registerOrGetScout).toHaveBeenCalledWith("Ahmed Nasser", "202300481")
    expect(screen.getByText("Ahmed Nasser")).toBeTruthy()
    expect(screen.getByText("AHMED-0481")).toBeTruthy()
    expect(screen.getByText("http://localhost:3000/join?ref=AHMED-0481")).toBeTruthy()
    expect(screen.getByText("ACTIVE PROFILE")).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem(SCOUT_STORAGE_KEY)!)).toEqual(scout)
  })

  it("surfaces an enrollment failure and stays on the form", async () => {
    mock(registerOrGetScout).mockResolvedValue({ scout: null, error: "Referral service down.", isNew: false })
    render(<ReferralRewardPage />)

    await act(async () => {
      fillAndSubmit()
    })

    expect(screen.getByText("Referral service down.")).toBeTruthy()
    expect(screen.queryByText("ACTIVE PROFILE")).toBeNull()
    expect(window.localStorage.getItem(SCOUT_STORAGE_KEY)).toBeNull()
  })

  it("replaces the fallback leaderboard with live top scouts", async () => {
    mock(getTopScouts).mockResolvedValue([
      { ...scout, full_name: "Mona Ali", recruits_count: 9 },
      { ...scout, id: "scout-2", full_name: "Omar Hassan", recruits_count: 4 },
    ])
    render(<ReferralRewardPage />)

    await waitFor(() => {
      expect(screen.getByText("MONA_ALI")).toBeTruthy()
    })
    expect(screen.getByText("9 PTS")).toBeTruthy()
    expect(screen.getByText("OMAR_HASSAN")).toBeTruthy()
    expect(screen.queryByText("KHALID_ALGO")).toBeNull()
  })

  it("refreshes the live recruit count when the dashboard sync button is used", async () => {
    render(<ReferralRewardPage />)
    await act(async () => {
      fillAndSubmit()
    })

    mock(getScoutByUniId).mockResolvedValue({ scout: { ...scout, recruits_count: 7 }, error: null })
    fireEvent.click(screen.getByRole("button", { name: /REFRESH/ }))

    await waitFor(() => {
      expect(screen.getAllByText("7").length).toBeGreaterThan(0)
    })
    expect(getScoutByUniId).toHaveBeenCalledWith("202300481")
  })

  it("clears the stored profile when switching ID", async () => {
    render(<ReferralRewardPage />)
    await act(async () => {
      fillAndSubmit()
    })

    fireEvent.click(screen.getByRole("button", { name: /SWITCH ID/ }))

    expect(screen.getByRole("button", { name: /GET MY REFERRAL LINK/ })).toBeTruthy()
    expect(window.localStorage.getItem(SCOUT_STORAGE_KEY)).toBeNull()
  })
})
