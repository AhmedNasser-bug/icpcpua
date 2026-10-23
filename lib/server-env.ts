/**
 * Runtime configuration validation. Secrets are never included in the
 * validation result; only the variable names and a safe reason are returned.
 */

export type ServerEnv = Record<string, string | undefined>

export interface ServerEnvIssue {
  variable: string
  message: string
}

export interface ServerEnvValidation {
  ok: boolean
  production: boolean
  errors: ServerEnvIssue[]
  warnings: ServerEnvIssue[]
}

export class ServerConfigurationError extends Error {
  readonly issues: ServerEnvIssue[]

  constructor(issues: ServerEnvIssue[]) {
    super(
      `Server configuration is invalid: ${issues.map((issue) => issue.variable).join(", ")}`
    )
    this.name = "ServerConfigurationError"
    this.issues = issues
  }
}

export function isProductionRuntime(env: ServerEnv = process.env): boolean {
  return env.NODE_ENV === "production"
}

function nonEmpty(env: ServerEnv, name: string): string | null {
  const value = env[name]?.trim()
  return value ? value : null
}

function validateFirebaseAdmin(env: ServerEnv, production: boolean): ServerEnvIssue[] {
  const projectId = nonEmpty(env, "FIREBASE_PROJECT_ID") ?? nonEmpty(env, "NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  const clientEmail = nonEmpty(env, "FIREBASE_CLIENT_EMAIL")
  const privateKey = nonEmpty(env, "FIREBASE_PRIVATE_KEY")

  if (!production) {
    if (!projectId && (clientEmail || privateKey)) {
      return [{ variable: "FIREBASE_PROJECT_ID", message: "is required when admin credentials are provided." }]
    }
    return []
  }

  const issues: ServerEnvIssue[] = []
  if (!projectId) {
    issues.push({ variable: "FIREBASE_PROJECT_ID", message: "is required in production." })
  } else if (!/^[a-z0-9][a-z0-9-]{4,62}$/.test(projectId)) {
    issues.push({ variable: "FIREBASE_PROJECT_ID", message: "is not a valid Firebase project id." })
  }

  if (!clientEmail) {
    issues.push({ variable: "FIREBASE_CLIENT_EMAIL", message: "is required in production." })
  } else if (!/^[^@\s]+@[^@\s]+$/.test(clientEmail)) {
    issues.push({ variable: "FIREBASE_CLIENT_EMAIL", message: "must be a service-account email address." })
  }

  if (!privateKey) {
    issues.push({ variable: "FIREBASE_PRIVATE_KEY", message: "is required in production." })
  } else if (!/BEGIN (RSA )?PRIVATE KEY/.test(privateKey.replace(/\\n/g, "\n"))) {
    issues.push({
      variable: "FIREBASE_PRIVATE_KEY",
      message: "must contain a PEM private key (literal \\n sequences are accepted).",
    })
  }

  return issues
}

function validateFirebaseClient(env: ServerEnv, production: boolean): ServerEnvIssue[] {
  const issues: ServerEnvIssue[] = []
  const required = production
    ? ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"]
    : []

  for (const variable of required) {
    if (!nonEmpty(env, variable)) {
      issues.push({ variable, message: "is required in production for trainee authentication." })
    }
  }

  const authDomain = nonEmpty(env, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")
  if (authDomain && !/^[a-z0-9.-]+$/i.test(authDomain)) {
    issues.push({ variable: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", message: "is not a valid hostname." })
  }

  return issues
}

function validateSecrets(env: ServerEnv, production: boolean): { errors: ServerEnvIssue[]; warnings: ServerEnvIssue[] } {
  const errors: ServerEnvIssue[] = []
  const warnings: ServerEnvIssue[] = []
  const cronSecret = nonEmpty(env, "CRON_SECRET")
  const cfSyncSecret = nonEmpty(env, "CF_SYNC_SECRET")

  if (production && !cronSecret) {
    errors.push({ variable: "CRON_SECRET", message: "is required in production for scheduled synchronization." })
  }
  if (production && !nonEmpty(env, "POINTS_EVENT_SECRET")) {
    errors.push({
      variable: "POINTS_EVENT_SECRET",
      message: "is required in production because it authorizes point ledger writes.",
    })
  }
  if (production && cronSecret && cronSecret.length < 16) {
    warnings.push({ variable: "CRON_SECRET", message: "should be at least 16 characters." })
  }
  if (cfSyncSecret && cfSyncSecret.length < 16) {
    warnings.push({ variable: "CF_SYNC_SECRET", message: "should be at least 16 characters when used." })
  }
  if (cfSyncSecret && cronSecret && cfSyncSecret === cronSecret) {
    warnings.push({
      variable: "CF_SYNC_SECRET",
      message: "duplicates CRON_SECRET; use distinct machine credentials where possible.",
    })
  }

  const claimEnabled = env.TRAINEE_LEGACY_CLAIM_ENABLED === "true"
  if (claimEnabled) {
    const deadline = nonEmpty(env, "TRAINEE_LEGACY_CLAIM_DEADLINE")
    const claimSecret = nonEmpty(env, "TRAINEE_CLAIM_SECRET")
    if (!deadline) {
      errors.push({
        variable: "TRAINEE_LEGACY_CLAIM_DEADLINE",
        message: "is required while the legacy claim flow is enabled.",
      })
    } else {
      const parsed = Date.parse(deadline)
      if (!Number.isFinite(parsed)) {
        errors.push({ variable: "TRAINEE_LEGACY_CLAIM_DEADLINE", message: "must be an ISO-8601 date." })
      } else if (parsed <= Date.now()) {
        errors.push({ variable: "TRAINEE_LEGACY_CLAIM_DEADLINE", message: "must be in the future." })
      }
    }
    if (!claimSecret) {
      errors.push({
        variable: "TRAINEE_CLAIM_SECRET",
        message: "is required while the legacy claim flow is enabled.",
      })
    } else if (claimSecret.length < 32) {
      errors.push({ variable: "TRAINEE_CLAIM_SECRET", message: "must be at least 32 characters." })
    }
  }

  if (env.TRAINEE_SESSION_SECRET) {
    warnings.push({
      variable: "TRAINEE_SESSION_SECRET",
      message: "is no longer used by the Firebase session architecture and can be removed.",
    })
  }

  return { errors, warnings }
}

function validateSessionLifetime(env: ServerEnv): { errors: ServerEnvIssue[]; warnings: ServerEnvIssue[] } {
  const raw = nonEmpty(env, "TRAINEE_SESSION_MAX_AGE_SECONDS")
  if (!raw) return { errors: [], warnings: [] }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 300 || parsed > 14 * 24 * 60 * 60) {
    return {
      errors: [
        {
          variable: "TRAINEE_SESSION_MAX_AGE_SECONDS",
          message: "must be between 300 and 1209600 seconds (Firebase session-cookie limit).",
        },
      ],
      warnings: [],
    }
  }
  if (parsed > 7 * 24 * 60 * 60) {
    return {
      errors: [],
      warnings: [
        {
          variable: "TRAINEE_SESSION_MAX_AGE_SECONDS",
          message: "exceeds seven days; consider a shorter session lifetime.",
        },
      ],
    }
  }
  return { errors: [], warnings: [] }
}

export function validateServerEnv(env: ServerEnv = process.env): ServerEnvValidation {
  const production = isProductionRuntime(env)
  const errors: ServerEnvIssue[] = [
    ...validateFirebaseAdmin(env, production),
    ...validateFirebaseClient(env, production),
  ]
  const secrets = validateSecrets(env, production)
  const lifetime = validateSessionLifetime(env)

  errors.push(...secrets.errors, ...lifetime.errors)

  return {
    ok: errors.length === 0,
    production,
    errors,
    warnings: [...secrets.warnings, ...lifetime.warnings],
  }
}

/**
 * Call at the start of runtime-only entry points. It is intentionally not
 * executed at module load time so `next build` does not require runtime
 * secrets. Development and tests keep their documented fallback behaviour.
 */
export function assertRuntimeConfiguration(env: ServerEnv = process.env): void {
  if (!isProductionRuntime(env)) return

  const deployed =
    env.VERCEL === "1" ||
    env.VERCEL_ENV === "production" ||
    env.REQUIRE_PRODUCTION_CONFIG === "true"
  const hasRuntimeConfig = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "CRON_SECRET",
    "POINTS_EVENT_SECRET",
  ].some((name) => Boolean(nonEmpty(env, name)))

  // `next start` is also used by local E2E runs. Preserve the documented
  // credential-free fallback there, but validate every deployed environment or
  // any partially configured runtime.
  if (!deployed && !hasRuntimeConfig) return

  const validation = validateServerEnv(env)
  if (!validation.ok) throw new ServerConfigurationError(validation.errors)
}

export function traineeSessionMaxAgeSeconds(env: ServerEnv = process.env): number {
  const raw = env.TRAINEE_SESSION_MAX_AGE_SECONDS?.trim()
  if (!raw) return 5 * 24 * 60 * 60
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 300 || parsed > 14 * 24 * 60 * 60) {
    return 5 * 24 * 60 * 60
  }
  return parsed
}

export interface LegacyClaimConfiguration {
  enabled: boolean
  deadline: number | null
  secret: string | null
}

export function legacyClaimConfiguration(env: ServerEnv = process.env): LegacyClaimConfiguration {
  const enabled = env.TRAINEE_LEGACY_CLAIM_ENABLED === "true"
  const deadlineRaw = env.TRAINEE_LEGACY_CLAIM_DEADLINE?.trim()
  const deadline = deadlineRaw ? Date.parse(deadlineRaw) : Number.NaN
  const secret = env.TRAINEE_CLAIM_SECRET?.trim() || null

  if (!enabled || !secret || !Number.isFinite(deadline) || deadline <= Date.now()) {
    return { enabled: false, deadline: Number.isFinite(deadline) ? deadline : null, secret: null }
  }

  return { enabled: true, deadline, secret }
}
