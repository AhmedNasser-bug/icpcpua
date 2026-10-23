import { describe, expect, it } from "vitest"
import {
  assignCompetitionRanks,
  assignPageRanks,
  buildLeaderboardUser,
  normalizeLeaderboardTrack,
  parseLeaderboardPage,
  parseLeaderboardPageSize,
} from "@/lib/leaderboard"

describe("competition ranking", () => {
  it("gives equal scores the same rank and skips the next rank", () => {
    expect(assignCompetitionRanks([100, 100, 90], 1)).toEqual([1, 1, 3])
    expect(assignCompetitionRanks([100, 90, 90, 80], 1)).toEqual([1, 2, 2, 4])
  })

  it("offsets ranks for a page that starts at a known rank", () => {
    expect(assignPageRanks([100, 90], 4, 1)).toEqual([4, 5])
  })

  it("keeps ranks correct when a page starts inside a tie", () => {
    expect(assignPageRanks([100, 90], 1, 3)).toEqual([1, 4])
    expect(assignPageRanks([100, 100, 90, 90, 80], 1, 2)).toEqual([1, 1, 3, 3, 5])
    expect(assignPageRanks([90, 90, 80], 4, 2)).toEqual([4, 4, 6])
  })

  it("handles a page beginning with the global leader", () => {
    expect(assignPageRanks([100, 100, 100], 1, 3)).toEqual([1, 1, 1])
  })
})

describe("leaderboard parameter parsing", () => {
  it("normalizes track values", () => {
    expect(normalizeLeaderboardTrack(null)).toBe("all")
    expect(normalizeLeaderboardTrack("all")).toBe("all")
    expect(normalizeLeaderboardTrack(" level_2 ")).toBe("level_2")
    expect(normalizeLeaderboardTrack("level_3")).toBe("level_3")
  })

  it("defaults and clamps page values", () => {
    expect(parseLeaderboardPage(null)).toBe(1)
    expect(parseLeaderboardPage("0")).toBe(1)
    expect(parseLeaderboardPage("abc")).toBe(1)
    expect(parseLeaderboardPage("4")).toBe(4)
  })

  it("defaults and clamps page sizes", () => {
    expect(parseLeaderboardPageSize(null)).toBe(50)
    expect(parseLeaderboardPageSize("0")).toBe(50)
    expect(parseLeaderboardPageSize("200")).toBe(100)
    expect(parseLeaderboardPageSize("25")).toBe(25)
  })
})

describe("buildLeaderboardUser", () => {
  it("keeps unknown Codeforces metrics null and uses a placeholder handle", () => {
    const entry = buildLeaderboardUser(
      {
        universityId: "PUA-0001",
        fullName: "Test Cadet",
        pointsTotal: 10,
        cfRating: 0,
        cfSolvedCount: 0,
      },
      2,
      1
    )

    expect(entry).toMatchObject({
      rank: 2,
      handle: "@user_0001",
      rating: null,
      solved: null,
      pointsTotal: 10,
      initials: "TC",
      color: "#E0E0E0",
    })
  })

  it("marks the viewer row and exposes a verified Codeforces profile", () => {
    const entry = buildLeaderboardUser(
      {
        universityId: "202300001",
        fullName: "Nourhan Ezzat",
        pointsTotal: 100,
        codeforcesHandle: "algo_queen",
        cfHandleVerified: true,
        cfRating: 2100,
        cfMaxRating: 2200,
        cfSolvedCount: 540,
        cfLastSyncedAt: new Date().toISOString(),
        cfSyncStatus: "success",
      },
      1,
      0,
      "202300001"
    )

    expect(entry).toMatchObject({
      handle: "@algo_queen",
      codeforcesHandle: "algo_queen",
      codeforcesUrl: "https://codeforces.com/profile/algo_queen",
      rating: 2100,
      maxRating: 2200,
      solved: 540,
      isViewer: true,
      color: "#FFD500",
    })
  })
})
