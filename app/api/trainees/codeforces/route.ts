import { NextResponse } from "next/server"
import type { UpdateData } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { CodeforcesApiError, fetchCodeforcesUserInfo } from "@/lib/codeforces/client"
import {
  codeforcesHandleKey,
  normalizeCodeforcesHandle,
} from "@/lib/codeforces/handle"
import { syncTraineeCodeforces } from "@/lib/codeforces/sync"
import { toCodeforcesAccountView } from "@/lib/codeforces/status"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { getTraineeStandings } from "@/lib/leaderboard"
import { rejectCrossOrigin, requireTrainee } from "@/lib/api-auth"
import { toTraineeDashboard } from "@/lib/trainee-profile"
import {
  RateLimitUnavailableError,
  consumeRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit"
import { readTraineeSessionCookie } from "@/lib/trainee-session"

export const runtime = "nodejs"

class TraineeNotFoundError extends Error {}
class HandleTakenError extends Error {}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function fallbackUnavailable() {
  return noStore(
    NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Codeforces account management needs a configured database.",
      },
      { status: 503 }
    )
  )
}

export async function GET(req: Request) {
  if (!adminDb && readTraineeSessionCookie(req)) return fallbackUnavailable()
  const authenticated = await requireTrainee(req)
  if (!authenticated.ok) return authenticated.response
  const session = authenticated.auth
  if (!adminDb) return fallbackUnavailable()

  try {
    const snapshot = await adminDb.collection("trainees").doc(session.traineeId).get()
    if (!snapshot.exists) {
      return noStore(
        NextResponse.json(
          { success: false, error: "Trainee record was not found." },
          { status: 404 }
        )
      )
    }

    const dashboard = toTraineeDashboard(snapshot.data() as TraineeDocument)
    const standings = await getTraineeStandings(session.traineeId)

    return noStore(
      NextResponse.json({
        success: true,
        ...dashboard,
        standings,
      })
    )
  } catch (error) {
    console.error("Codeforces account fetch error:", error)
    return noStore(
      NextResponse.json(
        { success: false, error: "Failed to load the linked account." },
        { status: 500 }
      )
    )
  }
}

export async function PUT(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  if (!adminDb && readTraineeSessionCookie(req)) return fallbackUnavailable()
  const authenticated = await requireTrainee(req)
  if (!authenticated.ok) return authenticated.response
  const session = authenticated.auth
  if (!adminDb) return fallbackUnavailable()

  const db = adminDb

  try {
    try {
      const limit = await consumeRateLimit({
        key: rateLimitKey("codeforces", "link", session.uid),
        limit: 10,
        windowSeconds: 60 * 60,
      })
      if (!limit.allowed) {
        const response = NextResponse.json(
          {
            success: false,
            error: "Too many handle changes. Try again later.",
            retryAfterSeconds: limit.retryAfterSeconds,
          },
          { status: 429 }
        )
        response.headers.set("Retry-After", String(limit.retryAfterSeconds))
        return noStore(response)
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return noStore(
          NextResponse.json(
            { success: false, error: "Handle linking is temporarily unavailable." },
            { status: 503 }
          )
        )
      }
      throw error
    }

    const body = asObject(await readJsonBody(req))
    const handle = normalizeCodeforcesHandle(body.handle)
    if (!handle) {
      return noStore(
        NextResponse.json(
          {
            success: false,
            error:
              "Enter a valid Codeforces handle (3-24 letters, numbers, underscores, dots or hyphens).",
          },
          { status: 400 }
        )
      )
    }

    let info
    try {
      info = await fetchCodeforcesUserInfo(handle)
    } catch (error) {
      if (error instanceof CodeforcesApiError) {
        const status =
          error.code === "not_found"
            ? 404
            : error.code === "rate_limited"
              ? 429
              : error.code === "invalid_response"
                ? 502
                : 503
        return noStore(
          NextResponse.json({ success: false, error: error.userMessage }, { status })
        )
      }
      throw error
    }

    const newKey = codeforcesHandleKey(info.handle)
    const newRegistryRef = db.collection("codeforces_links").doc(newKey)
    const registrySnapshot = await newRegistryRef.get()
    if (
      registrySnapshot.exists &&
      registrySnapshot.data()?.universityId !== session.traineeId
    ) {
      return noStore(
        NextResponse.json(
          {
            success: false,
            error: "This Codeforces handle is already linked to another trainee.",
          },
          { status: 409 }
        )
      )
    }

    const traineeRef = db.collection("trainees").doc(session.traineeId)
    const now = new Date().toISOString()

    await db.runTransaction(async (transaction) => {
      const traineeSnapshot = await transaction.get(traineeRef)
      if (!traineeSnapshot.exists) throw new TraineeNotFoundError()

      const trainee = traineeSnapshot.data() as TraineeDocument
      const oldHandle = normalizeCodeforcesHandle(trainee.codeforcesHandle)
      const oldKey = oldHandle ? codeforcesHandleKey(oldHandle) : null
      const sameHandle = oldKey === newKey
      const oldRegistryRef = oldKey ? db.collection("codeforces_links").doc(oldKey) : null

      const freshRegistrySnapshot = await transaction.get(newRegistryRef)
      const freshRegistry = freshRegistrySnapshot.exists
        ? freshRegistrySnapshot.data()
        : undefined
      if (freshRegistry && freshRegistry.universityId !== session.traineeId) {
        throw new HandleTakenError()
      }
      const oldRegistrySnapshot =
        oldRegistryRef && oldKey !== newKey ? await transaction.get(oldRegistryRef) : null

      const update: UpdateData<TraineeDocument> = {
        codeforcesHandle: info.handle,
        codeforcesHandleLower: newKey,
        cfHandleVerified: true,
        cfRating: info.rating,
        cfMaxRating: info.maxRating,
        cfSyncAttemptedAt: null,
        cfSyncError: null,
        cfNextSyncAt: now,
        updatedAt: now,
      }

      if (!sameHandle) {
        update.cfSolvedCount = null
        update.cfSolvedProblemKeys = []
        update.cfLastSubmissionId = null
        update.cfLastSyncedAt = null
        update.cfSyncStatus = "never"
      }

      transaction.update(traineeRef, update)
      transaction.set(
        newRegistryRef,
        {
          universityId: session.traineeId,
          handle: info.handle,
          createdAt:
            typeof freshRegistry?.createdAt === "string" ? freshRegistry.createdAt : now,
          updatedAt: now,
        },
        { merge: true }
      )

      if (
        oldRegistrySnapshot?.exists &&
        oldRegistrySnapshot.data()?.universityId === session.traineeId
      ) {
        transaction.delete(oldRegistryRef!)
      }
    })

    const sync = await syncTraineeCodeforces(session.traineeId, { trigger: "link" })
    const updatedSnapshot = await traineeRef.get()
    if (!updatedSnapshot.exists) throw new TraineeNotFoundError()

    return noStore(
      NextResponse.json({
        success: true,
        codeforces: toCodeforcesAccountView(updatedSnapshot.data() as TraineeDocument),
        sync: sync.ok
          ? { ok: true, syncedAt: sync.syncedAt }
          : { ok: false, error: sync.error, skipped: sync.skipped },
      })
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return noStore(
        NextResponse.json({ success: false, error: error.message }, { status: error.status })
      )
    }
    if (error instanceof TraineeNotFoundError) {
      return noStore(
        NextResponse.json(
          { success: false, error: "Trainee record was not found." },
          { status: 404 }
        )
      )
    }
    if (error instanceof HandleTakenError) {
      return noStore(
        NextResponse.json(
          { success: false, error: "This Codeforces handle is already linked to another trainee." },
          { status: 409 }
        )
      )
    }
    console.error("Codeforces link error:", error)
    return noStore(
      NextResponse.json(
        { success: false, error: "Failed to link the Codeforces account." },
        { status: 500 }
      )
    )
  }
}

export async function DELETE(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  if (!adminDb && readTraineeSessionCookie(req)) return fallbackUnavailable()
  const authenticated = await requireTrainee(req)
  if (!authenticated.ok) return authenticated.response
  const session = authenticated.auth
  if (!adminDb) return fallbackUnavailable()

  const db = adminDb

  try {
    const traineeRef = db.collection("trainees").doc(session.traineeId)
    let clearedView = toCodeforcesAccountView({})

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(traineeRef)
      if (!snapshot.exists) throw new TraineeNotFoundError()

      const trainee = snapshot.data() as TraineeDocument
      const handle = normalizeCodeforcesHandle(trainee.codeforcesHandle)
      const registryRef = handle
        ? db.collection("codeforces_links").doc(codeforcesHandleKey(handle))
        : null
      const registrySnapshot = registryRef ? await transaction.get(registryRef) : null
      const now = new Date().toISOString()

      const cleared = {
        ...trainee,
        codeforcesHandle: "",
        codeforcesHandleLower: "",
        cfHandleVerified: false,
        cfRating: null,
        cfMaxRating: null,
        cfSolvedCount: null,
        cfSolvedProblemKeys: [],
        cfLastSubmissionId: null,
        cfLastSyncedAt: null,
        cfSyncAttemptedAt: null,
        cfNextSyncAt: null,
        cfSyncStatus: "never" as const,
        cfSyncError: null,
        updatedAt: now,
      }
      clearedView = toCodeforcesAccountView(cleared)

      transaction.update(traineeRef, {
        codeforcesHandle: "",
        codeforcesHandleLower: "",
        cfHandleVerified: false,
        cfRating: null,
        cfMaxRating: null,
        cfSolvedCount: null,
        cfSolvedProblemKeys: [],
        cfLastSubmissionId: null,
        cfLastSyncedAt: null,
        cfSyncAttemptedAt: null,
        cfNextSyncAt: null,
        cfSyncStatus: "never",
        cfSyncError: null,
        updatedAt: now,
      })

      if (
        registryRef &&
        registrySnapshot?.exists &&
        registrySnapshot.data()?.universityId === session.traineeId
      ) {
        transaction.delete(registryRef)
      }
    })

    return noStore(NextResponse.json({ success: true, codeforces: clearedView }))
  } catch (error) {
    if (error instanceof TraineeNotFoundError) {
      return noStore(
        NextResponse.json(
          { success: false, error: "Trainee record was not found." },
          { status: 404 }
        )
      )
    }
    console.error("Codeforces disconnect error:", error)
    return noStore(
      NextResponse.json(
        { success: false, error: "Failed to disconnect the Codeforces account." },
        { status: 500 }
      )
    )
  }
}

export const dynamic = "force-dynamic"
