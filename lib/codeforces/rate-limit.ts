import { adminDb } from "@/lib/firebase-admin"
import { isProductionRuntime } from "@/lib/server-env"

const DEFAULT_MIN_INTERVAL_MS = 2000
const DEFAULT_MAX_WAIT_MS = 120_000
const RATE_LIMIT_DOCUMENT = "codeforces_rate_limit"

export type CodeforcesCoordinationCode =
  | "coordination_unavailable"
  | "reservation_busy"

export class CodeforcesCoordinationError extends Error {
  readonly code: CodeforcesCoordinationCode
  readonly retryable = true
  readonly retryAfterSeconds: number | null

  constructor(
    code: CodeforcesCoordinationCode,
    message: string,
    options: { retryAfterSeconds?: number; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause })
    this.name = "CodeforcesCoordinationError"
    this.code = code
    this.retryAfterSeconds = options.retryAfterSeconds ?? null
  }
}

let memoryNextAllowedAt = 0
let memoryQueue: Promise<void> = Promise.resolve()

function codeforcesMinIntervalMs(): number {
  const parsed = Number.parseInt(process.env.CODEFORCES_MIN_INTERVAL_MS ?? "", 10)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MIN_INTERVAL_MS
  return parsed
}

function maxWaitMs(): number {
  const parsed = Number.parseInt(process.env.CODEFORCES_RATE_LIMIT_MAX_WAIT_MS ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_WAIT_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type Reservation =
  | { kind: "reserved"; slot: number }
  | { kind: "busy"; retryAfterMs: number }

async function reserveDistributedSlot(
  intervalMs: number,
  now: number,
  waitLimitMs: number
): Promise<Reservation> {
  if (!adminDb) {
    throw new CodeforcesCoordinationError(
      "coordination_unavailable",
      "Shared Codeforces rate-limit storage is not configured."
    )
  }

  const ref = adminDb.collection("system_state").doc(RATE_LIMIT_DOCUMENT)
  try {
    return await adminDb.runTransaction<Reservation>(async (transaction) => {
      const snapshot = await transaction.get(ref)
      const data = snapshot.exists ? snapshot.data() : undefined
      const nextAllowedAt =
        typeof data?.nextAllowedAt === "number" && Number.isFinite(data.nextAllowedAt)
          ? data.nextAllowedAt
          : 0
      const slot = Math.max(now, nextAllowedAt)

      if (slot - now > waitLimitMs) {
        return { kind: "busy", retryAfterMs: slot - now }
      }

      transaction.set(
        ref,
        {
          nextAllowedAt: slot + intervalMs,
          updatedAt: new Date(now).toISOString(),
        },
        { merge: true }
      )
      return { kind: "reserved", slot }
    })
  } catch (error) {
    if (error instanceof CodeforcesCoordinationError) throw error
    throw new CodeforcesCoordinationError(
      "coordination_unavailable",
      "Shared Codeforces rate limiting is temporarily unavailable.",
      { cause: error }
    )
  }
}

async function acquireViaMemory(intervalMs: number, now: number): Promise<number> {
  const slot = Math.max(now, memoryNextAllowedAt)
  memoryNextAllowedAt = slot + intervalMs
  return slot
}

/**
 * Reserve a slot in the shared Codeforces request window. Firestore is the
 * only production coordination mechanism. A failed transaction or a missing
 * database in production aborts the request before any Codeforces call.
 */
export async function acquireCodeforcesRateLimitSlot(
  options: { now?: number } = {}
): Promise<void> {
  const intervalMs = codeforcesMinIntervalMs()
  if (intervalMs === 0) return

  const previous = memoryQueue
  let release!: () => void
  memoryQueue = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous
  try {
    const now = options.now ?? Date.now()

    if (!adminDb) {
      if (isProductionRuntime()) {
        throw new CodeforcesCoordinationError(
          "coordination_unavailable",
          "Shared Codeforces rate limiting is not configured in production."
        )
      }
      const slot = await acquireViaMemory(intervalMs, now)
      const delay = slot - Date.now()
      if (delay > 0) await sleep(delay)
      return
    }

    const reservation = await reserveDistributedSlot(intervalMs, now, maxWaitMs())
    if (reservation.kind === "busy") {
      throw new CodeforcesCoordinationError(
        "reservation_busy",
        "The Codeforces request window is saturated. Retry later.",
        { retryAfterSeconds: Math.max(1, Math.ceil(reservation.retryAfterMs / 1000)) }
      )
    }

    const delay = reservation.slot - Date.now()
    if (delay > 0) await sleep(delay)
  } finally {
    release()
  }
}

export function resetCodeforcesRateLimitForTests(): void {
  memoryNextAllowedAt = 0
  memoryQueue = Promise.resolve()
}
