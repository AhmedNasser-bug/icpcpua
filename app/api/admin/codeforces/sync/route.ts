import { NextResponse } from "next/server"
import { recordAuditEvent } from "@/lib/audit"
import { rejectCrossOrigin, requireAdmin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { syncTraineeCodeforces } from "@/lib/codeforces/sync"
import { toCodeforcesAccountView } from "@/lib/codeforces/status"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { normalizeUniversityId } from "@/lib/ids"
import {
  RateLimitUnavailableError,
  consumeRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 60

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  const admin = await requireAdmin(req)
  if (!admin.ok) return admin.response

  if (!adminDb) {
    return noStore(
      NextResponse.json(
        { success: false, simulated: true, error: "Administrative synchronization needs a database." },
        { status: 503 }
      )
    )
  }

  try {
    const body = asObject(await readJsonBody(req))
    const rawTraineeId = typeof body.traineeId === "string" ? body.traineeId.trim() : ""
    const traineeId = rawTraineeId ? normalizeUniversityId(rawTraineeId) : ""
    if (!traineeId) {
      return noStore(
        NextResponse.json({ success: false, error: "A valid traineeId is required." }, { status: 400 })
      )
    }

    try {
      const limit = await consumeRateLimit({
        key: rateLimitKey("admin", "sync", admin.auth.uid, traineeId),
        limit: 30,
        windowSeconds: 60 * 60,
      })
      if (!limit.allowed) {
        const response = NextResponse.json(
          { success: false, error: "Administrative sync rate limit exceeded." },
          { status: 429 }
        )
        response.headers.set("Retry-After", String(limit.retryAfterSeconds))
        return noStore(response)
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return noStore(
          NextResponse.json(
            { success: false, error: "Administrative synchronization is temporarily unavailable." },
            { status: 503 }
          )
        )
      }
      throw error
    }

    const ref = adminDb.collection("trainees").doc(traineeId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      return noStore(
        NextResponse.json({ success: false, error: "Trainee record was not found." }, { status: 404 })
      )
    }

    const result = await syncTraineeCodeforces(traineeId, { trigger: "manual" })

    await recordAuditEvent({
      type: "admin.codeforces_sync",
      actorType: "admin",
      actorUid: admin.auth.uid,
      targetType: "trainee",
      targetId: traineeId,
      outcome: result.ok ? "success" : "failed",
      detail: result.code ?? result.skipped ?? null,
    })

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
      return noStore(response)
    }

    const updated = await ref.get()
    const trainee = updated.exists ? (updated.data() as TraineeDocument) : null

    return noStore(
      NextResponse.json({
        success: true,
        sync: result,
        codeforces: trainee ? toCodeforcesAccountView(trainee) : null,
      })
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return noStore(
        NextResponse.json({ success: false, error: error.message }, { status: error.status })
      )
    }
    console.error("Administrative Codeforces sync error:", error)
    return noStore(
      NextResponse.json(
        { success: false, error: "Administrative synchronization failed." },
        { status: 500 }
      )
    )
  }
}

export const dynamic = "force-dynamic"
