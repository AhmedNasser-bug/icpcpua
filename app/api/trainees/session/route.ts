import { NextResponse } from "next/server"
import { recordAuditEvent } from "@/lib/audit"
import { rejectCrossOrigin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { normalizeUniversityId } from "@/lib/ids"
import {
  RateLimitUnavailableError,
  consumeRateLimit,
  rateLimitKey,
  requestClientIp,
  type RateLimitResult,
} from "@/lib/rate-limit"
import { ServerConfigurationError, assertRuntimeConfiguration } from "@/lib/server-env"
import { toTraineeSummary } from "@/lib/trainee-profile"
import {
  TraineeAuthError,
  buildClearTraineeSessionCookie,
  buildTraineeSessionCookie,
  createTraineeSessionCookie,
  endTraineeSession,
  findTraineesByEmail,
  getTraineeById,
  linkTraineeAuthUid,
  resolveTraineeLinkByUid,
  verifyFirebaseIdToken,
  verifyTraineeSession,
} from "@/lib/trainee-session"

export const runtime = "nodejs"

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function errorResponse(status: number, error: string, extra: Record<string, unknown> = {}) {
  return noStore(
    NextResponse.json({ success: false, error, ...extra }, { status })
  )
}

function rateLimited(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: "Too many authentication attempts. Try again later.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    { status: 429 }
  )
  response.headers.set("Retry-After", String(result.retryAfterSeconds))
  response.headers.set("Cache-Control", "no-store")
  return response
}

function authErrorStatus(error: TraineeAuthError): number {
  switch (error.code) {
    case "expired_token":
    case "revoked_token":
    case "invalid_token":
      return 401
    case "disabled_user":
    case "email_unverified":
    case "unlinked_account":
    case "invalid_claim":
      return 403
    case "conflicting_link":
      return 409
    case "not_found":
      return 403
    case "authentication_unavailable":
      return 503
    default:
      return 401
  }
}

function authErrorMessage(error: TraineeAuthError): string {
  switch (error.code) {
    case "expired_token":
      return "Your sign-in token expired. Sign in again."
    case "revoked_token":
      return "This sign-in session was revoked. Sign in again."
    case "disabled_user":
      return "This account has been disabled. Contact the training team."
    case "email_unverified":
      return "Verify your email address before signing in."
    case "conflicting_link":
      return "This account cannot be linked because of an existing mapping. Contact the training team."
    case "authentication_unavailable":
      return "Trainee authentication is temporarily unavailable."
    default:
      return "Authentication failed. Sign in again."
  }
}

async function respondWithSession(
  idToken: string,
  trainee: Parameters<typeof toTraineeSummary>[0],
  admin: boolean
): Promise<NextResponse> {
  let sessionCookie: string
  try {
    sessionCookie = await createTraineeSessionCookie(idToken)
  } catch (error) {
    if (error instanceof TraineeAuthError) {
      return errorResponse(authErrorStatus(error), authErrorMessage(error))
    }
    throw error
  }

  const response = NextResponse.json({
    success: true,
    trainee: toTraineeSummary(trainee),
    admin,
  })
  response.headers.append("Set-Cookie", buildTraineeSessionCookie(sessionCookie))
  return noStore(response)
}

export async function POST(req: Request) {
  try {
    assertRuntimeConfiguration()

    const crossOrigin = rejectCrossOrigin(req)
    if (crossOrigin) return crossOrigin

    const body = asObject(await readJsonBody(req))
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : ""
    const rawUniversityId =
      typeof body.universityId === "string" ? body.universityId.trim() : ""
    const universityId = rawUniversityId ? normalizeUniversityId(rawUniversityId) : ""

    if (rawUniversityId && !universityId) {
      return errorResponse(400, "The university ID is malformed.")
    }
    if (!idToken) {
      return errorResponse(400, "A Firebase ID token is required.")
    }
    if (idToken.length > 10_000) {
      return errorResponse(400, "The Firebase ID token is malformed.")
    }

    if (!adminDb) {
      return errorResponse(503, "Trainee sign-in is unavailable in development fallback mode.", {
        simulated: true,
      })
    }

    const ip = requestClientIp(req)
    try {
      const byIp = await consumeRateLimit({
        key: rateLimitKey("session", "create", "ip", ip),
        limit: 20,
        windowSeconds: 60,
      })
      if (!byIp.allowed) return rateLimited(byIp)
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Sign-in is temporarily unavailable. Try again shortly.")
      }
      throw error
    }

    let identity
    try {
      identity = await verifyFirebaseIdToken(idToken)
    } catch (error) {
      if (error instanceof TraineeAuthError) {
        if (error.code === "conflicting_link" || error.code === "unlinked_account") {
          await recordAuditEvent({
            type: "auth.session_rejected",
            actorType: "trainee",
            targetType: "trainee",
            outcome: "rejected",
            detail: error.code,
          })
        }
        return errorResponse(authErrorStatus(error), authErrorMessage(error))
      }
      throw error
    }

    try {
      const byUid = await consumeRateLimit({
        key: rateLimitKey("session", "create", "uid", identity.uid),
        limit: 10,
        windowSeconds: 60,
      })
      if (!byUid.allowed) return rateLimited(byUid)
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Sign-in is temporarily unavailable. Try again shortly.")
      }
      throw error
    }

    const resolved = await resolveTraineeLinkByUid(identity.uid)

    if ("trainee" in resolved) {
      if (resolved.trainee.status === "inactive") {
        return errorResponse(403, "This trainee account is not active.")
      }
      return respondWithSession(
        idToken,
        resolved.trainee,
        identity.claims.admin === true
      )
    }

    if (resolved.reason === "conflicting_link") {
      await recordAuditEvent({
        type: "auth.link_conflict",
        actorType: "trainee",
        actorUid: identity.uid,
        targetType: "trainee",
        outcome: "rejected",
        detail: "multiple_uid_matches",
      })
      return errorResponse(409, authErrorMessage(new TraineeAuthError("conflicting_link", "")))
    }

    if (resolved.reason === "misconfigured") {
      return errorResponse(503, "Trainee authentication is temporarily unavailable.")
    }

    if (!identity.email || !identity.emailVerified) {
      return errorResponse(
        403,
        "Verify your email address, then sign in once more to link your trainee record.",
        { code: "EMAIL_VERIFICATION_REQUIRED" }
      )
    }

    if (universityId) {
      const trainee = await getTraineeById(universityId)
      if (
        !trainee ||
        trainee.status === "inactive" ||
        typeof trainee.email !== "string" ||
        trainee.email.trim().toLowerCase() !== identity.email
      ) {
        await recordAuditEvent({
          type: "auth.link_rejected",
          actorType: "trainee",
          actorUid: identity.uid,
          targetType: "trainee",
          targetId: universityId,
          outcome: "rejected",
          detail: "email_or_trainee_mismatch",
        })
        return errorResponse(
          403,
          "The verified email does not match that trainee record. Contact the training team."
        )
      }

      try {
        const linked = await linkTraineeAuthUid({
          traineeId: universityId,
          uid: identity.uid,
          email: identity.email,
          expectedEmail: identity.email,
          requireEmail: true,
        })

        await recordAuditEvent({
          type: "auth.account_linked",
          actorType: "trainee",
          actorUid: identity.uid,
          targetType: "trainee",
          targetId: universityId,
          outcome: "success",
          detail: "verified_email_claim",
        })

        return respondWithSession(idToken, linked, identity.claims.admin === true)
      } catch (error) {
        if (error instanceof TraineeAuthError) {
          await recordAuditEvent({
            type: "auth.link_rejected",
            actorType: "trainee",
            actorUid: identity.uid,
            targetType: "trainee",
            targetId: universityId,
            outcome: "rejected",
            detail: error.code,
          })
          return errorResponse(authErrorStatus(error), authErrorMessage(error))
        }
        throw error
      }
    }

    const matches = await findTraineesByEmail(identity.email)
    if (matches.length === 0) {
      return errorResponse(
        403,
        "No trainee record is linked to this sign-in account. Register first or contact the training team.",
        { code: "TRAINEE_NOT_REGISTERED" }
      )
    }

    if (matches.length > 1) {
      await recordAuditEvent({
        type: "auth.link_conflict",
        actorType: "trainee",
        actorUid: identity.uid,
        targetType: "trainee",
        outcome: "rejected",
        detail: "duplicate_email",
      })
      return errorResponse(
        409,
        "Multiple trainee records match this email. Contact the training team to resolve the mapping."
      )
    }

    return errorResponse(
      409,
      "Confirm your university ID to finish linking this sign-in account.",
      { code: "ACCOUNT_LINK_REQUIRED", universityIdRequired: true }
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(error.status, error.message)
    }
    if (error instanceof ServerConfigurationError) {
      console.error("Trainee sign-in configuration error:", error.issues.map((issue) => issue.variable))
      return errorResponse(503, "Sign-in is not configured on this deployment.")
    }
    console.error("Trainee sign-in error:", error)
    return errorResponse(500, "Failed to sign in.")
  }
}

export async function GET(req: Request) {
  try {
    if (!adminDb) {
      const session = await verifyTraineeSession(req)
      if (session.status !== "authenticated") {
        return errorResponse(401, "Not signed in.")
      }
      return errorResponse(503, "Trainee accounts are unavailable.", { simulated: true })
    }

    const session = await verifyTraineeSession(req)
    if (session.status !== "authenticated") {
      const status =
        session.reason === "misconfigured" || session.reason === "authentication_unavailable"
          ? 503
          : session.reason === "unlinked_account" || session.reason === "conflicting_link"
            ? 403
            : 401
      const response = errorResponse(
        status,
        status === 403
          ? "This sign-in account is not linked to a trainee record."
          : "Not signed in."
      )
      if (session.reason !== "missing_session") {
        response.headers.append("Set-Cookie", buildClearTraineeSessionCookie())
      }
      return response
    }

    return noStore(
      NextResponse.json({
        success: true,
        trainee: toTraineeSummary(session.trainee),
        admin: session.admin,
      })
    )
  } catch (error) {
    console.error("Trainee session lookup error:", error)
    return errorResponse(500, "Failed to load the session.")
  }
}

export async function DELETE(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  const response = NextResponse.json({ success: true })
  try {
    await endTraineeSession(req)
  } catch (error) {
    console.error("Trainee sign-out revocation error:", error)
  }
  response.headers.append("Set-Cookie", buildClearTraineeSessionCookie())
  return noStore(response)
}

export const dynamic = "force-dynamic"
