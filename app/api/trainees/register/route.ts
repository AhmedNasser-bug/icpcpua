import { NextResponse } from "next/server"
import { recordAuditEvent } from "@/lib/audit"
import { rejectCrossOrigin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import {
  ACADEMIC_YEARS,
  TRAINEE_TRACKS,
  type PointEventDocument,
  type TraineeDocument,
} from "@/lib/firebase-schema"
import { codeforcesHandleKey, normalizeCodeforcesHandle } from "@/lib/codeforces/handle"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { UNIVERSITY_ID_PATTERN } from "@/lib/ids"
import {
  RateLimitUnavailableError,
  consumeRateLimit,
  rateLimitKey,
  requestClientIp,
} from "@/lib/rate-limit"
import {
  ServerConfigurationError,
  assertRuntimeConfiguration,
  isProductionRuntime,
} from "@/lib/server-env"
import {
  TRAINEE_AUTH_LINKS_COLLECTION,
  TRAINEE_AUTH_REVERSE_COLLECTION,
  TRAINEE_EMAIL_LINKS_COLLECTION,
  TraineeAuthError,
  buildTraineeSessionCookie,
  findTraineesByEmail,
  traineeEmailLinkDocumentId,
  createTraineeSessionCookie,
  verifyFirebaseIdToken,
} from "@/lib/trainee-session"

export const runtime = "nodejs"

const INITIAL_POINTS = 10

class RegistrationConflictError extends Error {
  readonly status = 409

  constructor(message: string) {
    super(message)
    this.name = "RegistrationConflictError"
  }
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function errorResponse(status: number, error: string) {
  return noStore(NextResponse.json({ success: false, error }, { status }))
}

function isAcademicYear(value: unknown): value is TraineeDocument["academicYear"] {
  return typeof value === "string" && (ACADEMIC_YEARS as readonly string[]).includes(value)
}

function isTrack(value: unknown): value is TraineeDocument["track"] {
  return typeof value === "string" && (TRAINEE_TRACKS as readonly string[]).includes(value)
}

export async function POST(req: Request) {
  let auditTraineeId: string | null = null
  let auditUid: string | null = null

  try {
    assertRuntimeConfiguration()

    const crossOrigin = rejectCrossOrigin(req)
    if (crossOrigin) return crossOrigin

    const body = asObject(await readJsonBody(req))
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
    const universityId = typeof body.universityId === "string" ? body.universityId.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const academicYear = body.academicYear
    const track = body.track
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : ""
    const rawHandle = typeof body.codeforcesHandle === "string" ? body.codeforcesHandle.trim() : ""

    if (!fullName || !universityId || !email || !phone || !academicYear || !track) {
      return errorResponse(400, "Please fill in all required fields.")
    }
    if (fullName.length > 120) {
      return errorResponse(400, "Full name is too long.")
    }
    if (!UNIVERSITY_ID_PATTERN.test(universityId)) {
      return errorResponse(
        400,
        "University ID must be 3-64 letters, numbers, underscores or hyphens."
      )
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
      return errorResponse(400, "Enter a valid email address.")
    }
    if (phone.length < 6 || phone.length > 32) {
      return errorResponse(400, "Enter a valid phone number.")
    }
    if (!isAcademicYear(academicYear)) {
      return errorResponse(400, "Select a valid academic year.")
    }
    if (!isTrack(track)) {
      return errorResponse(400, "Select a valid training track.")
    }

    auditTraineeId = universityId

    let cleanCfHandle = ""
    if (rawHandle) {
      const normalizedHandle = normalizeCodeforcesHandle(rawHandle)
      if (!normalizedHandle) {
        return errorResponse(
          400,
          "Enter a valid Codeforces handle (3-24 letters, numbers, underscores, dots or hyphens)."
        )
      }
      cleanCfHandle = normalizedHandle
    }

    if (!adminDb) {
      if (isProductionRuntime()) {
        return errorResponse(503, "Registration is not configured on this deployment.")
      }
      return noStore(
        NextResponse.json({
          success: true,
          simulated: true,
          message: "Registration received (development fallback mode).",
          trainee: {
            id: `sim_${universityId}`,
            fullName,
            universityId,
            email,
            phone,
            academicYear,
            track,
            codeforcesHandle: cleanCfHandle,
            pointsTotal: INITIAL_POINTS,
            status: "active",
          },
        })
      )
    }

    if (!idToken) {
      return errorResponse(401, "Sign in before completing registration.")
    }

    const ip = requestClientIp(req)
    try {
      const byIp = await consumeRateLimit({
        key: rateLimitKey("register", "ip", ip),
        limit: 10,
        windowSeconds: 60 * 60,
      })
      if (!byIp.allowed) {
        const response = errorResponse(429, "Too many registration attempts. Try again later.")
        response.headers.set("Retry-After", String(byIp.retryAfterSeconds))
        return response
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Registration is temporarily unavailable. Try again shortly.")
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
          error.code === "disabled_user"
            ? "This account has been disabled. Contact the training team."
            : "Your sign-in token is invalid or expired. Sign in again."
        )
      }
      throw error
    }

    auditUid = identity.uid

    if (!identity.email) {
      return errorResponse(
        403,
        "A verified email address is required to register a trainee account."
      )
    }
    if (identity.email !== email) {
      return errorResponse(
        400,
        "The registration email must match the authenticated Firebase account."
      )
    }

    try {
      const byUid = await consumeRateLimit({
        key: rateLimitKey("register", "uid", identity.uid),
        limit: 5,
        windowSeconds: 60 * 60,
      })
      if (!byUid.allowed) {
        const response = errorResponse(429, "Too many registration attempts. Try again later.")
        response.headers.set("Retry-After", String(byUid.retryAfterSeconds))
        return response
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return errorResponse(503, "Registration is temporarily unavailable. Try again shortly.")
      }
      throw error
    }

    const emailMatches = await findTraineesByEmail(identity.email)
    const emailConflict = emailMatches.find(
      (match) => match.id !== universityId && match.authUid !== identity.uid
    )
    if (emailConflict) {
      return errorResponse(
        409,
        "This email cannot be used for a new registration. Sign in if you already registered."
      )
    }

    const db = adminDb
    const traineeRef = db.collection("trainees").doc(universityId)
    const uidLinkRef = db.collection(TRAINEE_AUTH_LINKS_COLLECTION).doc(identity.uid)
    const reverseLinkRef = db
      .collection(TRAINEE_AUTH_REVERSE_COLLECTION)
      .doc(universityId)
    const emailLinkRef = db
      .collection(TRAINEE_EMAIL_LINKS_COLLECTION)
      .doc(traineeEmailLinkDocumentId(email))
    const handleKey = cleanCfHandle ? codeforcesHandleKey(cleanCfHandle) : null
    const handleRegistryRef = handleKey
      ? db.collection("codeforces_links").doc(handleKey)
      : null
    const eventRef = db.collection("point_events").doc()
    const now = new Date().toISOString()

    let created: TraineeDocument | null = null
    let alreadyRegistered = false

    await db.runTransaction(async (transaction) => {
      const traineeSnapshot = await transaction.get(traineeRef)
      const uidLinkSnapshot = await transaction.get(uidLinkRef)
      const reverseLinkSnapshot = await transaction.get(reverseLinkRef)
      const emailLinkSnapshot = await transaction.get(emailLinkRef)
      const handleSnapshot = handleRegistryRef
        ? await transaction.get(handleRegistryRef)
        : null

      const linkedTraineeId =
        uidLinkSnapshot.exists && typeof uidLinkSnapshot.data()?.traineeId === "string"
          ? (uidLinkSnapshot.data()!.traineeId as string)
          : null
      if (linkedTraineeId && linkedTraineeId !== universityId) {
        throw new RegistrationConflictError(
          "This sign-in account is already linked to another trainee record."
        )
      }

      const reverseUid =
        reverseLinkSnapshot.exists && typeof reverseLinkSnapshot.data()?.uid === "string"
          ? (reverseLinkSnapshot.data()!.uid as string)
          : null
      if (reverseUid && reverseUid !== identity.uid) {
        throw new RegistrationConflictError(
          "This trainee record already has a different sign-in mapping."
        )
      }

      const emailOwner =
        emailLinkSnapshot.exists && typeof emailLinkSnapshot.data()?.traineeId === "string"
          ? (emailLinkSnapshot.data()!.traineeId as string)
          : null
      if (emailOwner && emailOwner !== universityId) {
        throw new RegistrationConflictError(
          "This email cannot be used for a new registration. Sign in if you already registered."
        )
      }

      if (traineeSnapshot.exists) {
        const existing = traineeSnapshot.data() as TraineeDocument
        if (existing.authUid === identity.uid) {
          transaction.set(
            uidLinkRef,
            {
              traineeId: universityId,
              uid: identity.uid,
              createdAt: now,
              updatedAt: now,
            },
            { merge: true }
          )
          transaction.set(
            reverseLinkRef,
            {
              traineeId: universityId,
              uid: identity.uid,
              createdAt: now,
              updatedAt: now,
            },
            { merge: true }
          )
          transaction.set(
            emailLinkRef,
            {
              traineeId: universityId,
              email,
              createdAt: now,
              updatedAt: now,
            },
            { merge: true }
          )
          created = existing
          alreadyRegistered = true
          return
        }
        throw new RegistrationConflictError(
          "A trainee with this University ID is already registered in the system."
        )
      }

      if (handleSnapshot?.exists && handleSnapshot.data()?.universityId !== universityId) {
        throw new RegistrationConflictError(
          "This Codeforces handle is already linked to another trainee."
        )
      }

      const newTrainee: TraineeDocument = {
        id: universityId,
        fullName,
        universityId,
        email,
        phone,
        academicYear,
        track,
        authUid: identity.uid,
        authEmail: identity.email,
        authLinkedAt: now,
        authMigrationState: "linked",
        authMigrationUpdatedAt: now,
        codeforcesHandle: cleanCfHandle,
        codeforcesHandleLower: handleKey ?? "",
        cfHandleVerified: false,
        status: "active",
        pointsTotal: INITIAL_POINTS,
        cfRating: null,
        cfMaxRating: null,
        cfSolvedCount: null,
        cfSolvedProblemKeys: [],
        cfLastSubmissionId: null,
        cfLastSyncedAt: null,
        cfSyncAttemptedAt: null,
        cfSyncStatus: "never",
        cfSyncError: null,
        cfNextSyncAt: cleanCfHandle ? now : null,
        attendedSessionsCount: 0,
        qrScansCount: 0,
        registeredAt: now,
        updatedAt: now,
      }

      transaction.set(traineeRef, newTrainee)
      transaction.set(uidLinkRef, {
        traineeId: universityId,
        uid: identity.uid,
        createdAt: now,
        updatedAt: now,
      })
      transaction.set(reverseLinkRef, {
        traineeId: universityId,
        uid: identity.uid,
        createdAt: now,
        updatedAt: now,
      })
      transaction.set(emailLinkRef, {
        traineeId: universityId,
        email,
        createdAt: now,
        updatedAt: now,
      })

      if (handleRegistryRef && handleKey) {
        transaction.set(
          handleRegistryRef,
          {
            universityId,
            handle: cleanCfHandle,
            createdAt:
              typeof handleSnapshot?.data()?.createdAt === "string"
                ? (handleSnapshot.data()!.createdAt as string)
                : now,
            updatedAt: now,
          },
          { merge: true }
        )
      }

      const welcomeEvent: PointEventDocument = {
        id: eventRef.id,
        traineeId: universityId,
        universityId,
        type: "registration_welcome",
        points: INITIAL_POINTS,
        reason: "Initial onboarding & profile creation bonus",
        createdAt: now,
      }
      transaction.set(eventRef, welcomeEvent)

      created = newTrainee
    })

    if (!created) {
      throw new Error("Registration transaction completed without a trainee record.")
    }

    await recordAuditEvent({
      type: "auth.registration",
      actorType: "trainee",
      actorUid: identity.uid,
      targetType: "trainee",
      targetId: universityId,
      outcome: "success",
      detail: alreadyRegistered ? "idempotent_retry" : "created",
    })

    const response = NextResponse.json({
      success: true,
      simulated: false,
      message: alreadyRegistered
        ? "Trainee registration was already completed."
        : "Trainee registered successfully! +10 welcome points added to your leaderboard standing.",
      trainee: created,
    })

    try {
      const sessionCookie = await createTraineeSessionCookie(idToken)
      response.headers.append("Set-Cookie", buildTraineeSessionCookie(sessionCookie))
    } catch {
      // The client can still establish a session through /api/trainees/session.
    }

    return noStore(response)
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(error.status, error.message)
    }
    if (error instanceof RegistrationConflictError) {
      await recordAuditEvent({
        type: "auth.registration_conflict",
        actorType: "system",
        actorUid: auditUid,
        targetType: "trainee",
        targetId: auditTraineeId,
        outcome: "rejected",
        detail: error.message,
      })
      return errorResponse(error.status, error.message)
    }
    if (error instanceof ServerConfigurationError) {
      console.error(
        "Trainee registration configuration error:",
        error.issues.map((issue) => issue.variable)
      )
      return errorResponse(503, "Registration is not configured on this deployment.")
    }
    console.error("Trainee registration error:", error)
    return errorResponse(500, "Internal server error occurred.")
  }
}
