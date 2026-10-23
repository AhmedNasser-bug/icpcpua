import type { CodeforcesSyncStatus, TraineeDocument } from "@/lib/firebase-schema"
import { codeforcesProfileUrl } from "./handle"
import { codeforcesStaleAfterMs } from "./config"

export interface CodeforcesAccountView {
  handle: string | null
  pendingHandle: string | null
  profileUrl: string | null
  linked: boolean
  verified: boolean
  rating: number | null
  maxRating: number | null
  solvedCount: number | null
  lastSyncedAt: string | null
  lastAttemptAt: string | null
  nextSyncAt: string | null
  syncStatus: CodeforcesSyncStatus
  syncError: string | null
  stale: boolean
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string") return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function isCodeforcesDataStale(lastSyncedAt: unknown): boolean {
  const parsed = parseTimestamp(lastSyncedAt)
  if (parsed === null) return false
  return Date.now() - parsed > codeforcesStaleAfterMs()
}

/**
 * Present only data that an API response can vouch for. Legacy documents store
 * `0` in the Codeforces fields before their first sync, so an unverified
 * document must show "unknown" rather than a real zero.
 */
export function toCodeforcesAccountView(
  trainee: Partial<TraineeDocument>
): CodeforcesAccountView {
  const verified =
    trainee.cfHandleVerified === true || parseTimestamp(trainee.cfLastSyncedAt) !== null
  const storedHandle =
    typeof trainee.codeforcesHandle === "string" && trainee.codeforcesHandle.trim()
      ? trainee.codeforcesHandle.trim()
      : null
  const handle = verified ? storedHandle : null
  const hasSyncedSubmissions = parseTimestamp(trainee.cfLastSyncedAt) !== null
  const rawStatus = trainee.cfSyncStatus
  const syncStatus: CodeforcesSyncStatus =
    rawStatus === "success" || rawStatus === "failed"
      ? rawStatus
      : parseTimestamp(trainee.cfLastSyncedAt) !== null
        ? "success"
        : "never"

  return {
    handle,
    pendingHandle: verified ? null : storedHandle,
    profileUrl: handle ? codeforcesProfileUrl(handle) : null,
    linked: storedHandle !== null,
    verified,
    rating: verified ? nullableNumber(trainee.cfRating) : null,
    maxRating: verified ? nullableNumber(trainee.cfMaxRating) : null,
    solvedCount: hasSyncedSubmissions ? nullableNumber(trainee.cfSolvedCount) : null,
    lastSyncedAt:
      typeof trainee.cfLastSyncedAt === "string" ? trainee.cfLastSyncedAt : null,
    lastAttemptAt:
      typeof trainee.cfSyncAttemptedAt === "string" ? trainee.cfSyncAttemptedAt : null,
    nextSyncAt: typeof trainee.cfNextSyncAt === "string" ? trainee.cfNextSyncAt : null,
    syncStatus,
    syncError: typeof trainee.cfSyncError === "string" ? trainee.cfSyncError : null,
    stale: isCodeforcesDataStale(trainee.cfLastSyncedAt),
  }
}
