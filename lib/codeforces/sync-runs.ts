import { adminDb } from "@/lib/firebase-admin"
import type { CodeforcesSyncTrigger } from "@/lib/codeforces/sync"

export type SyncRunStatus =
  | "running"
  | "success"
  | "no_changes"
  | "failed"
  | "skipped"
  | "lock_lost"
  | "time_budget"
  | "aborted"

export type SyncRunErrorCode =
  | "lock_contended"
  | "lock_unavailable"
  | "rate_limit_unavailable"
  | "codeforces_not_found"
  | "codeforces_rate_limited"
  | "codeforces_unavailable"
  | "codeforces_invalid_response"
  | "codeforces_timeout"
  | "handle_conflict"
  | "handle_changed"
  | "invalid_handle"
  | "not_linked"
  | "ineligible"
  | "firestore_error"
  | "unexpected"

export interface SyncRunPatch {
  status?: SyncRunStatus
  errorCode?: SyncRunErrorCode | null
  dataChanged?: boolean | null
  finishedAt?: string | null
  durationMs?: number | null
  summary?: string | null
}

export interface SyncRunDocument {
  id: string
  trigger: CodeforcesSyncTrigger
  traineeId: string
  startedAt: string
  finishedAt: string | null
  status: SyncRunStatus
  errorCode: SyncRunErrorCode | null
  dataChanged: boolean | null
  durationMs: number | null
  jobId: string
  summary: string | null
}

const SYNC_RUNS_COLLECTION = "sync_runs"

export async function startSyncRun(input: {
  trigger: CodeforcesSyncTrigger
  traineeId: string
  jobId: string
}): Promise<string | null> {
  if (!adminDb) return null

  try {
    const ref = adminDb.collection(SYNC_RUNS_COLLECTION).doc()
    await ref.set({
      trigger: input.trigger,
      traineeId: input.traineeId,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: "running" satisfies SyncRunStatus,
      errorCode: null,
      dataChanged: null,
      durationMs: null,
      jobId: input.jobId,
      summary: null,
    })
    return ref.id
  } catch (error) {
    console.error("Failed to start sync run record", { traineeId: input.traineeId, error })
    return null
  }
}

export async function finishSyncRun(runId: string | null, patch: SyncRunPatch): Promise<void> {
  if (!runId || !adminDb) return

  try {
    await adminDb
      .collection(SYNC_RUNS_COLLECTION)
      .doc(runId)
      .set({ ...patch }, { merge: true })
  } catch (error) {
    console.error("Failed to finish sync run record", { runId, error })
  }
}

export async function listRecentSyncRuns(limit = 50): Promise<SyncRunDocument[]> {
  if (!adminDb) return []

  const snapshot = await adminDb
    .collection(SYNC_RUNS_COLLECTION)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      trigger: data.trigger as SyncRunDocument["trigger"],
      traineeId: typeof data.traineeId === "string" ? data.traineeId : "",
      startedAt: typeof data.startedAt === "string" ? data.startedAt : "",
      finishedAt: typeof data.finishedAt === "string" ? data.finishedAt : null,
      status: data.status as SyncRunDocument["status"],
      errorCode:
        typeof data.errorCode === "string"
          ? (data.errorCode as SyncRunDocument["errorCode"])
          : null,
      dataChanged: typeof data.dataChanged === "boolean" ? data.dataChanged : null,
      durationMs: typeof data.durationMs === "number" ? data.durationMs : null,
      jobId: typeof data.jobId === "string" ? data.jobId : "",
      summary: typeof data.summary === "string" ? data.summary : null,
    }
  })
}

/**
 * Bounded stale-run recovery. A serverless invocation can be terminated before
 * its `finally` block runs, so old "running" records are marked aborted when an
 * administrator reads the report. This never affects lock correctness.
 */
export async function markStaleSyncRuns(
  maxAgeMs = 15 * 60 * 1000,
  limit = 50
): Promise<number> {
  if (!adminDb) return 0

  const now = Date.now()
  const snapshot = await adminDb
    .collection(SYNC_RUNS_COLLECTION)
    .where("status", "==", "running")
    .limit(limit)
    .get()

  let marked = 0
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const startedAt = typeof data.startedAt === "string" ? Date.parse(data.startedAt) : Number.NaN
    if (!Number.isFinite(startedAt) || now - startedAt < maxAgeMs) continue

    try {
      await doc.ref.set(
        {
          status: "aborted" satisfies SyncRunStatus,
          errorCode: "unexpected" satisfies SyncRunErrorCode,
          finishedAt: new Date().toISOString(),
          durationMs: now - startedAt,
          summary: "The invocation ended before the run recorded completion.",
        },
        { merge: true }
      )
      marked += 1
    } catch (error) {
      console.error("Failed to mark stale sync run", { runId: doc.id, error })
    }
  }

  return marked
}
