import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import LeaderboardPage from "@/app/(site)/leaderboard/page"

const coders = [
  { rank: 1, handle: "@algo", fullName: "Nourhan Ezzat", rating: 2100, solved: 540, pointsTotal: 1240, track: "level_2", initials: "NE", color: "#FFD500" },
  { rank: 2, handle: "@byte", fullName: "Karim Mostafa", rating: 1850, solved: 487, pointsTotal: 1050, track: "level_2", initials: "KM", color: "#E0E0E0" },
  { rank: 3, handle: "@dp", fullName: "Youssef Tarek", rating: 1795, solved: 412, pointsTotal: 960, track: "level_1", initials: "YT", color: "#FF0055" },
  { rank: 4, handle: "@graph", fullName: "Salma Hany", rating: 1650, solved: 389, pointsTotal: 840, track: "level_1", initials: "SH", color: "#00E5FF", attendedSessionsCount: 2, qrScansCount: 1 },
  { rank: 5, handle: "@greedy", fullName: "Omar Sherif", rating: 1540, solved: 345, pointsTotal: 720, track: "level_1", initials: "OS", color: "#7B2CBF" },
]

function fetchMock() {
  return globalThis.fetch as unknown as ReturnType<typeof vi.fn>
}

function stubLeaderboard(leaderboard: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ json: async () => ({ success: true, leaderboard }) })
  )
}

async function renderLoaded() {
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(<LeaderboardPage />)
  })
  return result
}

beforeEach(() => {
  stubLeaderboard(coders)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("LeaderboardPage", () => {
  it("requests the leaderboard on mount", async () => {
    await renderLoaded()

    expect(fetchMock()).toHaveBeenCalledWith("/api/leaderboard?track=all&limit=50")
  })

  it("shows the top three on the podium and the rest in the table", async () => {
    await renderLoaded()

    expect(screen.getByText("NE")).toBeTruthy()
    expect(screen.getByText("KM")).toBeTruthy()
    expect(screen.getByText("YT")).toBeTruthy()
    expect(screen.getByText("Salma Hany")).toBeTruthy()
    expect(screen.getByText("Omar Sherif")).toBeTruthy()
  })

  it("reveals the attendance and QR breakdown when a row expands", async () => {
    const { container } = await renderLoaded()

    expect(screen.queryByText(/Sessions Attended: 2/)).toBeNull()

    fireEvent.click(container.querySelectorAll(".rank-row")[0])

    expect(screen.getByText(/Sessions Attended: 2/)).toBeTruthy()
    expect(screen.getByText(/Campus QR Scans: 1/)).toBeTruthy()
  })

  it("reloads with the selected track", async () => {
    await renderLoaded()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Level 1 (Fundamentals)" }))
    })

    expect(fetchMock()).toHaveBeenLastCalledWith("/api/leaderboard?track=level_1&limit=50")
  })

  it("refreshes the current track on demand", async () => {
    await renderLoaded()
    const callsAfterMount = fetchMock().mock.calls.length

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Refresh/ }))
    })

    expect(fetchMock().mock.calls.length).toBe(callsAfterMount + 1)
    expect(fetchMock()).toHaveBeenLastCalledWith("/api/leaderboard?track=all&limit=50")
  })

  it("falls back to the empty-standings message when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    await renderLoaded()

    expect(screen.getByText(/All top cadets are displayed on the podium/)).toBeTruthy()
  })
})
