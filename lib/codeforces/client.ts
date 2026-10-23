import {
  CodeforcesCoordinationError,
  acquireCodeforcesRateLimitSlot,
} from "./rate-limit"

const CODEFORCES_API_BASE = "https://codeforces.com/api/"

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_RETRY_BASE_MS = 500
const DEFAULT_MAX_RESPONSE_BYTES = 12_000_000
const STATUS_PAGE_SIZE = 10_000
const DEFAULT_MAX_STATUS_PAGES = 10

export type CodeforcesErrorCode =
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "invalid_response"
  | "timeout"
  | "coordination_unavailable"

export class CodeforcesApiError extends Error {
  readonly code: CodeforcesErrorCode
  readonly retryable: boolean
  readonly userMessage: string

  constructor(
    code: CodeforcesErrorCode,
    retryable: boolean,
    userMessage: string,
    options?: { cause?: unknown }
  ) {
    super(userMessage, options)
    this.name = "CodeforcesApiError"
    this.code = code
    this.retryable = retryable
    this.userMessage = userMessage
  }
}

export interface CodeforcesUserInfo {
  handle: string
  rating: number | null
  maxRating: number | null
  rank: string | null
  maxRank: string | null
}

export interface CodeforcesProblemState {
  problemKeys: string[]
  lastSubmissionId: number | null
}

export interface CodeforcesSolvedProblems extends CodeforcesProblemState {
  solvedCount: number
}

function envInt(name: string, fallback: number, minimum = 0): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10)
  if (!Number.isFinite(parsed) || parsed < minimum) return fallback
  return parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryDelay(attempt: number): number {
  const base = envInt("CODEFORCES_RETRY_BASE_MS", DEFAULT_RETRY_BASE_MS)
  if (base === 0) return 0
  const exponential = Math.min(base * 2 ** attempt, 10_000)
  return exponential + Math.floor(Math.random() * base)
}

function timeoutSignal(ms: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  }
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function apiFailure(comment: string, method: string): CodeforcesApiError {
  if (/not found|no such handle|unknown handle/i.test(comment)) {
    return new CodeforcesApiError(
      "not_found",
      false,
      "Codeforces handle was not found."
    )
  }

  if (/limit|too many|flood|try again/i.test(comment)) {
    return new CodeforcesApiError(
      "rate_limited",
      true,
      "Codeforces is rate limiting requests. Please try again shortly."
    )
  }

  if (/internal|temporarily|unavailable/i.test(comment)) {
    return new CodeforcesApiError(
      "unavailable",
      true,
      "Codeforces is temporarily unavailable. The last synchronized data was kept."
    )
  }

  console.error("Codeforces API returned FAILED", { method, comment })
  return new CodeforcesApiError(
    "unavailable",
    false,
    "Codeforces could not complete the request. The last synchronized data was kept."
  )
}

async function performRequest(
  method: string,
  params: Record<string, string | number>
): Promise<unknown> {
  try {
    await acquireCodeforcesRateLimitSlot()
  } catch (error) {
    if (error instanceof CodeforcesCoordinationError) {
      throw new CodeforcesApiError(
        "coordination_unavailable",
        true,
        "Codeforces synchronization coordination is temporarily unavailable. Try again shortly.",
        { cause: error }
      )
    }
    throw new CodeforcesApiError(
      "coordination_unavailable",
      true,
      "Codeforces synchronization coordination is temporarily unavailable. Try again shortly.",
      { cause: error }
    )
  }

  const url = new URL(method, CODEFORCES_API_BASE)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const timeoutMs = envInt("CODEFORCES_REQUEST_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, 1)
  const maxBytes = envInt("CODEFORCES_MAX_RESPONSE_BYTES", DEFAULT_MAX_RESPONSE_BYTES, 1)
  const timeout = timeoutSignal(timeoutMs)

  try {
    const response = await fetch(url, {
      signal: timeout.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (response.status === 429 || response.status >= 500) {
      throw new CodeforcesApiError(
        "unavailable",
        true,
        "Codeforces is temporarily unavailable. The last synchronized data was kept."
      )
    }

    if (!response.ok) {
      throw new CodeforcesApiError(
        "unavailable",
        false,
        "Codeforces could not complete the request. The last synchronized data was kept."
      )
    }

    const text = await response.text()
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new CodeforcesApiError(
        "invalid_response",
        false,
        "Codeforces returned an unexpectedly large response."
      )
    }

    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      throw new CodeforcesApiError(
        "invalid_response",
        false,
        "Codeforces returned an unexpected response. The last synchronized data was kept."
      )
    }

    const body = asRecord(payload)
    if (!body || body.status !== "OK") {
      const comment = typeof body?.comment === "string" ? body.comment : ""
      throw apiFailure(comment, method)
    }

    return body.result
  } catch (error) {
    if (error instanceof CodeforcesApiError) throw error

    if (error instanceof Error && error.name === "AbortError") {
      throw new CodeforcesApiError(
        "timeout",
        true,
        "Codeforces did not respond in time. The last synchronized data was kept."
      )
    }

    throw new CodeforcesApiError(
      "unavailable",
      true,
      "Codeforces is temporarily unavailable. The last synchronized data was kept.",
      { cause: error }
    )
  } finally {
    timeout.clear()
  }
}

async function requestCodeforces(
  method: string,
  params: Record<string, string | number>
): Promise<unknown> {
  const maxRetries = envInt("CODEFORCES_MAX_RETRIES", DEFAULT_MAX_RETRIES)

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await performRequest(method, params)
    } catch (error) {
      const apiError =
        error instanceof CodeforcesApiError
          ? error
          : new CodeforcesApiError(
              "unavailable",
              true,
              "Codeforces is temporarily unavailable. The last synchronized data was kept.",
              { cause: error }
            )

      if (!apiError.retryable || attempt >= maxRetries) throw apiError
      const delay = retryDelay(attempt)
      if (delay > 0) await sleep(delay)
    }
  }
}

export async function fetchCodeforcesUserInfo(handle: string): Promise<CodeforcesUserInfo> {
  const result = await requestCodeforces("user.info", { handles: handle })
  if (!Array.isArray(result) || result.length === 0) {
    throw new CodeforcesApiError(
      "invalid_response",
      false,
      "Codeforces returned an unexpected account response."
    )
  }

  const raw = asRecord(result[0])
  const canonicalHandle = raw ? nullableString(raw.handle) : null
  if (!raw || !canonicalHandle) {
    throw new CodeforcesApiError(
      "invalid_response",
      false,
      "Codeforces returned an unexpected account response."
    )
  }

  return {
    handle: canonicalHandle,
    rating: nullableNumber(raw.rating),
    maxRating: nullableNumber(raw.maxRating),
    rank: nullableString(raw.rank),
    maxRank: nullableString(raw.maxRank),
  }
}

interface CodeforcesProblemIdentity {
  key: string
  ambiguous: boolean
}

function normalizeProblemIndex(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9_]{1,10}$/.test(normalized) ? normalized : null
}

function normalizeProblemsetName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
  return normalized.length > 0 ? normalized : null
}

function normalizeProblemName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
  return normalized.length > 0 ? normalized : null
}

/**
 * Canonical problem identity.
 *
 * Contest problems keep the existing `contestId:index` format so previously
 * synchronized keys remain valid. Non-contest problemsets are prefixed to
 * avoid colliding with contest ids. The name-only fallback is inherently
 * ambiguous, so callers can detect it through `ambiguous`.
 */
function deriveCodeforcesProblemKey(
  problem: Record<string, unknown> | null,
  submission?: Record<string, unknown>
): CodeforcesProblemIdentity | null {
  const contestId =
    nullableNumber(problem?.contestId) ?? nullableNumber(submission?.contestId)
  const index = normalizeProblemIndex(problem?.index)

  if (contestId !== null && Number.isInteger(contestId) && contestId > 0 && index) {
    return { key: `${contestId}:${index}`, ambiguous: false }
  }

  const problemsetName = normalizeProblemsetName(problem?.problemsetName)
  if (problemsetName && index) {
    return { key: `problemset:${problemsetName}:${index}`, ambiguous: false }
  }

  const name = normalizeProblemName(problem?.name)
  if (name && index) {
    return { key: `name:${name}:${index}`, ambiguous: true }
  }
  if (name) {
    return { key: `name:${name}`, ambiguous: true }
  }

  return null
}

export async function fetchCodeforcesSolvedProblems(
  handle: string,
  previous: CodeforcesProblemState
): Promise<CodeforcesSolvedProblems> {
  const problemKeys = new Set(previous.problemKeys)
  const maxPages = envInt("CODEFORCES_MAX_STATUS_PAGES", DEFAULT_MAX_STATUS_PAGES, 1)
  let lastSubmissionId = previous.lastSubmissionId
  let newSubmissionsSeen = 0
  let recognizedSubmissions = 0
  let complete = false

  for (let page = 0; page < maxPages; page += 1) {
    const result = await requestCodeforces("user.status", {
      handle,
      from: page * STATUS_PAGE_SIZE + 1,
      count: STATUS_PAGE_SIZE,
    })

    if (!Array.isArray(result)) {
      throw new CodeforcesApiError(
        "invalid_response",
        false,
        "Codeforces returned an unexpected submissions response."
      )
    }

    if (result.length === 0) {
      complete = true
      break
    }

    let reachedKnownSubmission = false

    for (const entry of result) {
      const submission = asRecord(entry)
      if (!submission) {
        newSubmissionsSeen += 1
        continue
      }

      const submissionId =
        typeof submission.id === "number" && Number.isInteger(submission.id)
          ? submission.id
          : null

      if (submissionId !== null) {
        if (
          previous.lastSubmissionId !== null &&
          submissionId <= previous.lastSubmissionId
        ) {
          reachedKnownSubmission = true
          continue
        }
        lastSubmissionId =
          lastSubmissionId === null ? submissionId : Math.max(lastSubmissionId, submissionId)
      }

      newSubmissionsSeen += 1
      const problem = asRecord(submission.problem)
      const identity = deriveCodeforcesProblemKey(problem, submission)

      if (!identity) continue
      recognizedSubmissions += 1

      if (submission.verdict === "OK") {
        problemKeys.add(identity.key)
      }
    }

    if (reachedKnownSubmission || result.length < STATUS_PAGE_SIZE) {
      complete = true
      break
    }
  }

  if (!complete) {
    throw new CodeforcesApiError(
      "invalid_response",
      false,
      "Codeforces submission history is too large to synchronize safely."
    )
  }

  if (newSubmissionsSeen > 0 && recognizedSubmissions === 0) {
    throw new CodeforcesApiError(
      "invalid_response",
      false,
      "Codeforces returned submissions without usable problem identifiers."
    )
  }

  const keys = [...problemKeys].sort()

  return {
    problemKeys: keys,
    solvedCount: keys.length,
    lastSubmissionId,
  }
}
