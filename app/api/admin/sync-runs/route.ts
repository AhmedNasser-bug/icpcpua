import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import {
  listRecentSyncRuns,
  markStaleSyncRuns,
  type SyncRunDocument,
} from "@/lib/codeforces/sync-runs"

export const runtime = "nodejs"

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function parseLimit(value: string | null): number {
  if (!value) return 50
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 50
  return Math.min(Math.max(parsed, 1), 200)
}

function summarize(runs: SyncRunDocument[]) {
  const byStatus: Record<string, number> = {}
  const byErrorCode: Record<string, number> = {}
  let durationTotal = 0
  let durationCount = 0
  let lockContention = 0
  let rateLimitFailures = 0

  for (const run of runs) {
    byStatus[run.status] = (byStatus[run.status] ?? 0) + 1
    if (run.errorCode) {
      byErrorCode[run.errorCode] = (byErrorCode[run.errorCode] ?? 0) + 1
    }
    if (typeof run.durationMs === "number") {
      durationTotal += run.durationMs
      durationCount += 1
    }
    if (run.errorCode === "lock_contended") lockContention += 1
    if (run.errorCode === "rate_limit_unavailable") rateLimitFailures += 1
  }

  return {
    total: runs.length,
    byStatus,
    byErrorCode,
    averageDurationMs:
      durationCount > 0 ? Math.round(durationTotal / durationCount) : null,
    lockContention,
    rateLimitFailures,
  }
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return admin.response

  if (!adminDb) {
    return noStore(
      NextResponse.json(
        { success: false, simulated: true, error: "Sync run reporting needs a database." },
        { status: 503 }
      )
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseLimit(searchParams.get("limit"))
    const staleRunsRecovered = await markStaleSyncRuns()
    const runs = await listRecentSyncRuns(limit)

    let remainingDue: number | null = null
    try {
      const due = await adminDb
        .collection("trainees")
        .where("cfNextSyncAt", "<=", new Date().toISOString())
        .count()
        .get()
      remainingDue = due.data().count
    } catch {
      remainingDue = null
    }

    return noStore(
      NextResponse.json({
        success: true,
        summary: { ...summarize(runs), staleRunsRecovered, remainingDue },
        runs,
      })
    )
  } catch (error) {
    console.error("Sync run reporting error:", error)
    return noStore(
      NextResponse.json({ success: false, error: "Failed to load sync runs." }, { status: 500 })
    )
  }
}

export const dynamic = "force-dynamic"
