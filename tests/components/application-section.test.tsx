import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { searchParamsGet } = vi.hoisted(() => ({ searchParamsGet: vi.fn() }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGet }),
}))

vi.mock("@/lib/bounty", () => ({
  recordBountyReferral: vi.fn(),
}))

import { ApplicationSection } from "@/components/join/application-section"
import { recordBountyReferral } from "@/lib/bounty"

const bountyMock = vi.mocked(recordBountyReferral)

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Ahmed Khalid"), { target: { value: "Ahmed Khalid" } })
  fireEvent.change(screen.getByPlaceholderText("e.g. 202300481"), { target: { value: "202300481" } })
  fireEvent.change(screen.getByPlaceholderText("you@pua.edu.eg"), { target: { value: "ahmed@example.com" } })
  fireEvent.change(screen.getByPlaceholderText("01012345678"), { target: { value: "01000000000" } })
}

function submitForm() {
  fireEvent.submit(screen.getByPlaceholderText("e.g. Ahmed Khalid").closest("form")!)
}

beforeEach(() => {
  searchParamsGet.mockReturnValue(null)
  bountyMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("ApplicationSection", () => {
  it("shows the attached scout when the URL carries a referral code", () => {
    searchParamsGet.mockReturnValue("scout-01")
    render(<ApplicationSection />)

    expect(screen.getByText(/REFERRED BY SCOUT/)).toBeTruthy()
    expect(screen.getByText("SCOUT-01")).toBeTruthy()
    expect(screen.getByText("BOUNTY ATTACHED")).toBeTruthy()
  })

  it("registers the cadet and credits the scout on success", async () => {
    searchParamsGet.mockReturnValue("scout-01")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, trainee: { pointsTotal: 42 } }))
    )
    bountyMock.mockResolvedValue({ success: true, error: null })
    render(<ApplicationSection />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("YOU'RE IN THE SQUAD!")
    expect(screen.getByText("+42 POINTS AWARDED")).toBeTruthy()
    expect(
      screen.getByText(/SCOUT CREDIT DISPATCHED TO \[SCOUT-01\]/)
    ).toBeTruthy()
    expect(bountyMock).toHaveBeenCalledWith("SCOUT-01", "Ahmed Khalid", "202300481")
  })

  it("does not credit the scout when the API ran in simulated fallback mode", async () => {
    searchParamsGet.mockReturnValue("scout-01")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ success: true, simulated: true, trainee: { pointsTotal: 10 } })
      )
    )
    render(<ApplicationSection />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("YOU'RE IN THE SQUAD!")
    expect(bountyMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/SCOUT CREDIT DISPATCHED/)).toBeNull()
  })

  it("registers without touching the bounty pipeline when no referral is attached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, trainee: { pointsTotal: 10 } }))
    )
    render(<ApplicationSection />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("YOU'RE IN THE SQUAD!")
    expect(bountyMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/SCOUT CREDIT DISPATCHED/)).toBeNull()
  })

  it("still confirms registration when referral logging fails", async () => {
    searchParamsGet.mockReturnValue("scout-01")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, trainee: { pointsTotal: 10 } }))
    )
    bountyMock.mockRejectedValue(new Error("database down"))
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<ApplicationSection />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("YOU'RE IN THE SQUAD!")
    expect(screen.queryByText(/SCOUT CREDIT DISPATCHED/)).toBeNull()
    expect(consoleError).toHaveBeenCalled()
  })

  it("surfaces an API error and keeps the form open", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: false, error: "University ID already registered." }, false))
    )
    render(<ApplicationSection />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("University ID already registered.")
    expect(screen.getByPlaceholderText("e.g. Ahmed Khalid")).toBeTruthy()
    expect(screen.queryByText("YOU'RE IN THE SQUAD!")).toBeNull()
  })
})
