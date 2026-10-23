import type { DecodedIdToken } from "firebase-admin/auth"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { isProductionRuntime, traineeSessionMaxAgeSeconds } from "@/lib/server-env"

export const TRAINEE_SESSION_COOKIE = "pua_trainee_session"
export const TRAINEE_AUTH_LINKS_COLLECTION = "trainee_auth_links"
export const TRAINEE_AUTH_REVERSE_COLLECTION = "trainee_auth_links_by_trainee"
export const TRAINEE_EMAIL_LINKS_COLLECTION = "trainee_email_links"

export function traineeEmailLinkDocumentId(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase())
}

export type TraineeAuthFailure =
  | "missing_session"
  | "invalid_session"
  | "revoked_session"
  | "unlinked_account"
  | "conflicting_link"
  | "misconfigured"
  | "authentication_unavailable"

export interface AuthenticatedTrainee {
  status: "authenticated"
  uid: string
  claims: DecodedIdToken
  traineeId: string
  trainee: TraineeDocument
  admin: boolean
}

interface UnauthenticatedTrainee {
  status: "unauthenticated"
  reason: TraineeAuthFailure
}

export type TraineeSessionResult = AuthenticatedTrainee | UnauthenticatedTrainee

export class TraineeAuthError extends Error {
  readonly code:
    | "invalid_token"
    | "expired_token"
    | "revoked_token"
    | "disabled_user"
    | "unlinked_account"
    | "conflicting_link"
    | "not_found"
    | "email_unverified"
    | "invalid_claim"
    | "authentication_unavailable"

  constructor(code: TraineeAuthError["code"], message: string) {
    super(message)
    this.name = "TraineeAuthError"
    this.code = code
  }
}

export interface FirebaseAuthIdentity {
  uid: string
  email: string | null
  emailVerified: boolean
  claims: DecodedIdToken
}

function firebaseErrorCode(error: unknown): string {
  if (error === null || typeof error !== "object" || !("code" in error)) return ""
  const code = (error as { code?: unknown }).code
  return typeof code === "string" ? code : ""
}

export function readTraineeSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(`${TRAINEE_SESSION_COOKIE}=`)) continue
    const raw = trimmed.slice(TRAINEE_SESSION_COOKIE.length + 1)
    if (!raw) return null
    try {
      return decodeURIComponent(raw)
    } catch {
      return null
    }
  }

  return null
}

export function buildTraineeSessionCookie(
  sessionCookie: string,
  maxAgeSeconds = traineeSessionMaxAgeSeconds()
): string {
  if (!sessionCookie || /[\s;]/.test(sessionCookie)) {
    throw new Error("Invalid Firebase session cookie value.")
  }
  const secure = isProductionRuntime() ? "; Secure" : ""
  return `${TRAINEE_SESSION_COOKIE}=${encodeURIComponent(sessionCookie)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

export function buildClearTraineeSessionCookie(): string {
  const secure = isProductionRuntime() ? "; Secure" : ""
  return `${TRAINEE_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseAuthIdentity> {
  if (!adminAuth) {
    throw new TraineeAuthError(
      "authentication_unavailable",
      "Firebase Authentication is not configured on this deployment."
    )
  }

  let claims: DecodedIdToken
  try {
    claims = await adminAuth.verifyIdToken(idToken, true)
  } catch (error) {
    const code = firebaseErrorCode(error)
    if (code === "auth/id-token-expired" || code === "auth/session-cookie-expired") {
      throw new TraineeAuthError("expired_token", "The sign-in token has expired.")
    }
    if (code === "auth/id-token-revoked") {
      throw new TraineeAuthError("revoked_token", "The sign-in session has been revoked.")
    }
    if (code === "auth/user-disabled") {
      throw new TraineeAuthError("disabled_user", "This account has been disabled.")
    }
    throw new TraineeAuthError("invalid_token", "The sign-in token is invalid.")
  }

  try {
    const user = await adminAuth.getUser(claims.uid)
    if (user.disabled) {
      throw new TraineeAuthError("disabled_user", "This account has been disabled.")
    }
  } catch (error) {
    if (error instanceof TraineeAuthError) throw error
    const code = firebaseErrorCode(error)
    if (code === "auth/user-not-found") {
      throw new TraineeAuthError("invalid_token", "The sign-in token is invalid.")
    }
    if (code === "auth/insufficient-permission") {
      throw new TraineeAuthError(
        "authentication_unavailable",
        "Firebase Authentication is not configured on this deployment."
      )
    }
    throw new TraineeAuthError(
      "authentication_unavailable",
      "Firebase Authentication is temporarily unavailable."
    )
  }

  return {
    uid: claims.uid,
    email: typeof claims.email === "string" ? claims.email.trim().toLowerCase() : null,
    emailVerified: claims.email_verified === true,
    claims,
  }
}

export async function resolveTraineeLinkByUid(
  uid: string
): Promise<{ trainee: TraineeDocument } | { reason: TraineeAuthFailure }> {
  if (!adminDb) return { reason: "misconfigured" }

  const linkSnapshot = await adminDb
    .collection(TRAINEE_AUTH_LINKS_COLLECTION)
    .doc(uid)
    .get()

  const linkedId =
    linkSnapshot.exists && typeof linkSnapshot.data()?.traineeId === "string"
      ? (linkSnapshot.data()!.traineeId as string)
      : null

  if (linkedId) {
    const snapshot = await adminDb.collection("trainees").doc(linkedId).get()
    if (!snapshot.exists) return { reason: "unlinked_account" }
    const trainee = { ...snapshot.data(), id: snapshot.id } as TraineeDocument
    if (trainee.authUid !== uid) return { reason: "conflicting_link" }
    return { trainee }
  }

  const matches = await adminDb
    .collection("trainees")
    .where("authUid", "==", uid)
    .limit(2)
    .get()

  if (matches.docs.length > 1) return { reason: "conflicting_link" }
  if (matches.docs.length === 0) return { reason: "unlinked_account" }

  const doc = matches.docs[0]!
  return { trainee: { ...doc.data(), id: doc.id } as TraineeDocument }
}

export async function verifyTraineeSession(request: Request): Promise<TraineeSessionResult> {
  const cookie = readTraineeSessionCookie(request)
  if (!cookie) return { status: "unauthenticated", reason: "missing_session" }
  if (!adminAuth) return { status: "unauthenticated", reason: "misconfigured" }

  let claims: DecodedIdToken
  try {
    claims = await adminAuth.verifySessionCookie(cookie, true)
  } catch (error) {
    const code = firebaseErrorCode(error)
    if (code === "auth/session-cookie-revoked" || code === "auth/id-token-revoked") {
      return { status: "unauthenticated", reason: "revoked_session" }
    }
    if (code === "auth/session-cookie-expired") {
      return { status: "unauthenticated", reason: "invalid_session" }
    }
    return { status: "unauthenticated", reason: "invalid_session" }
  }

  if (typeof claims.uid !== "string" || !claims.uid) {
    return { status: "unauthenticated", reason: "invalid_session" }
  }

  let resolved: Awaited<ReturnType<typeof resolveTraineeLinkByUid>>
  try {
    resolved = await resolveTraineeLinkByUid(claims.uid)
  } catch {
    return { status: "unauthenticated", reason: "misconfigured" }
  }

  if ("reason" in resolved) {
    return { status: "unauthenticated", reason: resolved.reason }
  }

  if (typeof resolved.trainee.authUid !== "string" || resolved.trainee.authUid !== claims.uid) {
    return { status: "unauthenticated", reason: "conflicting_link" }
  }

  return {
    status: "authenticated",
    uid: claims.uid,
    claims,
    traineeId: resolved.trainee.id,
    trainee: resolved.trainee,
    admin: claims.admin === true,
  }
}

export async function createTraineeSessionCookie(idToken: string): Promise<string> {
  if (!adminAuth) {
    throw new TraineeAuthError(
      "authentication_unavailable",
      "Firebase Authentication is not configured on this deployment."
    )
  }

  const maxAge = traineeSessionMaxAgeSeconds()
  try {
    return await adminAuth.createSessionCookie(idToken, {
      expiresIn: maxAge * 1000,
    })
  } catch (error) {
    const code = firebaseErrorCode(error)
    if (code === "auth/id-token-expired") {
      throw new TraineeAuthError("expired_token", "The sign-in token has expired.")
    }
    if (code === "auth/id-token-revoked") {
      throw new TraineeAuthError("revoked_token", "The sign-in session has been revoked.")
    }
    if (code === "auth/user-disabled") {
      throw new TraineeAuthError("disabled_user", "This account has been disabled.")
    }
    throw new TraineeAuthError("invalid_token", "The sign-in token is invalid.")
  }
}

export interface LinkTraineeAuthOptions {
  traineeId: string
  uid: string
  email: string | null
  expectedEmail?: string | null
  requireEmail?: boolean
}

/**
 * Atomically links one Firebase UID to one trainee document. The mapping
 * registry makes the UID-to-trainee relationship unique; an existing link is
 * never silently overwritten.
 */
export async function linkTraineeAuthUid(
  options: LinkTraineeAuthOptions
): Promise<TraineeDocument> {
  if (!adminDb) {
    throw new TraineeAuthError(
      "authentication_unavailable",
      "Trainee accounts are not available on this deployment."
    )
  }

  const db = adminDb
  const traineeRef = db.collection("trainees").doc(options.traineeId)
  const linkRef = db.collection(TRAINEE_AUTH_LINKS_COLLECTION).doc(options.uid)
  const reverseRef = db
    .collection(TRAINEE_AUTH_REVERSE_COLLECTION)
    .doc(options.traineeId)

  return db.runTransaction(async (transaction) => {
    const [traineeSnapshot, linkSnapshot, reverseSnapshot] = await Promise.all([
      transaction.get(traineeRef),
      transaction.get(linkRef),
      transaction.get(reverseRef),
    ])

    if (!traineeSnapshot.exists) {
      throw new TraineeAuthError("not_found", "Trainee record was not found.")
    }

    const trainee = traineeSnapshot.data() as TraineeDocument
    const existingLink = linkSnapshot.exists ? linkSnapshot.data() : undefined
    const existingTraineeId =
      typeof existingLink?.traineeId === "string" ? existingLink.traineeId : null

    if (existingTraineeId && existingTraineeId !== options.traineeId) {
      throw new TraineeAuthError(
        "conflicting_link",
        "This sign-in account is already linked to another trainee."
      )
    }

    if (trainee.authUid && trainee.authUid !== options.uid) {
      throw new TraineeAuthError(
        "conflicting_link",
        "This trainee record is already linked to another sign-in account."
      )
    }

    const reverseUid =
      reverseSnapshot.exists && typeof reverseSnapshot.data()?.uid === "string"
        ? (reverseSnapshot.data()!.uid as string)
        : null
    if (reverseUid && reverseUid !== options.uid) {
      throw new TraineeAuthError(
        "conflicting_link",
        "This trainee record already has a different sign-in mapping."
      )
    }

    if (options.expectedEmail) {
      const storedEmail = typeof trainee.email === "string" ? trainee.email.trim().toLowerCase() : ""
      if (!storedEmail || storedEmail !== options.expectedEmail.trim().toLowerCase()) {
        throw new TraineeAuthError(
          "invalid_claim",
          "The verified email does not match this trainee record."
        )
      }
    }

    if (options.requireEmail && !options.email) {
      throw new TraineeAuthError("email_unverified", "Verify your email before linking the account.")
    }

    if (trainee.authUid === options.uid && existingTraineeId === options.traineeId) {
      if (!reverseUid) {
        const now = new Date().toISOString()
        transaction.set(
          reverseRef,
          {
            traineeId: options.traineeId,
            uid: options.uid,
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        )
      }
      return { ...trainee, id: trainee.id ?? options.traineeId }
    }

    const now = new Date().toISOString()
    transaction.set(
      traineeRef,
      {
        authUid: options.uid,
        authLinkedAt: now,
        authEmail: options.email ?? null,
        authMigrationState: "linked",
        authMigrationUpdatedAt: now,
        updatedAt: now,
      },
      { merge: true }
    )
    transaction.set(
      linkRef,
      {
        traineeId: options.traineeId,
        uid: options.uid,
        createdAt:
          typeof existingLink?.createdAt === "string" ? existingLink.createdAt : now,
        updatedAt: now,
      },
      { merge: true }
    )
    transaction.set(
      reverseRef,
      {
        traineeId: options.traineeId,
        uid: options.uid,
        createdAt:
          typeof reverseSnapshot.data()?.createdAt === "string"
            ? (reverseSnapshot.data()!.createdAt as string)
            : now,
        updatedAt: now,
      },
      { merge: true }
    )

    return {
      ...trainee,
      authUid: options.uid,
      authLinkedAt: now,
      authEmail: options.email ?? null,
      authMigrationState: "linked",
      authMigrationUpdatedAt: now,
      updatedAt: now,
    }
  })
}

export async function findTraineesByEmail(email: string): Promise<TraineeDocument[]> {
  if (!adminDb) return []
  const normalized = email.trim().toLowerCase()
  if (!normalized) return []

  const snapshot = await adminDb
    .collection("trainees")
    .where("email", "==", normalized)
    .limit(2)
    .get()

  return snapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id }) as TraineeDocument
  )
}

export async function getTraineeById(traineeId: string): Promise<TraineeDocument | null> {
  if (!adminDb) return null
  const snapshot = await adminDb.collection("trainees").doc(traineeId).get()
  return snapshot.exists
    ? ({ ...snapshot.data(), id: snapshot.id } as TraineeDocument)
    : null
}

/**
 * Session revocation is account-wide in Firebase. Signing out therefore
 * revokes refresh tokens for every device, not just the current browser.
 * This is the documented policy for this application.
 */
export async function endTraineeSession(request: Request): Promise<void> {
  const cookie = readTraineeSessionCookie(request)
  if (!cookie || !adminAuth) return

  try {
    const claims = await adminAuth.verifySessionCookie(cookie, false)
    if (typeof claims.uid === "string" && claims.uid) {
      await adminAuth.revokeRefreshTokens(claims.uid)
    }
  } catch {
    // Expired or revoked sessions still have their browser cookie cleared.
  }
}
