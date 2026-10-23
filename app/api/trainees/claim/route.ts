import { NextResponse } from "next/server"
import { recordAuditEvent } from "@/lib/audit"
import { rejectCrossOrigin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { normalizeUniversityId } from "@/lib/ids"
import { claimCodeMatches } from "@/lib/legacy-claim"
import {
  RateLimitUnavailableError,
  consumeRateLimit,
  rateLimitKey,
  requestClientIp,
} from "@/lib/rate-limit"
import { legacyClaimConfiguration } from "@/lib/server-env"
import { toTraineeSummary } from "@/lib/trainee-profile"
import {
  TraineeAuthError,
  buildTraineeSessionCookie,
  createTraineeSessionCookie,
  linkTraineeAuthUid,
  verifyFirebaseIdToken,
} from "@/lib/trainee-session"

export const runtime = "nodejs"

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function errorResponse(status: number, error: string) {
  return noStore(NextResponse.json({ success: false, error }, { status }))
}

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  const claim = legacyClaimConfiguration()
  if (!claim.enabled || !claim.secret) {
    return errorResponse(410, "The legacy account-claim flow is closed.")
  }

  if (!adminDb) {
    return errorResponse(503, "Account claiming is unavailable in development fallback mode.")
  }

  try {
    const body = asObject(await readJsonBody(req))
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : ""
    const rawUniversityId =
      typeof body.universityId === "string" ? body.universityId.trim() : ""
    const universityId = rawUniversityId ? normalizeUniversityId(rawUniversityId) : ""
    const claimCode = typeof body.claimCode === "string" ? body.claimCode.trim() : ""

    if (!idToken || !universityId || !claimCode) {
      return errorResponse(400, "idToken, universityId and claimCode are required.")
    }
    if (idToken.length > 10_000 || claimCode.length > 128) {
      return errorResponse(400, "The claim request is malformed.")
    }

    const ip = requestClientIp(req)
    try {
      const byIp = await consumeRateLimit({
        key: rateLimitKey("claim", "ip", ip),
        limit: 10,
        windowSeconds: 60 * 60,
      })
      if (!byIp.allowed) {
        const response = errorResponse(429, "Too many claim attempts. Try again later.")
        response.headers.set("Retry-After", String(byIp.retryAfterSeconds))
        return response
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Account claiming is temporarily unavailable.")
      }
      throw error
    }

    let identity
    try {
      identity = await verifyFirebaseIdToken(idToken)
    } catch (error) {
      if (error instanceof TraineeAuthError) {
        return errorResponse(
          error.code === "authentication_unavailable" ? 503 : 401,
          "The Firebase sign-in token is invalid or expired."
        )
      }
      throw error
    }

    if (!identity.email || !identity.emailVerified) {
      return errorResponse(403, "Verify your email address before claiming an account.")
    }

    try {
      const byUid = await consumeRateLimit({
        key: rateLimitKey("claim", "uid", identity.uid),
        limit: 5,
        windowSeconds: 60 * 60,
      })
      if (!byUid.allowed) {
        const response = errorResponse(429, "Too many claim attempts. Try again later.")
        response.headers.set("Retry-After", String(byUid.retryAfterSeconds))
        return response
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Account claiming is temporarily unavailable.")
      }
      throw error
    }

    const ref = adminDb.collection("trainees").doc(universityId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      return errorResponse(403, "The claim code is invalid or expired.")
    }

    const trainee = snapshot.data() as TraineeDocument
    if (trainee.authUid) {
      return errorResponse(409, "This trainee record is already linked.")
    }
    if (trainee.status === "inactive") {
      return errorResponse(403, "This trainee account is not active.")
    }

    const expiresAt =
      typeof trainee.authClaimExpiresAt === "string"
        ? Date.parse(trainee.authClaimExpiresAt)
        : Number.NaN
    const expectedHash =
      typeof trainee.authClaimCodeHash === "string" ? trainee.authClaimCodeHash : ""

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return errorResponse(410, "The claim code is invalid or expired.")
    }

    const storedEmail = typeof trainee.email === "string" ? trainee.email.trim().toLowerCase() : ""
    if (!storedEmail || storedEmail !== identity.email) {
      await recordAuditEvent({
        type: "auth.claim_rejected",
        actorType: "trainee",
        actorUid: identity.uid,
        targetType: "trainee",
        targetId: universityId,
        outcome: "rejected",
        detail: "email_mismatch",
      })
      return errorResponse(403, "The verified email does not match this trainee record.")
    }

    if (!claimCodeMatches(claim.secret, universityId, claimCode, expectedHash)) {
      await recordAuditEvent({
        type: "auth.claim_rejected",
        actorType: "trainee",
        actorUid: identity.uid,
        targetType: "trainee",
        targetId: universityId,
        outcome: "rejected",
        detail: "invalid_code",
      })
      return errorResponse(403, "The claim code is invalid or expired.")
    }

    let linked: TraineeDocument
    try {
      linked = await linkTraineeAuthUid({
        traineeId: universityId,
        uid: identity.uid,
        email: identity.email,
        expectedEmail: identity.email,
        requireEmail: true,
      })
    } catch (error) {
      if (error instanceof TraineeAuthError) {
        return errorResponse(
          error.code === "conflicting_link" ? 409 : 403,
          "This account cannot be linked because of an existing mapping."
        )
      }
      throw error
    }

    await ref.set(
      {
        authClaimCodeHash: null,
        authClaimExpiresAt: null,
        authClaimCreatedAt: null,
        authClaimCreatedBy: null,
        authMigrationState: "linked",
        authMigrationUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    await recordAuditEvent({
      type: "auth.claim_completed",
      actorType: "trainee",
      actorUid: identity.uid,
      targetType: "trainee",
      targetId: universityId,
      outcome: "success",
      detail: "legacy_claim_code",
    })

    const sessionCookie = await createTraineeSessionCookie(idToken)
    const response = NextResponse.json({
      success: true,
      trainee: toTraineeSummary(linked),
    })
    response.headers.append("Set-Cookie", buildTraineeSessionCookie(sessionCookie))
    return noStore(response)
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(error.status, error.message)
    }
    console.error("Legacy account claim error:", error)
    return errorResponse(500, "Failed to claim the account.")
  }
}

export const dynamic = "force-dynamic"
