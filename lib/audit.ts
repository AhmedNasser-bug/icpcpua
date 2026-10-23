import { adminDb } from "@/lib/firebase-admin"

type AuditActorType = "admin" | "trainee" | "system"

export interface AuditEvent {
  type: string
  actorType: AuditActorType
  actorUid?: string | null
  targetType: "trainee" | "codeforces_link" | "sync_run" | "configuration"
  targetId?: string | null
  outcome: "success" | "rejected" | "failed"
  detail?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

/**
 * Best-effort security audit trail. Failures here must never weaken or abort
 * the primary authorization decision.
 */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  if (!adminDb) return

  try {
    await adminDb.collection("admin_audit").add({
      type: event.type,
      actorType: event.actorType,
      actorUid: event.actorUid ?? null,
      targetType: event.targetType,
      targetId: event.targetId ?? null,
      outcome: event.outcome,
      detail: event.detail ?? null,
      metadata: event.metadata ?? {},
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to record audit event", { type: event.type, error })
  }
}
