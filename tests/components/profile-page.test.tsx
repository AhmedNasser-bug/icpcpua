import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/firebase/client", () => ({
  isFirebaseClientConfigured: () => true,
  signInFirebaseUser: vi.fn(async () => ({ uid: "firebase-202300001" })),
  getFirebaseIdToken: vi.fn(async () => "id-token"),
  signOutFirebase: vi.fn(async () => {}),
  sendFirebasePasswordReset: vi.fn(async () => {}),
  firebaseAuthErrorMessage: () => "Authentication failed.",
  deleteFirebaseUser: vi.fn(async () => {}),
  registerFirebaseUser: vi.fn(),
}))

import ProfilePage from "@/app/(site)/profile/page"

const trainee = {
  universityId: "202300001",
  fullName: "Ahmed Nasser",
  track: "level_1",
  academicYear: "Year 2",
  status: "active",
  pointsTotal: 420,
}

const standing = (rank: number, total: number) => ({
  eligible: true,
  reason: null,
  rank,
  total,
  universityId: "202300001",
  fullName: "Ahmed Nasser",
  track: "level_1",
  pointsTotal: 420,
  handle: "@tourist",
  codeforcesHandle: "tourist",
  codeforcesUrl: "https://codeforces.com/profile/tourist",
  codeforcesLinked: true,
  rating: 2400,
  maxRating: 2500,
  solved: 500,
  lastSyncedAt: "2026-10-20T10:00:00.000Z",
  syncStatus: "success",
  stale: false,
  color: "#FFD500",
  initials: "AN",
})

const account = (overrides: Record<string, unknown> = {}) => ({
  handle: "tourist",
  pendingHandle: null,
  profileUrl: "https://codeforces.com/profile/tourist",
  linked: true,
  verified: true,
  rating: 2400,
  maxRating: 2500,
  solvedCount: 500,
  lastSyncedAt: "2026-10-20T10:00:00.000Z",
  lastAttemptAt: "2026-10-20T10:00:00.000Z",
  nextSyncAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  syncStatus: "success",
  syncError: null,
  stale: false,
  ...overrides,
})

function dashboard(codeforcesOverrides: Record<string, unknown> = {}) {
  return {
    success: true,
    trainee,
    codeforces: account(codeforcesOverrides),
    standings: {
      global: standing(8, 40),
      track: standing(3, 20),
    },
  }
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

async function renderPage() {
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(<ProfilePage />)
  })
  return result
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("ProfilePage", () => {
  it("shows the sign-in form when the API answers 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ success: false }, 401)))

    await renderPage()

    expect(screen.getByRole("heading", { name: "Cadet sign-in" })).toBeTruthy()
    expect(screen.getByPlaceholderText("you@pua.edu.eg")).toBeTruthy()
    expect(screen.getByPlaceholderText("Your password")).toBeTruthy()
  })

  it("signs in and loads the dashboard", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: false }, 401))
      .mockResolvedValueOnce(response({ success: true }))
      .mockResolvedValueOnce(response(dashboard()))
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    fireEvent.change(screen.getByPlaceholderText("you@pua.edu.eg"), {
      target: { value: "ahmed@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "correct-horse" },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Sign in to my profile/ }))
    })

    expect(await screen.findByText("Ahmed Nasser")).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith("/api/trainees/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ idToken: "id-token" }),
    })
  })

  it("shows the linked account, standings and freshness", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(dashboard())))

    await renderPage()

    expect(await screen.findByText("Ahmed Nasser")).toBeTruthy()
    expect(screen.getByText("#8")).toBeTruthy()
    expect(screen.getByText("#3")).toBeTruthy()
    expect(screen.getByText("@tourist")).toBeTruthy()
    expect(screen.getByText("Rating")).toBeTruthy()
    expect(screen.getAllByText("2400").length).toBeGreaterThan(0)
    expect(screen.getByText("Handle verified")).toBeTruthy()
  })

  it("shows the connection form for a trainee without a Codeforces account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          dashboard({
            handle: null,
            pendingHandle: null,
            profileUrl: null,
            linked: false,
            verified: false,
            rating: null,
            maxRating: null,
            solvedCount: null,
            lastSyncedAt: null,
            syncStatus: "never",
          })
        )
      )
    )

    await renderPage()

    expect(await screen.findByPlaceholderText("e.g. tourist")).toBeTruthy()
    expect(screen.getByRole("button", { name: /Connect account/ })).toBeTruthy()
  })

  it("shows a pending verification state for an unverified stored handle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          dashboard({
            handle: null,
            pendingHandle: "tourist",
            profileUrl: null,
            verified: false,
            rating: null,
            maxRating: null,
            solvedCount: null,
            lastSyncedAt: null,
            syncStatus: "never",
          })
        )
      )
    )

    await renderPage()

    expect(await screen.findByText("@tourist")).toBeTruthy()
    expect(screen.getByText("Pending verification")).toBeTruthy()
    expect(screen.getByRole("button", { name: /Verify now/ })).toBeTruthy()
  })

  it("shows a Codeforces failure without hiding the last valid data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          dashboard({
            syncStatus: "failed",
            stale: true,
            syncError: "Codeforces is temporarily unavailable.",
            lastSyncedAt: "2026-10-01T10:00:00.000Z",
          })
        )
      )
    )

    await renderPage()

    expect(
      await screen.findByText(/Codeforces is temporarily unavailable/)
    ).toBeTruthy()
    expect(screen.getByText(/last valid data is still displayed/)).toBeTruthy()
    expect(screen.getByText(/This data is stale/)).toBeTruthy()
    expect(screen.getAllByText("2400").length).toBeGreaterThan(0)
  })

  it("links a handle and reports the sync result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          dashboard({
            handle: null,
            pendingHandle: null,
            profileUrl: null,
            linked: false,
            verified: false,
            rating: null,
            maxRating: null,
            solvedCount: null,
            lastSyncedAt: null,
            syncStatus: "never",
          })
        )
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          codeforces: account(),
          sync: { ok: true, syncedAt: "2026-10-20T10:00:00.000Z" },
        })
      )
      .mockResolvedValueOnce(response(dashboard()))
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    fireEvent.change(await screen.findByPlaceholderText("e.g. tourist"), {
      target: { value: "tourist" },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Connect account/ }))
    })

    expect(
      await screen.findByText("Codeforces account linked and synchronized.")
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith("/api/trainees/codeforces", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ handle: "tourist" }),
    })
  })

  it("surfaces an invalid handle error from the API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          dashboard({
            handle: null,
            pendingHandle: null,
            profileUrl: null,
            linked: false,
            verified: false,
            rating: null,
            maxRating: null,
            solvedCount: null,
            lastSyncedAt: null,
            syncStatus: "never",
          })
        )
      )
      .mockResolvedValueOnce(
        response({ success: false, error: "Codeforces handle was not found." }, 404)
      )
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    fireEvent.change(await screen.findByPlaceholderText("e.g. tourist"), {
      target: { value: "missing" },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Connect account/ }))
    })

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Codeforces handle was not found."
    )
  })

  it("refreshes the data manually and updates the dashboard", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dashboard()))
      .mockResolvedValueOnce(
        response({
          success: true,
          codeforces: account(),
          standings: { global: standing(8, 40), track: standing(3, 20) },
          sync: { ok: true, syncedAt: "2026-10-20T10:00:00.000Z" },
        })
      )
      .mockResolvedValueOnce(response(dashboard()))
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Refresh data/ }))
    })

    expect(await screen.findByText(/Synchronized successfully/)).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith("/api/trainees/codeforces/sync", {
      method: "POST",
      credentials: "same-origin",
    })
  })

  it("disconnects the account after an explicit confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dashboard()))
      .mockResolvedValueOnce(response({ success: true, codeforces: account({ linked: false }) }))
      .mockResolvedValueOnce(
        response(
          dashboard({
            handle: null,
            pendingHandle: null,
            profileUrl: null,
            linked: false,
            verified: false,
            rating: null,
            maxRating: null,
            solvedCount: null,
            lastSyncedAt: null,
            syncStatus: "never",
          })
        )
      )
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Disconnect/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Confirm disconnect/ }))
    })

    expect(await screen.findByText("Codeforces account disconnected.")).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith("/api/trainees/codeforces", {
      method: "DELETE",
      credentials: "same-origin",
    })
  })

  it("automatically synchronizes a due account once", async () => {
    let dashboardReads = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === "/api/trainees/codeforces" && (init?.method ?? "GET") === "GET") {
        dashboardReads += 1
        if (dashboardReads === 1) {
          return response(
            dashboard({
              handle: null,
              pendingHandle: "tourist",
              verified: false,
              rating: null,
              maxRating: null,
              solvedCount: null,
              lastSyncedAt: null,
              syncStatus: "never",
              nextSyncAt: new Date(Date.now() - 1000).toISOString(),
            })
          )
        }
        return response(dashboard())
      }
      if (url === "/api/trainees/codeforces/sync") {
        return response({ success: true, sync: { ok: true } })
      }
      return response({ success: false }, 404)
    })
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/trainees/codeforces/sync", {
        method: "POST",
        credentials: "same-origin",
      })
    })
    expect(await screen.findByText("Handle verified")).toBeTruthy()
    expect(dashboardReads).toBe(2)
  })

  it("signs out and returns to the sign-in form", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dashboard()))
      .mockResolvedValueOnce(response({ success: true }))
    vi.stubGlobal("fetch", fetchMock)

    await renderPage()

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Sign out/ }))
    })

    expect(await screen.findByRole("heading", { name: "Cadet sign-in" })).toBeTruthy()
  })

  it("shows a retry state when the dashboard request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    vi.spyOn(console, "error").mockImplementation(() => {})

    await renderPage()

    expect(await screen.findByText("network down")).toBeTruthy()
    expect(screen.getByRole("button", { name: /Retry/ })).toBeTruthy()
  })
})
