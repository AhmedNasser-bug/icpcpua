import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import LeaderboardPage from "@/app/(site)/leaderboard/page"

const coders = [
  {
    rank: 1,
    handle: "@algo",
    codeforcesHandle: "algo",
    codeforcesUrl: "https://codeforces.com/profile/algo",
    fullName: "Nourhan Ezzat",
    rating: 2100,
    maxRating: 2200,
    solved: 540,
    pointsTotal: 1240,
    track: "level_2",
    initials: "NE",
    color: "#FFD500",
    lastSyncedAt: "2026-10-20T10:00:00.000Z",
    syncStatus: "success",
    universityId: "202300001",
  },
  {
    rank: 2,
    handle: "@byte",
    codeforcesHandle: "byte",
    codeforcesUrl: "https://codeforces.com/profile/byte",
    fullName: "Karim Mostafa",
    rating: 1850,
    maxRating: 1900,
    solved: 487,
    pointsTotal: 1050,
    track: "level_2",
    initials: "KM",
    color: "#E0E0E0",
    lastSyncedAt: "2026-10-20T10:00:00.000Z",
    syncStatus: "success",
    universityId: "202300002",
  },
  {
    rank: 3,
    handle: "@dp",
    codeforcesHandle: "dp",
    codeforcesUrl: "https://codeforces.com/profile/dp",
    fullName: "Youssef Tarek",
    rating: 1795,
    maxRating: 1830,
    solved: 412,
    pointsTotal: 960,
    track: "level_1",
    initials: "YT",
    color: "#FF0055",
    lastSyncedAt: "2026-10-20T10:00:00.000Z",
    syncStatus: "success",
    universityId: "202300003",
  },
  {
    rank: 4,
    handle: "@graph",
    codeforcesHandle: "graph",
    codeforcesUrl: "https://codeforces.com/profile/graph",
    fullName: "Salma Hany",
    rating: 1650,
    maxRating: 1700,
    solved: 389,
    pointsTotal: 840,
    track: "level_1",
    initials: "SH",
    color: "#00E5FF",
    attendedSessionsCount: 2,
    qrScansCount: 1,
    lastSyncedAt: "2026-10-20T10:00:00.000Z",
    syncStatus: "success",
    universityId: "202300004",
  },
  {
    rank: 5,
    handle: "@greedy",
    codeforcesHandle: "greedy",
    codeforcesUrl: "https://codeforces.com/profile/greedy",
    fullName: "Omar Sherif",
    rating: null,
    maxRating: null,
    solved: null,
    pointsTotal: 720,
    track: "level_1",
    initials: "OS",
    color: "#7B2CBF",
    lastSyncedAt: null,
    syncStatus: "never",
    universityId: "202300005",
  },
]

const viewer = {
  eligible: true,
  reason: null,
  rank: 8,
  total: 40,
  universityId: "202300099",
  fullName: "Viewer Cadet",
  track: "level_1",
  pointsTotal: 500,
  handle: "@viewer",
  codeforcesHandle: "viewer",
  codeforcesUrl: "https://codeforces.com/profile/viewer",
  rating: 1400,
  maxRating: 1500,
  solved: 200,
  lastSyncedAt: "2026-10-20T10:00:00.000Z",
  syncStatus: "success",
  color: "#00E5FF",
  initials: "VC",
}

function fetchMock() {
  return globalThis.fetch as unknown as ReturnType<typeof vi.fn>
}

function stubLeaderboard(
  leaderboard: unknown[],
  extras: Record<string, unknown> = {}
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: "firestore",
        leaderboard,
        total: leaderboard.length,
        totalPages: 1,
        page: 1,
        pageSize: 50,
        viewer: null,
        ...extras,
      }),
    })
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
  it("requests the first page of the leaderboard on mount", async () => {
    await renderLoaded()

    expect(fetchMock()).toHaveBeenCalledWith("/api/leaderboard?track=all&page=1&limit=50", {
      credentials: "same-origin",
    })
  })

  it("shows the top three on the podium and the rest in the table", async () => {
    await renderLoaded()

    expect(screen.getByText("NE")).toBeTruthy()
    expect(screen.getByText("KM")).toBeTruthy()
    expect(screen.getByText("YT")).toBeTruthy()
    expect(screen.getByText("Salma Hany")).toBeTruthy()
    expect(screen.getByText("Omar Sherif")).toBeTruthy()
  })

  it("reveals the attendance, QR and Codeforces details when a row expands", async () => {
    const { container } = await renderLoaded()

    expect(screen.queryByText(/Sessions Attended: 2/)).toBeNull()

    fireEvent.click(container.querySelectorAll(".rank-row")[0])

    expect(screen.getByText(/Sessions Attended: 2/)).toBeTruthy()
    expect(screen.getByText(/Campus QR Scans: 1/)).toBeTruthy()
    expect(screen.getByText("@graph")).toBeTruthy()
    expect(screen.getByText("Max CF: 1700")).toBeTruthy()
  })

  it("renders an unavailable rating and solved count as unknown, not zero", async () => {
    const { container } = await renderLoaded()

    fireEvent.click(container.querySelectorAll(".rank-row")[1])

    expect(screen.getByText("CF: Unrated")).toBeTruthy()
    expect(screen.getByText("Solved: —")).toBeTruthy()
  })

  it("reloads the first page with the selected track", async () => {
    await renderLoaded()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Level 1 (Fundamentals)" }))
    })

    expect(fetchMock()).toHaveBeenLastCalledWith("/api/leaderboard?track=level_1&page=1&limit=50", {
      credentials: "same-origin",
    })
  })

  it("refreshes the current track on demand", async () => {
    await renderLoaded()
    const callsAfterMount = fetchMock().mock.calls.length

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Refresh/ }))
    })

    expect(fetchMock().mock.calls.length).toBe(callsAfterMount + 1)
    expect(fetchMock()).toHaveBeenLastCalledWith("/api/leaderboard?track=all&page=1&limit=50", {
      credentials: "same-origin",
    })
  })

  it("shows the personal standing when the viewer is outside the page", async () => {
    stubLeaderboard(coders, { viewer, total: 40, totalPages: 2 })

    await renderLoaded()

    expect(screen.getByText(/your global rank/)).toBeTruthy()
    expect(screen.getByText(/outside this page/)).toBeTruthy()
    expect(screen.getByText("#8")).toBeTruthy()
  })

  it("highlights the viewer's row when it is on the current page", async () => {
    const viewerOnPage = {
      ...viewer,
      universityId: "202300004",
      rank: 4,
      pointsTotal: 840,
      fullName: "Salma Hany",
    }
    stubLeaderboard(coders, { viewer: viewerOnPage, total: 5 })

    const { container } = await renderLoaded()

    expect(screen.getByText("You")).toBeTruthy()
    expect(container.querySelectorAll(".rank-row")[0].className).toContain("FFD500")
  })

  it("moves to the next page without losing the personal standing", async () => {
    stubLeaderboard(coders, { viewer, total: 100, totalPages: 2 })

    await renderLoaded()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next leaderboard page" }))
    })

    expect(fetchMock()).toHaveBeenLastCalledWith("/api/leaderboard?track=all&page=2&limit=50", {
      credentials: "same-origin",
    })
    expect(screen.getByText(/outside this page/)).toBeTruthy()
  })

  it("keeps the last valid standings and shows a warning when a refresh fails", async () => {
    await renderLoaded()
    expect(screen.getByText("Salma Hany")).toBeTruthy()

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Refresh/ }))
    })

    expect(screen.getByText("Salma Hany")).toBeTruthy()
    expect(screen.getByRole("alert").textContent).toMatch(/last valid leaderboard is still shown/)
  })

  it("shows an empty state when the first request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    await renderLoaded()

    expect(screen.getByText("No cadets match this filter yet.")).toBeTruthy()
    expect(screen.getByRole("alert")).toBeTruthy()
  })
})
