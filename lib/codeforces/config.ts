const DEFAULT_SYNC_INTERVAL_HOURS = 6
const DEFAULT_CRON_BATCH_SIZE = 10
const DEFAULT_MANUAL_COOLDOWN_MS = 30_000
const DEFAULT_LOCK_TTL_MS = 120_000
const DEFAULT_RETRY_DELAY_MS = 3_600_000
const DEFAULT_TIME_BUDGET_MS = 45_000
const DEFAULT_MIN_ATTEMPT_MS = 20_000
const DEFAULT_LOCK_ACQUIRE_RETRIES = 3

function positiveEnvInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function nonNegativeEnvInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function codeforcesSyncIntervalHours(): number {
  return positiveEnvInt("CODEFORCES_SYNC_INTERVAL_HOURS", DEFAULT_SYNC_INTERVAL_HOURS)
}

export function codeforcesSyncIntervalMs(): number {
  return codeforcesSyncIntervalHours() * 60 * 60 * 1000
}

export function codeforcesStaleAfterMs(): number {
  return codeforcesSyncIntervalMs() * 2
}

export function codeforcesCronBatchSize(): number {
  return positiveEnvInt("CODEFORCES_SYNC_BATCH_SIZE", DEFAULT_CRON_BATCH_SIZE)
}

export function codeforcesManualCooldownMs(): number {
  return positiveEnvInt("CODEFORCES_MANUAL_COOLDOWN_MS", DEFAULT_MANUAL_COOLDOWN_MS)
}

export function codeforcesSyncLockTtlMs(): number {
  return positiveEnvInt("CODEFORCES_SYNC_LOCK_TTL_MS", DEFAULT_LOCK_TTL_MS)
}

export function codeforcesLockHeartbeatMs(): number {
  const ttl = codeforcesSyncLockTtlMs()
  return positiveEnvInt("CODEFORCES_LOCK_HEARTBEAT_MS", Math.max(10_000, Math.floor(ttl / 3)))
}

export function codeforcesLockAcquireRetries(): number {
  return nonNegativeEnvInt(
    "CODEFORCES_LOCK_ACQUIRE_RETRIES",
    DEFAULT_LOCK_ACQUIRE_RETRIES
  )
}

export function codeforcesLockRetryBaseMs(): number {
  return positiveEnvInt("CODEFORCES_LOCK_RETRY_BASE_MS", 100)
}

export function codeforcesRetryDelayMs(): number {
  return positiveEnvInt("CODEFORCES_RETRY_DELAY_MS", DEFAULT_RETRY_DELAY_MS)
}

export function codeforcesCronScanLimit(): number {
  return positiveEnvInt("CODEFORCES_SYNC_SCAN_LIMIT", 500)
}

export function codeforcesCronTimeBudgetMs(): number {
  return positiveEnvInt("CODEFORCES_SYNC_TIME_BUDGET_MS", DEFAULT_TIME_BUDGET_MS)
}

export function codeforcesCronMinAttemptMs(): number {
  return positiveEnvInt("CODEFORCES_SYNC_MIN_ATTEMPT_MS", DEFAULT_MIN_ATTEMPT_MS)
}

/** The deployed route declares `maxDuration = 60`; keep the budget below it. */
export function codeforcesCronMaxDurationSeconds(): number {
  return positiveEnvInt("CODEFORCES_CRON_MAX_DURATION_SECONDS", 60)
}
