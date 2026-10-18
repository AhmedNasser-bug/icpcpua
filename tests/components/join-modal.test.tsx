import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { JoinModal } from "@/components/home/join-modal"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("JoinModal (Wait For It)", () => {
  it("renders the teaser pitching the training and leaderboard", () => {
    render(<JoinModal onClose={vi.fn()} />)

    expect(screen.getByText("WAIT FOR IT")).toBeTruthy()
    expect(screen.getByText("Season 2026 // Launching Soon")).toBeTruthy()
    expect(screen.getByText("THE TRAINING")).toBeTruthy()
    expect(screen.getByText("THE LEADERBOARD")).toBeTruthy()
  })

  it("submits the waitlist email and renders priority pass confirmation", async () => {
    render(<JoinModal onClose={vi.fn()} />)

    const emailInput = screen.getByLabelText(/Email Address for Priority Access/)
    fireEvent.change(emailInput, { target: { value: "student@pua.edu.eg" } })

    const submitBtn = screen.getByRole("button", { name: /NOTIFY ME WHEN ADMISSIONS OPEN/ })
    fireEvent.click(submitBtn)

    await screen.findByText("YOU'RE ON THE LIST!")
    expect(screen.getByText("PRIORITY PASS LOCKED")).toBeTruthy()
    expect(screen.getByText("student@pua.edu.eg")).toBeTruthy()

    // Verify localStorage persistence
    const saved = JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
    expect(saved).toHaveLength(1)
    expect(saved[0].email).toBe("student@pua.edu.eg")
    expect(saved[0].source).toBe("home_modal")

    // Check action links
    const leaderboardLink = screen.getByText("EXPLORE LEADERBOARD PREVIEW").closest("a")
    expect(leaderboardLink?.getAttribute("href")).toBe("/leaderboard")

    const syllabusLink = screen.getByText("READ TRACK SYLLABUS").closest("a")
    expect(syllabusLink?.getAttribute("href")).toBe("/join")
  })

  it("links to the /join syllabus and /leaderboard pages from the teaser form", () => {
    render(<JoinModal onClose={vi.fn()} />)

    const leaderboardLink = screen.getByText("View Leaderboard").closest("a")
    expect(leaderboardLink?.getAttribute("href")).toBe("/leaderboard")

    const detailsLink = screen.getByText(/Full Syllabus & Details/).closest("a")
    expect(detailsLink?.getAttribute("href")).toBe("/join")
  })

  it("closes on Escape and from the close button control", () => {
    const onClose = vi.fn()
    render(<JoinModal onClose={onClose} />)

    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
