import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import {
  verifyTraineeSession,
  type AuthenticatedTrainee,
  type TraineeAuthFailure,
} from "@/lib/trainee-session"

interface AuthenticatedRequest {
  ok: true
  auth: AuthenticatedTrainee
}

interface RejectedRequest {
  ok: false
  response: NextResponse
}

export type TraineeRequestResult = AuthenticatedRequest | RejectedRequest

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function failureMessage(reason: TraineeAuthFailure): { status: number; error: string } {
  switch (reason) {
    case "unlinked_account":
      return {
        status: 403,
        error: "This sign-in account is not linked to a trainee record.",
      }
    case "conflicting_link":
      return {
        status: 403,
        error: "This sign-in account has an ambiguous trainee link. Contact the training team.",
      }
    case "misconfigured":
    case "authentication_unavailable":
      return {
        status: 503,
        error: "Trainee authentication is not available on this deployment.",
      }
    default:
      return { status: 401, error: "Sign in to access this resource." }
  }
}

export async function requireTrainee(request: Request): Promise<TraineeRequestResult> {
  const result = await verifyTraineeSession(request)
  if (result.status === "authenticated") return { ok: true, auth: result }

  const failure = failureMessage(result.reason)
  return {
    ok: false,
    response: noStore(
      NextResponse.json({ success: false, error: failure.error }, { status: failure.status })
    ),
  }
}

export async function requireAdmin(request: Request): Promise<TraineeRequestResult> {
  const result = await requireTrainee(request)
  if (!result.ok) return result

  if (!result.auth.admin) {
    return {
      ok: false,
      response: noStore(
        NextResponse.json(
          { success: false, error: "Administrator access is required." },
          { status: 403 }
        )
      ),
    }
  }

  return result
}

/**
 * Cookie-authenticated mutations must originate from the application origin.
 * SameSite=Lax is an additional layer, not a replacement for this check.
 */
export function rejectCrossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const fetchSite = request.headers.get("sec-fetch-site")

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return noStore(
      NextResponse.json({ success: false, error: "Cross-site request rejected." }, { status: 403 })
    )
  }

  if (!origin && !referer) {
    // Non-browser clients do not send Origin. The session cookie is
    // SameSite=Lax and HttpOnly, so cross-site form posts cannot attach it.
    return null
  }

  const configured = process.env.APP_ORIGIN?.trim()
  const allowed = new Set<string>()
  if (configured) {
    for (const value of configured.split(",")) {
      const trimmed = value.trim().replace(/\/$/, "")
      if (trimmed) allowed.add(trimmed)
    }
  } else {
    allowed.add(new URL(request.url).origin)
  }

  const requestOrigin = origin ?? (referer ? safeOrigin(referer) : null)
  if (!requestOrigin || !allowed.has(requestOrigin)) {
    return noStore(
      NextResponse.json({ success: false, error: "Cross-site request rejected." }, { status: 403 })
    )
  }

  return null
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Machine authentication for the cron route. It is deliberately independent
 * of Firebase sessions and custom claims.
 */
export function isCronAuthorized(request: Request): boolean {
  const authorization = request.headers.get("authorization") ?? ""
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  if (!match) return false

  const presented = match[1]!
  const secrets = [process.env.CRON_SECRET, process.env.CF_SYNC_SECRET].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  )

  return secrets.some((secret) => safeEqual(presented, secret))
}

export function unauthorizedResponse(message = "Unauthorized."): NextResponse {
  return noStore(NextResponse.json({ success: false, error: message }, { status: 401 }))
}

