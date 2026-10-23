import { FieldPath } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { recordAuditEvent } from "@/lib/audit"
import { codeforcesHandleKey, normalizeCodeforcesHandle } from "./handle"

type ReconcileIssueType =
  | "duplicate_handle"
  | "missing_registry"
  | "orphaned_registry"
  | "mismatched_ownership"
  | "invalid_handle"
  | "stale_handle_key"

interface ReconcileIssue {
  type: ReconcileIssueType
  handleKey: string | null
  traineeIds: string[]
  registryUniversityId?: string | null
  detail: string
}

export interface ReconcileReport {
  generatedAt: string
  dryRun: boolean
  scannedTrainees: number
  scannedRegistry: number
  issues: ReconcileIssue[]
  counts: Record<ReconcileIssueType, number>
  nextCursor: string | null
  hasMore: boolean
  truncated: boolean
}

export interface ReconcileOptions {
  cursor?: string | null
  pageSize?: number
  maxTrainees?: number
  maxRegistry?: number
  maxIssues?: number
  now?: number
}

function emptyCounts(): Record<ReconcileIssueType, number> {
  return {
    duplicate_handle: 0,
    missing_registry: 0,
    orphaned_registry: 0,
    mismatched_ownership: 0,
    invalid_handle: 0,
    stale_handle_key: 0,
  }
}

async function scanTrainees(options: Required<Pick<ReconcileOptions, "pageSize" | "maxTrainees" | "maxIssues">> & {
  cursor: string | null
  issues: ReconcileIssue[]
  counts: Record<ReconcileIssueType, number>
  handleOwners: Map<string, string[]>
}): Promise<{ scanned: number; nextCursor: string | null; hasMore: boolean }> {
  if (!adminDb) return { scanned: 0, nextCursor: null, hasMore: false }

  let cursor = options.cursor
  let scanned = 0
  let hasMore = false

  for (;;) {
    if (scanned >= options.maxTrainees) break

    const remaining = Math.min(
      options.pageSize,
      Math.max(1, options.maxTrainees - scanned)
    )
    let query = adminDb
      .collection("trainees")
      .orderBy(FieldPath.documentId())
      .limit(remaining)
    if (cursor) query = query.startAfter(cursor) as typeof query

    const snapshot = await query.get()
    if (snapshot.docs.length === 0) {
      hasMore = false
      break
    }

    for (const doc of snapshot.docs) {
      scanned += 1
      cursor = doc.id
      const trainee = doc.data() as TraineeDocument
      const rawHandle =
        typeof trainee.codeforcesHandle === "string" ? trainee.codeforcesHandle.trim() : ""
      if (!rawHandle) continue

      const normalized = normalizeCodeforcesHandle(rawHandle)
      if (!normalized) {
        options.counts.invalid_handle += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "invalid_handle",
            handleKey: null,
            traineeIds: [doc.id],
            detail: "Stored handle is not a valid Codeforces handle.",
          })
        }
        continue
      }

      const key = codeforcesHandleKey(normalized)
      const owners = options.handleOwners.get(key) ?? []
      owners.push(doc.id)
      options.handleOwners.set(key, owners)

      if (trainee.codeforcesHandleLower !== key) {
        options.counts.stale_handle_key += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "stale_handle_key",
            handleKey: key,
            traineeIds: [doc.id],
            detail: "codeforcesHandleLower is missing or does not match the stored handle.",
          })
        }
      }

      const registrySnapshot = await adminDb
        .collection("codeforces_links")
        .doc(key)
        .get()
      const registry = registrySnapshot.exists ? registrySnapshot.data() : undefined

      if (!registry) {
        options.counts.missing_registry += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "missing_registry",
            handleKey: key,
            traineeIds: [doc.id],
            detail: "Trainee handle has no codeforces_links registry entry.",
          })
        }
      } else if (registry.universityId !== doc.id) {
        options.counts.mismatched_ownership += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "mismatched_ownership",
            handleKey: key,
            traineeIds: [doc.id],
            registryUniversityId:
              typeof registry.universityId === "string" ? registry.universityId : null,
            detail: "Registry entry belongs to a different trainee.",
          })
        }
      }
    }

    hasMore = snapshot.docs.length === remaining
    if (snapshot.docs.length < remaining) {
      hasMore = false
      break
    }
  }

  return { scanned, nextCursor: hasMore ? cursor : null, hasMore }
}

async function scanRegistry(options: {
  pageSize: number
  maxRegistry: number
  maxIssues: number
  issues: ReconcileIssue[]
  counts: Record<ReconcileIssueType, number>
  seenKeys: Set<string>
}): Promise<number> {
  if (!adminDb) return 0

  let cursor: string | null = null
  let scanned = 0

  for (;;) {
    if (scanned >= options.maxRegistry) break
    const remaining = Math.min(
      options.pageSize,
      Math.max(1, options.maxRegistry - scanned)
    )
    let query = adminDb
      .collection("codeforces_links")
      .orderBy(FieldPath.documentId())
      .limit(remaining)
    if (cursor) query = query.startAfter(cursor) as typeof query

    const snapshot = await query.get()
    if (snapshot.docs.length === 0) break

    for (const doc of snapshot.docs) {
      scanned += 1
      cursor = doc.id
      options.seenKeys.add(doc.id)
      const registry = doc.data()
      const ownerId =
        typeof registry.universityId === "string" ? registry.universityId : ""

      if (!ownerId) {
        options.counts.orphaned_registry += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "orphaned_registry",
            handleKey: doc.id,
            traineeIds: [],
            detail: "Registry entry has no owning trainee id.",
          })
        }
        continue
      }

      const traineeSnapshot = await adminDb.collection("trainees").doc(ownerId).get()
      if (!traineeSnapshot.exists) {
        options.counts.orphaned_registry += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "orphaned_registry",
            handleKey: doc.id,
            traineeIds: [ownerId],
            detail: "Registry owner does not exist.",
          })
        }
        continue
      }

      const trainee = traineeSnapshot.data() as TraineeDocument
      const handle =
        typeof trainee.codeforcesHandle === "string"
          ? normalizeCodeforcesHandle(trainee.codeforcesHandle)
          : null
      const traineeKey = handle ? codeforcesHandleKey(handle) : null

      if (!traineeKey || traineeKey !== doc.id) {
        options.counts.mismatched_ownership += 1
        if (options.issues.length < options.maxIssues) {
          options.issues.push({
            type: "mismatched_ownership",
            handleKey: doc.id,
            traineeIds: [ownerId],
            registryUniversityId: ownerId,
            detail: "Trainee's current handle does not match this registry entry.",
          })
        }
      }
    }

    if (snapshot.docs.length < remaining) break
  }

  return scanned
}

export async function runCodeforcesReconciliation(
  options: ReconcileOptions = {}
): Promise<ReconcileReport> {
  if (!adminDb) {
    return {
      generatedAt: new Date().toISOString(),
      dryRun: true,
      scannedTrainees: 0,
      scannedRegistry: 0,
      issues: [],
      counts: emptyCounts(),
      nextCursor: null,
      hasMore: false,
      truncated: false,
    }
  }

  const pageSize = Math.min(Math.max(options.pageSize ?? 250, 1), 500)
  const maxTrainees = Math.min(Math.max(options.maxTrainees ?? 2000, 1), 10_000)
  const maxRegistry = Math.min(Math.max(options.maxRegistry ?? 1000, 1), 10_000)
  const maxIssues = Math.min(Math.max(options.maxIssues ?? 500, 1), 2000)

  const issues: ReconcileIssue[] = []
  const counts = emptyCounts()
  const handleOwners = new Map<string, string[]>()
  const seenKeys = new Set<string>()

  const trainees = await scanTrainees({
    pageSize,
    maxTrainees,
    maxIssues,
    cursor: options.cursor ?? null,
    issues,
    counts,
    handleOwners,
  })

  for (const [key, traineeIds] of handleOwners) {
    if (traineeIds.length <= 1) continue
    counts.duplicate_handle += 1
    if (issues.length < maxIssues) {
      issues.push({
        type: "duplicate_handle",
        handleKey: key,
        traineeIds,
        detail: "Multiple trainee records share the same normalized Codeforces handle.",
      })
    }
  }

  const scannedRegistry = await scanRegistry({
    pageSize,
    maxRegistry,
    maxIssues,
    issues,
    counts,
    seenKeys,
  })

  for (const issue of issues) {
    if (issue.type !== "missing_registry" || !issue.handleKey) continue
    if (seenKeys.has(issue.handleKey)) {
      counts.missing_registry = Math.max(0, counts.missing_registry - 1)
      issue.detail = "Registry entry exists but was created after the trainee scan."
    }
  }

  const totalIssues = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    scannedTrainees: trainees.scanned,
    scannedRegistry,
    issues,
    counts,
    nextCursor: trainees.nextCursor,
    hasMore: trainees.hasMore,
    truncated: totalIssues > issues.length,
  }
}

export class ReconcileConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReconcileConflictError"
  }
}

/**
 * Repairs only the unambiguous case: a trainee with a valid handle and no
 * competing registry owner. Conflicting ownership is never reassigned.
 */
export async function repairMissingRegistryEntry(input: {
  traineeId: string
  actorUid: string
  now?: string
}): Promise<{ repaired: boolean; handleKey: string | null; reason?: string }> {
  if (!adminDb) return { repaired: false, handleKey: null, reason: "unavailable" }

  const db = adminDb
  const traineeRef = db.collection("trainees").doc(input.traineeId)
  const snapshot = await traineeRef.get()
  if (!snapshot.exists) {
    return { repaired: false, handleKey: null, reason: "trainee_not_found" }
  }

  const trainee = snapshot.data() as TraineeDocument
  const handle = normalizeCodeforcesHandle(trainee.codeforcesHandle)
  if (!handle) {
    return { repaired: false, handleKey: null, reason: "invalid_handle" }
  }

  const key = codeforcesHandleKey(handle)
  const registryRef = db.collection("codeforces_links").doc(key)
  const now = input.now ?? new Date().toISOString()

  const repairs = await db.runTransaction(async (transaction) => {
    const [traineeSnapshot, registrySnapshot] = await Promise.all([
      transaction.get(traineeRef),
      transaction.get(registryRef),
    ])

    if (!traineeSnapshot.exists) throw new ReconcileConflictError("Trainee no longer exists.")

    const registry = registrySnapshot.exists ? registrySnapshot.data() : undefined
    if (registry && registry.universityId !== input.traineeId) {
      throw new ReconcileConflictError(
        "The handle registry belongs to another trainee; manual resolution is required."
      )
    }

    if (!registry) {
      transaction.set(registryRef, {
        universityId: input.traineeId,
        handle,
        createdAt: now,
        updatedAt: now,
        repairedAt: now,
        repairedBy: input.actorUid,
      })
    }

    const freshTrainee = traineeSnapshot.data() as TraineeDocument
    if (freshTrainee.codeforcesHandleLower !== key) {
      transaction.set(
        traineeRef,
        { codeforcesHandleLower: key, updatedAt: now },
        { merge: true }
      )
    }

    return !registry
  })

  await recordAuditEvent({
    type: "admin.codeforces_registry_repair",
    actorType: "admin",
    actorUid: input.actorUid,
    targetType: "codeforces_link",
    targetId: key,
    outcome: "success",
    detail: repairs ? "created_missing_entry" : "already_consistent",
    metadata: { traineeId: input.traineeId },
  })

  return { repaired: repairs, handleKey: key }
}
