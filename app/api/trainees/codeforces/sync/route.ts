import { NextResponse } from "next/server"
import { rejectCrossOrigin, requireTrainee } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { codeforcesManualCooldownMs } from "@/lib/codeforces/config"
import { syncTraineeCodeforces } from "@/lib/codeforces/sync"
import { toCodeforcesAccountView } from "@/lib/codeforces/status"
import { getTraineeStandings } from "@/lib/leaderboard"
import { readTraineeSessionCookie } from "@/lib/trainee-session"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  if (!adminDb && readTraineeSessionCookie(req)) {
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Codeforces synchronization needs a configured database.",
      },
      { status: 503 }
    )
  }

  const authenticated = await requireTrainee(req)
  if (!authenticated.ok) return authenticated.response
  const session = authenticated.auth

  if (!adminDb) {
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Codeforces synchronization needs a configured database.",
      },
      { status: 503 }
    )
  }

  try {
    const traineeRef = adminDb.collection("trainees").doc(session.traineeId)
    const snapshot = await traineeRef.get()
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Trainee record was not found." },
        { status: 404 }
      )
    }

    const trainee = snapshot.data() as TraineeDocument
    if (!trainee.codeforcesHandle) {
      return NextResponse.json(
        { success: false, error: "Link a Codeforces account before refreshing data." },
        { status: 409 }
      )
    }

    const attemptedAt =
      typeof trainee.cfSyncAttemptedAt === "string"
        ? Date.parse(trainee.cfSyncAttemptedAt)
        : Number.NaN
    if (Number.isFinite(attemptedAt)) {
      const remaining = codeforcesManualCooldownMs() - (Date.now() - attemptedAt)
      if (remaining > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Please wait before refreshing Codeforces data again.",
            retryAfterSeconds: Math.ceil(remaining / 1000),
          },
          { status: 429 }
        )
      }
    }

    const result = await syncTraineeCodeforces(session.traineeId, { trigger: "manual" })
    const updatedSnapshot = await traineeRef.get()
    if (!updatedSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Trainee record was not found." },
        { status: 404 }
      )
    }

    if (
      !result.ok &&
      (result.code === "rate_limit_unavailable" || result.code === "lock_unavailable")
    ) {
      const response = NextResponse.json(
        {
          success: false,
          error: result.error || "Synchronization coordination is temporarily unavailable.",
          code: result.code,
          retryAfterSeconds: 10,
        },
        { status: 503 }
      )
      response.headers.set("Retry-After", "10")
      response.headers.set("Cache-Control", "no-store")
      return response
    }

    const standings = await getTraineeStandings(session.traineeId)
    const response = NextResponse.json({
      success: true,
      codeforces: toCodeforcesAccountView(updatedSnapshot.data() as TraineeDocument),
      standings,
      sync: result.ok
        ? { ok: true, syncedAt: result.syncedAt, dataChanged: result.dataChanged }
        : {
            ok: false,
            error: result.error,
            skipped: result.skipped,
            code: result.code,
          },
    })
    response.headers.set("Cache-Control", "no-store")
    return response
  } catch (error) {
    console.error("Manual Codeforces sync error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to refresh Codeforces data." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
