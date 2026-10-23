import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CodeforcesApiError,
  fetchCodeforcesSolvedProblems,
  fetchCodeforcesUserInfo,
} from "@/lib/codeforces/client"

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }
}

function fetchMock() {
  return globalThis.fetch as unknown as ReturnType<typeof vi.fn>
}

beforeEach(() => {
  process.env.CODEFORCES_MIN_INTERVAL_MS = "0"
  process.env.CODEFORCES_MAX_RETRIES = "0"
  process.env.CODEFORCES_RETRY_BASE_MS = "0"
  delete process.env.CODEFORCES_REQUEST_TIMEOUT_MS
  delete process.env.CODEFORCES_MAX_RESPONSE_BYTES
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete process.env.CODEFORCES_MIN_INTERVAL_MS
  delete process.env.CODEFORCES_MAX_RETRIES
  delete process.env.CODEFORCES_RETRY_BASE_MS
})

describe("fetchCodeforcesUserInfo", () => {
  it("parses rating fields and preserves missing ratings as null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [{ handle: "Tourist", rating: 3800, maxRating: 3900, rank: "legendary" }],
        })
      )
    )

    const info = await fetchCodeforcesUserInfo("tourist")

    expect(info).toEqual({
      handle: "Tourist",
      rating: 3800,
      maxRating: 3900,
      rank: "legendary",
      maxRank: null,
    })
    expect(fetchMock().mock.calls[0][0].toString()).toBe(
      "https://codeforces.com/api/user.info?handles=tourist"
    )
  })

  it("treats an unrated account as null rather than zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ status: "OK", result: [{ handle: "newbie", rating: undefined }] })
      )
    )

    const info = await fetchCodeforcesUserInfo("newbie")

    expect(info.rating).toBeNull()
    expect(info.maxRating).toBeNull()
  })

  it("maps a FAILED not-found response to a non-retryable error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ status: "FAILED", comment: "handles: User with handle x not found" })
      )
    )

    await expect(fetchCodeforcesUserInfo("missing")).rejects.toMatchObject({
      code: "not_found",
      retryable: false,
      userMessage: "Codeforces handle was not found.",
    })
    expect(fetchMock()).toHaveBeenCalledTimes(1)
  })

  it("maps an empty result to an invalid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: "OK", result: [] }))
    )

    await expect(fetchCodeforcesUserInfo("empty")).rejects.toMatchObject({
      code: "invalid_response",
    })
  })

  it("retries transient server failures with bounded attempts", async () => {
    process.env.CODEFORCES_MAX_RETRIES = "1"
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({}, 503))
        .mockResolvedValueOnce(
          jsonResponse({ status: "OK", result: [{ handle: "tourist", rating: 3800 }] })
        )
    )

    const info = await fetchCodeforcesUserInfo("tourist")

    expect(info.handle).toBe("tourist")
    expect(fetchMock()).toHaveBeenCalledTimes(2)
  })

  it("stops after the retry budget", async () => {
    process.env.CODEFORCES_MAX_RETRIES = "1"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)))

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "unavailable",
      retryable: true,
    })
    expect(fetchMock()).toHaveBeenCalledTimes(2)
  })

  it("retries Codeforces rate-limit failures", async () => {
    process.env.CODEFORCES_MAX_RETRIES = "1"
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ status: "FAILED", comment: "Call limit exceeded" })
        )
        .mockResolvedValueOnce(
          jsonResponse({ status: "OK", result: [{ handle: "tourist", rating: 3800 }] })
        )
    )

    const info = await fetchCodeforcesUserInfo("tourist")
    expect(info.handle).toBe("tourist")
    expect(fetchMock()).toHaveBeenCalledTimes(2)
  })

  it("rejects malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "<html>not json</html>",
      })
    )

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "invalid_response",
    })
  })

  it("rejects responses that exceed the configured size limit", async () => {
    process.env.CODEFORCES_MAX_RESPONSE_BYTES = "10"
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "OK", result: [] }),
      })
    )

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "invalid_response",
      userMessage: "Codeforces returned an unexpectedly large response.",
    })
  })

  it("maps an aborted request to a timeout error", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" })
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort))

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "timeout",
      retryable: true,
    })
  })

  it("maps network failures to a retryable unavailable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")))

    await expect(fetchCodeforcesUserInfo("tourist")).rejects.toMatchObject({
      code: "unavailable",
      retryable: true,
    })
  })

  it("does not leak the raw Codeforces comment to the user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ status: "FAILED", comment: "internal stack trace details" })
      )
    )

    try {
      await fetchCodeforcesUserInfo("tourist")
      throw new Error("expected failure")
    } catch (error) {
      expect(error).toBeInstanceOf(CodeforcesApiError)
      expect((error as CodeforcesApiError).userMessage).not.toContain("stack trace")
    }
  })
})

describe("fetchCodeforcesSolvedProblems", () => {
  function submission(
    id: number,
    contestId: number | undefined,
    index: string | undefined,
    verdict: string,
    extra: Record<string, unknown> = {}
  ) {
    return {
      id,
      verdict,
      problem: { contestId, index },
      ...extra,
    }
  }

  it("deduplicates accepted problems and ignores failed or malformed submissions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            submission(5, 1, "A", "OK"),
            submission(4, 1, "A", "OK"),
            submission(3, 1, "A", "WRONG_ANSWER"),
            submission(2, 2, "B", "OK"),
            submission(1, undefined, undefined, "OK"),
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.solvedCount).toBe(2)
    expect(result.problemKeys).toEqual(["1:A", "2:B"])
    expect(result.lastSubmissionId).toBe(5)
  })

  it("counts a failed submission followed by an accepted one once", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            submission(2, 10, "C", "OK"),
            submission(1, 10, "C", "WRONG_ANSWER"),
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.solvedCount).toBe(1)
  })

  it("merges only new submissions when the previous cursor is known", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            submission(12, 2, "B", "OK"),
            submission(10, 1, "A", "OK"),
            submission(9, 3, "C", "OK"),
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: ["1:A"],
      lastSubmissionId: 10,
    })

    expect(result.problemKeys).toEqual(["1:A", "2:B"])
    expect(result.solvedCount).toBe(2)
    expect(result.lastSubmissionId).toBe(12)
  })

  it("returns zero only for a valid empty submission list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: "OK", result: [] }))
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.solvedCount).toBe(0)
    expect(result.lastSubmissionId).toBeNull()
  })

  it("rejects submissions that all lack usable problem identifiers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [submission(1, undefined, undefined, "OK")],
        })
      )
    )

    await expect(
      fetchCodeforcesSolvedProblems("tourist", { problemKeys: [], lastSubmissionId: null })
    ).rejects.toMatchObject({
      code: "invalid_response",
      userMessage: "Codeforces returned submissions without usable problem identifiers.",
    })
  })

  it("derives an identity for a problemset without a contest id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            {
              id: 1,
              verdict: "OK",
              problem: { problemsetName: "acmsguru", index: "101" },
            },
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.problemKeys).toEqual(["problemset:acmsguru:101"])
  })

  it("uses a normalized name and index when no external identifiers exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            {
              id: 2,
              verdict: "OK",
              problem: { name: "  Two   Sum ", index: "a" },
            },
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.problemKeys).toEqual(["name:two_sum:A"])
  })

  it("uses a name-only fallback when the index is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            { id: 3, verdict: "OK", problem: { name: "Legacy Problem" } },
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.problemKeys).toEqual(["name:legacy_problem"])
  })

  it("keeps identical problem names in different problemsets distinct", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            {
              id: 4,
              verdict: "OK",
              problem: { problemsetName: "alpha", index: "A", name: "Same" },
            },
            {
              id: 3,
              verdict: "OK",
              problem: { problemsetName: "beta", index: "A", name: "Same" },
            },
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.problemKeys).toEqual([
      "problemset:alpha:A",
      "problemset:beta:A",
    ])
  })

  it("is stable across repeated responses and preserves legacy keys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            { id: 7, verdict: "OK", problem: { contestId: 10, index: "B" } },
          ],
        })
      )
    )

    const first = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: ["1:A"],
      lastSubmissionId: null,
    })
    const second = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: first.problemKeys,
      lastSubmissionId: first.lastSubmissionId,
    })

    expect(first.problemKeys).toEqual(["10:B", "1:A"])
    expect(second.problemKeys).toEqual(first.problemKeys)
    expect(second.solvedCount).toBe(2)
  })

  it("skips only submissions with no usable identity and still reports a failure when all are unusable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            { id: 2, verdict: "OK", problem: { index: "A" } },
            { id: 1, verdict: "OK", problem: {} },
          ],
        })
      )
    )

    await expect(
      fetchCodeforcesSolvedProblems("tourist", { problemKeys: [], lastSubmissionId: null })
    ).rejects.toMatchObject({
      code: "invalid_response",
      userMessage: "Codeforces returned submissions without usable problem identifiers.",
    })
  })

  it("falls back to the submission-level contest id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "OK",
          result: [
            {
              id: 1,
              contestId: 42,
              verdict: "OK",
              problem: { index: "D" },
            },
          ],
        })
      )
    )

    const result = await fetchCodeforcesSolvedProblems("tourist", {
      problemKeys: [],
      lastSubmissionId: null,
    })

    expect(result.problemKeys).toEqual(["42:D"])
  })
})
