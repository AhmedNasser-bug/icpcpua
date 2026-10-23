const CODEFORCES_HANDLE_MIN_LENGTH = 3
const CODEFORCES_HANDLE_MAX_LENGTH = 24

const HANDLE_PATTERN = /^[A-Za-z0-9_.-]+$/

/**
 * Trim and remove a single leading "@" without changing the casing of the
 * account identifier. Codeforces treats handles case-insensitively but
 * preserves their original casing, so the API response is the canonical form.
 */
export function normalizeCodeforcesHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null

  let handle = raw.trim()
  if (handle.startsWith("@")) {
    handle = handle.slice(1).trim()
  }

  if (
    handle.length < CODEFORCES_HANDLE_MIN_LENGTH ||
    handle.length > CODEFORCES_HANDLE_MAX_LENGTH
  ) {
    return null
  }

  if (!HANDLE_PATTERN.test(handle)) return null
  return handle
}

export function codeforcesHandleKey(handle: string): string {
  return handle.trim().toLowerCase()
}

export function codeforcesProfileUrl(handle: string): string {
  return `https://codeforces.com/profile/${encodeURIComponent(handle)}`
}
