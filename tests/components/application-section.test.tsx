import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { searchParamsGet } = vi.hoisted(() => ({ searchParamsGet: vi.fn() }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGet }),
}))

import { ApplicationSection } from "@/components/join/application-section"

beforeEach(() => {
  searchParamsGet.mockReturnValue(null)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("ApplicationSection (Wait For It)", () => {
  it("pitches both the training tracks and the live leaderboard", () => {
    render(<ApplicationSection />)

    // Training pitch assertions
    expect(screen.getByText("THE TRAINING MATRIX")).toBeTruthy()
    expect(screen.getByText("TWO ELITE TRACKS")).toBeTruthy()
    expect(screen.getByText(/Level 1 \(Fundamentals\):/)).toBeTruthy()
    expect(screen.getByText(/Level 2 \(Advanced \/ ECPC\):/)).toBeTruthy()

    // Leaderboard pitch assertions
    expect(screen.getByText("THE LEADERBOARD")).toBeTruthy()
    expect(screen.getByText("CLIMB THE RANKS")).toBeTruthy()
    expect(screen.getByText(/Point Audit Engine:/)).toBeTruthy()
    expect(screen.getByText(/ECPC Team Selection:/)).toBeTruthy()

    // Leaderboard preview link
    const previewLink = screen.getByText(/Preview Live Leaderboard/).closest("a")
    expect(previewLink?.getAttribute("href")).toBe("/leaderboard")
  })

  it("surfaces the invited scout badge when the URL carries a referral code", () => {
    searchParamsGet.mockReturnValue("scout-01")
    render(<ApplicationSection />)

    expect(screen.getByText(/INVITED BY SCOUT:/)).toBeTruthy()
    expect(screen.getByText("SCOUT-01")).toBeTruthy()
    expect(screen.getByText("VIP NOTIFICATION")).toBeTruthy()
  })

  it("submits the waitlist form and displays priority confirmation state", async () => {
    searchParamsGet.mockReturnValue("scout-01")
    render(<ApplicationSection />)

    const emailInput = screen.getByLabelText(/Email address for waitlist notification/)
    const uniIdInput = screen.getByLabelText(/University ID \(optional\)/)

    fireEvent.change(emailInput, { target: { value: "cadet@pua.edu.eg" } })
    fireEvent.change(uniIdInput, { target: { value: "202300481" } })

    fireEvent.click(screen.getByRole("button", { name: /JOIN WAITLIST/ }))

    await screen.findByText("YOU'RE FIRST IN LINE!")
    expect(screen.getByText("WAITLIST CONFIRMED // PRIORITY PASS LOCKED")).toBeTruthy()
    expect(screen.getByText("cadet@pua.edu.eg")).toBeTruthy()
    expect(screen.getByText(/SCOUT INVITATION ATTACHED: \[SCOUT-01\]/)).toBeTruthy()

    // Verify localStorage persistence
    const saved = JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
    expect(saved).toHaveLength(1)
    expect(saved[0].email).toBe("cadet@pua.edu.eg")
    expect(saved[0].universityId).toBe("202300481")
    expect(saved[0].referralCode).toBe("SCOUT-01")

    // Check post-submission navigation CTAs
    const leaderboardCta = screen.getByText("VIEW LIVE LEADERBOARD").closest("a")
    expect(leaderboardCta?.getAttribute("href")).toBe("/leaderboard")

    const calendarCta = screen.getByText("EXPLORE TRAINING CALENDAR").closest("a")
    expect(calendarCta?.getAttribute("href")).toBe("/events")
  })
})
