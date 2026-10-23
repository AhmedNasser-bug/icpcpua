import { createHash } from "node:crypto"
import { Timestamp } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { isProductionRuntime } from "@/lib/server-env"

export class RateLimitUnavailableError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Rate limiting is temporarily unavailable.", options)
    this.name = "RateLimitUnavailableError"
  }
}

export interface RateLimitOptions {
  key: string
  limit: number
  windowSeconds: number
  now?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

interface MemoryBucket {
  count: number
  windowStartedAt: number
}

const memoryBuckets = new Map<string, MemoryBucket>()

function bucketId(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

function consumeMemory(options: RateLimitOptions, now: number): RateLimitResult {
  const windowMs = options.windowSeconds * 1000
  const existing = memoryBuckets.get(options.key)
  const bucket =
    !existing || now - existing.windowStartedAt >= windowMs
      ? { count: 0, windowStartedAt: now }
      : existing

  if (bucket.count >= options.limit) {
    const retryAfterMs = Math.max(0, bucket.windowStartedAt + windowMs - now)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  bucket.count += 1
  memoryBuckets.set(options.key, bucket)

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: 0,
  }
}

/**
 * Shared fixed-window limiter. Firestore is the only production backend; the
 * in-memory branch exists solely for local development and tests. Production
 * never silently downgrades to per-instance enforcement.
 */
export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = options.now ?? Date.now()
  const windowMs = options.windowSeconds * 1000

  if (!adminDb) {
    if (isProductionRuntime()) throw new RateLimitUnavailableError()
    return consumeMemory(options, now)
  }

  const ref = adminDb.collection("rate_limits").doc(bucketId(options.key))

  try {
    return await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      const data = snapshot.exists ? snapshot.data() : undefined
      const windowStartedAt =
        typeof data?.windowStartedAt === "number" && Number.isFinite(data.windowStartedAt)
          ? data.windowStartedAt
          : 0
      const count =
        typeof data?.count === "number" && Number.isFinite(data.count) ? data.count : 0

      const expired = now - windowStartedAt >= windowMs || windowStartedAt <= 0
      const nextCount = expired ? 1 : count + 1
      const nextWindowStart = expired ? now : windowStartedAt

      if (!expired && count >= options.limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((windowStartedAt + windowMs - now) / 1000)
          ),
        }
      }

      transaction.set(
        ref,
        {
          count: nextCount,
          windowStartedAt: nextWindowStart,
          expiresAt: Timestamp.fromMillis(nextWindowStart + windowMs),
          updatedAt: Timestamp.fromMillis(now),
        },
        { merge: true }
      )

      return {
        allowed: true,
        remaining: Math.max(0, options.limit - nextCount),
        retryAfterSeconds: 0,
      }
    })
  } catch (error) {
    if (isProductionRuntime()) throw new RateLimitUnavailableError({ cause: error })
    return consumeMemory(options, now)
  }
}

/**
 * Vercel sets `x-real-ip` at its trusted edge. Other forwarding headers are
 * only consulted when the deployment explicitly declares a trusted proxy.
 */
export function requestClientIp(request: Request): string {
  if (process.env.VERCEL === "1") {
    const realIp = request.headers.get("x-real-ip")?.trim()
    if (realIp) return realIp
  }

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim()
      if (first) return first
    }
    const realIp = request.headers.get("x-real-ip")?.trim()
    if (realIp) return realIp
  }

  return "untrusted-client"
}

export function rateLimitKey(...parts: string[]): string {
  return parts.filter(Boolean).join(":")
}

