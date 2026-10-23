export const UNIVERSITY_ID_PATTERN = /^[A-Za-z0-9_-]{3,64}$/

export function normalizeUniversityId(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return UNIVERSITY_ID_PATTERN.test(trimmed) ? trimmed : null
}
