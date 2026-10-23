import { randomUUID } from "node:crypto"
import {
  Timestamp,
  type DocumentReference,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { recordAuditEvent } from "@/lib/audit"
import {
  CodeforcesApiError,
  fetchCodeforcesSolvedProblems,
  fetchCodeforcesUserInfo,
} from "./client"
import {
  codeforcesCronBatchSize,
  codeforcesCronMinAttemptMs,
  codeforcesCronScanLimit,
  codeforcesCronTimeBudgetMs,
  codeforcesLockAcquireRetries,
  codeforcesLockHeartbeatMs,
  codeforcesLockRetryBaseMs,
  codeforcesRetryDelayMs,
  codeforcesSyncIntervalMs,
  codeforcesSyncLockTtlMs,
} from "./config"
import { codeforcesHandleKey, normalizeCodeforcesHandle } from "./handle"
import {
  finishSyncRun,
  startSyncRun,
  type SyncRunErrorCode,
  type SyncRunStatus,
} from "./sync-runs"

const MAX_STORED_PROBLEM_KEYS = 40_000
const LOCKS_COLLECTION = "cf_sync_locks"

export type CodeforcesSyncTrigger = "link" | "manual" | "cron" | "auto"

export interface CodeforcesSyncResult {
  ok: boolean
  skipped?:
    | "fallback"
    | "locked"
    | "lock_unavailable"
    | "lock_lost"
    | "not_linked"
    | "handle_changed"
    | "ineligible"
  error?: string
  code?: string
  syncedAt?: string
  runId?: string | null
  dataChanged?: boolean
}

class HandleChangedError extends Error {
  constructor() {
    super("The linked Codeforces handle changed during synchronization.")
    this.name = "HandleChangedError"
  }
}

class HandleTakenError extends Error {
  constructor() {
    super("This Codeforces handle is already linked to another trainee.")
    this.name = "HandleTakenError"
  }
}

class LockLostError extends Error {
  constructor() {
    super("The synchronization lock is no longer owned by this job.")
    this.name = "LockLostError"
  }
}

interface SyncLock {
  token: string
  expiresAtMs: number
}

type LockAcquisition =
  | { status: "acquired"; lock: SyncLock }
  | { status: "locked" }
  | { status: "unavailable" }

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string") return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function lockExpiryMs(data: Record<string, unknown> | undefined): number {
  if (!data) return 0
  if (typeof data.expiresAtMs === "number" && Number.isFinite(data.expiresAtMs)) {
    return data.expiresAtMs
  }
  const raw = data.expiresAt
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (
    raw !== null &&
    typeof raw === "object" &&
    "toMillis" in raw &&
    typeof (raw as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (raw as Timestamp).toMillis()
  }
  return 0
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function lockRetryDelay(attempt: number): number {
  const base = codeforcesLockRetryBaseMs()
  return base * 2 ** attempt + Math.floor(Math.random() * base)
}

async function acquireSyncLock(universityId: string): Promise<LockAcquisition> {
  if (!adminDb) return { status: "unavailable" }

  const db = adminDb
  const ref = db.collection(LOCKS_COLLECTION).doc(universityId)
  const retries = codeforcesLockAcquireRetries()
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const token = randomUUID()
    const now = Date.now()

    try {
      return await db.runTransaction<LockAcquisition>(async (transaction) => {
        const snapshot = await transaction.get(ref)
        const data = snapshot.exists ? snapshot.data() : undefined

        if (lockExpiryMs(data) > now) {
          return { status: "locked" }
        }

        const expiresAtMs = now + codeforcesSyncLockTtlMs()
        transaction.set(ref, {
          token,
          jobId: token,
          lockedAt: new Date(now).toISOString(),
          heartbeatAt: new Date(now).toISOString(),
          expiresAt: Timestamp.fromMillis(expiresAtMs),
          expiresAtMs,
        })

        return { status: "acquired", lock: { token, expiresAtMs } }
      })
    } catch (error) {
      lastError = error
      if (attempt < retries) await sleep(lockRetryDelay(attempt))
    }
  }

  console.error("Failed to acquire Codeforces sync lock", { universityId, error: lastError })
  return { status: "unavailable" }
}

export async function renewCodeforcesSyncLock(
  universityId: string,
  token: string
): Promise<boolean> {
  if (!adminDb) return false

  const db = adminDb
  const ref = db.collection(LOCKS_COLLECTION).doc(universityId)

  try {
    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists) return false

      const data = snapshot.data() as Record<string, unknown>
      const now = Date.now()
      if (data.token !== token) return false
      if (lockExpiryMs(data) <= now) return false

      transaction.set(
        ref,
        {
          expiresAt: Timestamp.fromMillis(now + codeforcesSyncLockTtlMs()),
          expiresAtMs: now + codeforcesSyncLockTtlMs(),
          heartbeatAt: new Date(now).toISOString(),
        },
        { merge: true }
      )
      return true
    })
  } catch (error) {
    console.error("Failed to renew Codeforces sync lock", { universityId, error })
    return false
  }
}

interface Heartbeat {
  stop: () => void
  lost: () => boolean
}

function startHeartbeat(universityId: string, token: string): Heartbeat {
  let active = true
  let lost = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const schedule = () => {
    if (!active) return
    timer = setTimeout(async () => {
      if (!active) return
      const renewed = await renewCodeforcesSyncLock(universityId, token)
      if (!renewed) {
        lost = true
        active = false
        return
      }
      schedule()
    }, codeforcesLockHeartbeatMs())
    timer.unref?.()
  }

  schedule()

  return {
    stop: () => {
      active = false
      if (timer) clearTimeout(timer)
    },
    lost: () => lost,
  }
}

async function releaseSyncLock(universityId: string, token: string): Promise<void> {
  if (!adminDb) return

  const ref = adminDb.collection(LOCKS_COLLECTION).doc(universityId)
  try {
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      if (snapshot.exists && snapshot.data()?.token === token) {
        transaction.delete(ref)
      }
    })
  } catch (error) {
    console.error("Failed to release Codeforces sync lock", { universityId, error })
  }
}

async function assertLockOwned(
  transaction: Transaction,
  lockRef: DocumentReference,
  token: string
): Promise<void> {
  const snapshot = await transaction.get(lockRef)
  if (!snapshot.exists) throw new LockLostError()

  const data = snapshot.data() as Record<string, unknown>
  if (data.token !== token) throw new LockLostError()
  if (lockExpiryMs(data) <= Date.now()) throw new LockLostError()
}

async function recordSyncFailure(
  universityId: string,
  token: string,
  message: string,
  attemptedAt: string,
  expectedHandleKey: string
): Promise<void> {
  if (!adminDb) return

  const db = adminDb
  const ref = db.collection("trainees").doc(universityId)
  const lockRef = db.collection(LOCKS_COLLECTION).doc(universityId)

  try {
    await db.runTransaction(async (transaction) => {
      await assertLockOwned(transaction, lockRef, token)
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists) return
      const currentHandle = normalizeCodeforcesHandle(
        (snapshot.data() as TraineeDocument).codeforcesHandle
      )
      if (!currentHandle || codeforcesHandleKey(currentHandle) !== expectedHandleKey) {
        return
      }
      transaction.update(ref, {
        cfSyncStatus: "failed",
        cfSyncError: message,
        cfSyncAttemptedAt: attemptedAt,
        cfNextSyncAt: new Date(Date.now() + codeforcesRetryDelayMs()).toISOString(),
      })
    })
  } catch (error) {
    if (error instanceof LockLostError) return
    console.error("Failed to record Codeforces sync failure", { universityId, error })
  }
}

function safeSyncError(error: unknown): { message: string; code: SyncRunErrorCode } {
  if (error instanceof CodeforcesApiError) {
    const code =
      error.code === "not_found"
        ? "codeforces_not_found"
        : error.code === "rate_limited"
          ? "codeforces_rate_limited"
          : error.code === "invalid_response"
            ? "codeforces_invalid_response"
            : error.code === "timeout"
              ? "codeforces_timeout"
              : error.code === "coordination_unavailable"
                ? "rate_limit_unavailable"
                : "codeforces_unavailable"
    return { message: error.userMessage, code }
  }
  if (error instanceof HandleTakenError) {
    return { message: error.message, code: "handle_conflict" }
  }
  if (error instanceof HandleChangedError) {
    return { message: error.message, code: "handle_changed" }
  }
  if (error instanceof LockLostError) {
    return { message: error.message, code: "lock_contended" }
  }
  return {
    message: "Codeforces synchronization failed. The last successful data was kept.",
    code: "unexpected",
  }
}

/**
 * Synchronize one trainee. The Firestore lock is a fencing token: every
 * protected write verifies ownership and expiry in the same transaction as the
 * write, so a job that loses its lock can never overwrite newer results.
 */
export async function syncTraineeCodeforces(
  universityId: string,
  options: { trigger?: CodeforcesSyncTrigger } = {}
): Promise<CodeforcesSyncResult> {
  if (!adminDb) {
    return {
      ok: false,
      skipped: "fallback",
      error: "Codeforces synchronization is unavailable in development fallback mode.",
    }
  }

  const trigger = options.trigger ?? "manual"
  const jobId = randomUUID()
  const acquired = await acquireSyncLock(universityId)

  if (acquired.status !== "acquired") {
    const runId = await startSyncRun({ trigger, traineeId: universityId, jobId })
    await finishSyncRun(runId, {
      status: "skipped",
      errorCode: acquired.status === "locked" ? "lock_contended" : "lock_unavailable",
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      summary:
        acquired.status === "locked"
          ? "Another synchronization job owns the lock."
          : "The synchronization lock could not be acquired.",
    })

    if (acquired.status === "locked") {
      return {
        ok: false,
        skipped: "locked",
        error: "A synchronization is already running for this account.",
        code: "lock_contended",
        runId,
      }
    }

    return {
      ok: false,
      skipped: "lock_unavailable",
      error: "Synchronization coordination is temporarily unavailable. Try again shortly.",
      code: "lock_unavailable",
      runId,
    }
  }

  const { token } = acquired.lock
  const startedAt = Date.now()
  const attemptedAt = new Date().toISOString()
  const runId = await startSyncRun({ trigger, traineeId: universityId, jobId: token })
  const heartbeat = startHeartbeat(universityId, token)
  let finalStatus: SyncRunStatus = "failed"
  let finalErrorCode: SyncRunErrorCode | null = "unexpected"
  let dataChanged: boolean | null = null
  let summary: string | null = null

  try {
    const traineeRef = adminDb.collection("trainees").doc(universityId)
    const lockRef = adminDb.collection(LOCKS_COLLECTION).doc(universityId)
    const snapshot = await traineeRef.get()
    if (!snapshot.exists) {
      finalStatus = "skipped"
      finalErrorCode = "not_linked"
      summary = "Trainee record was not found."
      return {
        ok: false,
        skipped: "not_linked",
        error: "Trainee record was not found.",
        code: "not_linked",
        runId,
      }
    }

    const trainee = snapshot.data() as TraineeDocument
    if (trigger === "cron" && trainee.status !== "active") {
      finalStatus = "skipped"
      finalErrorCode = "ineligible"
      summary = "Trainee is not active."
      return { ok: false, skipped: "ineligible", error: "Trainee is not active.", runId }
    }

    const handle = normalizeCodeforcesHandle(trainee.codeforcesHandle)
    if (!handle) {
      finalStatus = "skipped"
      finalErrorCode = "not_linked"
      summary = "No Codeforces handle is linked."
      return {
        ok: false,
        skipped: "not_linked",
        error: "No Codeforces handle is linked to this trainee.",
        runId,
      }
    }

    try {
      const info = await fetchCodeforcesUserInfo(handle)
      const newKey = codeforcesHandleKey(info.handle)
      const oldKey = codeforcesHandleKey(handle)
      const sameHandle = oldKey === newKey
      const now = new Date().toISOString()
      const newRegistryRef = adminDb.collection("codeforces_links").doc(newKey)
      const oldRegistryRef = adminDb.collection("codeforces_links").doc(oldKey)

      await adminDb.runTransaction(async (transaction) => {
        await assertLockOwned(transaction, lockRef, token)

        const freshSnapshot = await transaction.get(traineeRef)
        if (!freshSnapshot.exists) throw new HandleChangedError()
        const fresh = freshSnapshot.data() as TraineeDocument
        const freshHandle = normalizeCodeforcesHandle(fresh.codeforcesHandle)
        if (!freshHandle || codeforcesHandleKey(freshHandle) !== oldKey) {
          throw new HandleChangedError()
        }

        const newRegistrySnapshot = await transaction.get(newRegistryRef)
        const newRegistry = newRegistrySnapshot.exists
          ? newRegistrySnapshot.data()
          : undefined
        if (newRegistry && newRegistry.universityId !== universityId) {
          throw new HandleTakenError()
        }

        const oldRegistrySnapshot =
          oldKey !== newKey ? await transaction.get(oldRegistryRef) : null

        const update: UpdateData<TraineeDocument> = {
          codeforcesHandle: info.handle,
          codeforcesHandleLower: newKey,
          cfHandleVerified: true,
          cfRating: info.rating,
          cfMaxRating: info.maxRating,
          cfSyncAttemptedAt: attemptedAt,
          updatedAt: now,
        }

        if (!sameHandle) {
          update.cfSolvedCount = null
          update.cfSolvedProblemKeys = []
          update.cfLastSubmissionId = null
          update.cfLastSyncedAt = null
          update.cfSyncStatus = "never"
          update.cfSyncError = null
        }

        transaction.update(traineeRef, update)
        transaction.set(
          newRegistryRef,
          {
            universityId,
            handle: info.handle,
            createdAt:
              typeof newRegistry?.createdAt === "string" ? newRegistry.createdAt : now,
            updatedAt: now,
          },
          { merge: true }
        )

        if (
          oldRegistrySnapshot?.exists &&
          oldRegistrySnapshot.data()?.universityId === universityId
        ) {
          transaction.delete(oldRegistryRef)
        }
      })

      const previousKeys =
        sameHandle && Array.isArray(trainee.cfSolvedProblemKeys)
          ? trainee.cfSolvedProblemKeys.filter(
              (key): key is string => typeof key === "string"
            )
          : []
      const previousLastSubmissionId =
        sameHandle && typeof trainee.cfLastSubmissionId === "number"
          ? trainee.cfLastSubmissionId
          : null

      const solved = await fetchCodeforcesSolvedProblems(info.handle, {
        problemKeys: previousKeys,
        lastSubmissionId: previousLastSubmissionId,
      })
      const syncedAt = new Date().toISOString()
      const storeKeys = solved.problemKeys.length <= MAX_STORED_PROBLEM_KEYS
      const changed =
        !sameHandle ||
        info.rating !== (trainee.cfRating ?? null) ||
        info.maxRating !== (trainee.cfMaxRating ?? null) ||
        solved.solvedCount !== previousKeys.length ||
        solved.lastSubmissionId !== previousLastSubmissionId

      await adminDb.runTransaction(async (transaction) => {
        await assertLockOwned(transaction, lockRef, token)

        const freshSnapshot = await transaction.get(traineeRef)
        if (!freshSnapshot.exists) throw new HandleChangedError()
        const fresh = freshSnapshot.data() as TraineeDocument
        const freshHandle = normalizeCodeforcesHandle(fresh.codeforcesHandle)
        if (!freshHandle || codeforcesHandleKey(freshHandle) !== newKey) {
          throw new HandleChangedError()
        }

        transaction.update(traineeRef, {
          codeforcesHandle: info.handle,
          codeforcesHandleLower: newKey,
          cfHandleVerified: true,
          cfRating: info.rating,
          cfMaxRating: info.maxRating,
          cfSolvedCount: solved.solvedCount,
          cfSolvedProblemKeys: storeKeys ? solved.problemKeys : [],
          cfLastSubmissionId: storeKeys ? solved.lastSubmissionId : null,
          cfLastSyncedAt: syncedAt,
          cfSyncAttemptedAt: attemptedAt,
          cfSyncStatus: "success",
          cfSyncError: null,
          cfNextSyncAt: new Date(Date.now() + codeforcesSyncIntervalMs()).toISOString(),
          updatedAt: syncedAt,
        })
      })

      finalStatus = changed ? "success" : "no_changes"
      finalErrorCode = null
      dataChanged = changed
      summary = changed
        ? "Codeforces data synchronized with changes."
        : "Codeforces data synchronized with no changes."

      return { ok: true, syncedAt, runId, dataChanged: changed }
    } catch (error) {
      if (error instanceof HandleChangedError) {
        finalStatus = "skipped"
        finalErrorCode = "handle_changed"
        summary = "The linked handle changed during synchronization."
        return {
          ok: false,
          skipped: "handle_changed",
          error: "The linked Codeforces handle changed. Refresh and retry.",
          code: "handle_changed",
          runId,
        }
      }

      if (error instanceof LockLostError) {
        finalStatus = "lock_lost"
        finalErrorCode = "lock_contended"
        summary = "The synchronization lock was lost; final writes were rejected."
        return {
          ok: false,
          skipped: "lock_lost",
          error: "Synchronization ownership was lost. The next run will retry.",
          code: "lock_contended",
          runId,
        }
      }

      const safe = safeSyncError(error)
      await recordSyncFailure(
        universityId,
        token,
        safe.message,
        attemptedAt,
        codeforcesHandleKey(handle)
      )

      if (error instanceof HandleTakenError) {
        await recordAuditEvent({
          type: "codeforces.handle_conflict",
          actorType: "system",
          targetType: "trainee",
          targetId: universityId,
          outcome: "rejected",
          detail: "handle_conflict",
        })
      }

      finalStatus = "failed"
      finalErrorCode = safe.code
      summary = safe.message
      if (!(error instanceof HandleTakenError) && !(error instanceof CodeforcesApiError)) {
        console.error("Unexpected Codeforces sync failure", { universityId, error })
      }
      return { ok: false, error: safe.message, code: safe.code, runId }
    }
  } catch (error) {
    finalStatus = "failed"
    finalErrorCode = "unexpected"
    summary = "Unexpected synchronization failure."
    console.error("Codeforces synchronization error", { universityId, error })
    return {
      ok: false,
      error: "Codeforces synchronization failed. The last successful data was kept.",
      code: "unexpected",
      runId,
    }
  } finally {
    heartbeat.stop()
    await finishSyncRun(runId, {
      status: finalStatus,
      errorCode: finalErrorCode,
      dataChanged,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      summary,
    })
    await releaseSyncLock(universityId, token)
  }
}

export interface CodeforcesBatchSyncResult {
  processed: number
  synced: number
  failed: number
  skipped: number
  selected: number
  lockContention: number
  stoppedBy: "batch_cap" | "time_budget" | "drained" | "fallback"
  remainingDue: number | null
  durationMs: number
}

export interface SyncBatchOptions {
  limit?: number
  timeBudgetMs?: number
  minAttemptMs?: number
  now?: number
}

/**
 * Process due accounts oldest-first within a bounded time budget. There is no
 * separate cursor: `cfNextSyncAt` is only advanced after a successful write,
 * so an interrupted invocation leaves unfinished accounts due for the next
 * run. Lock contention also leaves the account due.
 */
export async function syncDueCodeforcesAccounts(
  options: number | SyncBatchOptions = {}
): Promise<CodeforcesBatchSyncResult> {
  const normalized: SyncBatchOptions =
    typeof options === "number" ? { limit: options } : options
  const limit = normalized.limit ?? codeforcesCronBatchSize()
  const timeBudgetMs = normalized.timeBudgetMs ?? codeforcesCronTimeBudgetMs()
  const minAttemptMs = normalized.minAttemptMs ?? codeforcesCronMinAttemptMs()
  const startedAt = normalized.now ?? Date.now()
  const deadline = startedAt + timeBudgetMs

  const result: CodeforcesBatchSyncResult = {
    processed: 0,
    synced: 0,
    failed: 0,
    skipped: 0,
    selected: 0,
    lockContention: 0,
    stoppedBy: "drained",
    remainingDue: null,
    durationMs: 0,
  }

  if (!adminDb) {
    return { ...result, stoppedBy: "fallback" }
  }

  const now = startedAt
  const nowIso = new Date(now).toISOString()
  const scanLimit = codeforcesCronScanLimit()
  const candidates = new Map<string, number>()

  try {
    const dueSnapshot = await adminDb
      .collection("trainees")
      .where("cfNextSyncAt", "<=", nowIso)
      .orderBy("cfNextSyncAt", "asc")
      .limit(scanLimit)
      .get()
    for (const doc of dueSnapshot.docs) {
      const data = doc.data() as TraineeDocument
      candidates.set(doc.id, parseTimestamp(data.cfNextSyncAt) ?? 0)
    }
  } catch (error) {
    console.error("Failed to query due Codeforces syncs", error)
  }

  try {
    const activeSnapshot = await adminDb
      .collection("trainees")
      .where("status", "==", "active")
      .limit(scanLimit)
      .get()

    for (const doc of activeSnapshot.docs) {
      const data = doc.data() as TraineeDocument
      if (!data.codeforcesHandle) continue
      const nextSyncAt = parseTimestamp(data.cfNextSyncAt)
      if (nextSyncAt !== null && nextSyncAt > now) continue
      candidates.set(doc.id, nextSyncAt ?? 0)
    }
  } catch (error) {
    console.error("Failed to query active Codeforces accounts", error)
  }

  const ordered = [...candidates.entries()].sort((left, right) => left[1] - right[1])
  result.selected = ordered.length

  for (const [universityId] of ordered) {
    if (result.processed >= limit) {
      result.stoppedBy = "batch_cap"
      break
    }

    if (Date.now() + minAttemptMs > deadline) {
      result.stoppedBy = "time_budget"
      break
    }

    result.processed += 1
    try {
      const syncResult = await syncTraineeCodeforces(universityId, { trigger: "cron" })
      if (syncResult.ok) {
        result.synced += 1
      } else if (syncResult.skipped === "locked") {
        result.skipped += 1
        result.lockContention += 1
      } else if (syncResult.skipped) {
        result.skipped += 1
      } else {
        result.failed += 1
      }
    } catch (error) {
      console.error("Codeforces batch item failed", { universityId, error })
      result.failed += 1
    }
  }

  if (result.stoppedBy === "drained" && result.processed < ordered.length) {
    result.stoppedBy = "batch_cap"
  }

  try {
    const remaining = await adminDb
      .collection("trainees")
      .where("cfNextSyncAt", "<=", new Date().toISOString())
      .count()
      .get()
    result.remainingDue = remaining.data().count
  } catch {
    result.remainingDue = null
  }

  result.durationMs = Date.now() - startedAt
  return result
}
