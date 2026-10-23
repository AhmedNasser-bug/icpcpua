import { NextResponse } from "next/server"
import { rejectCrossOrigin, requireAdmin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import {
  ReconcileConflictError,
  repairMissingRegistryEntry,
  runCodeforcesReconciliation,
} from "@/lib/codeforces/reconcile"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { normalizeUniversityId } from "@/lib/ids"

export const runtime = "nodejs"
export const maxDuration = 60

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

function parseInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin.ok) return admin.response

  if (!adminDb) {
    return noStore(
      NextResponse.json(
        { success: false, simulated: true, error: "Reconciliation needs a database." },
        { status: 503 }
      )
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const report = await runCodeforcesReconciliation({
      cursor: searchParams.get("cursor"),
      pageSize: parseInteger(searchParams.get("pageSize"), 250, 1, 500),
      maxTrainees: parseInteger(searchParams.get("maxTrainees"), 2000, 1, 10_000),
      maxIssues: parseInteger(searchParams.get("maxIssues"), 500, 1, 2000),
    })

    return noStore(NextResponse.json({ success: true, report }))
  } catch (error) {
    console.error("Codeforces reconciliation error:", error)
    return noStore(
      NextResponse.json({ success: false, error: "Reconciliation failed." }, { status: 500 })
    )
  }
}

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  const admin = await requireAdmin(req)
  if (!admin.ok) return admin.response

  if (!adminDb) {
    return noStore(
      NextResponse.json(
        { success: false, simulated: true, error: "Reconciliation needs a database." },
        { status: 503 }
      )
    )
  }

  try {
    const body = asObject(await readJsonBody(req))
    const dryRun = body.dryRun !== false
    const action = typeof body.action === "string" ? body.action : ""
    const rawTraineeId = typeof body.traineeId === "string" ? body.traineeId.trim() : ""
    const traineeId = rawTraineeId ? normalizeUniversityId(rawTraineeId) : ""

    if (dryRun) {
      const report = await runCodeforcesReconciliation({
        pageSize: 250,
        maxTrainees: 2000,
        maxIssues: 500,
      })
      return noStore(NextResponse.json({ success: true, dryRun: true, report }))
    }

    if (action !== "repair_missing_registry") {
      return noStore(
        NextResponse.json(
          {
            success: false,
            error: "Only the repair_missing_registry action is supported; no data was changed.",
          },
          { status: 400 }
        )
      )
    }

    if (!traineeId) {
      return noStore(
        NextResponse.json({ success: false, error: "A valid traineeId is required." }, { status: 400 })
      )
    }

    const result = await repairMissingRegistryEntry({
      traineeId,
      actorUid: admin.auth.uid,
    })

    return noStore(
      NextResponse.json({
        success: true,
        dryRun: false,
        repair: result,
        message: result.repaired
          ? "The missing registry entry was created."
          : result.reason === "trainee_not_found"
            ? "Trainee record was not found."
            : result.reason === "invalid_handle"
              ? "The trainee does not have a valid Codeforces handle."
              : "No repair was needed.",
      })
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return noStore(
        NextResponse.json({ success: false, error: error.message }, { status: error.status })
      )
    }
    if (error instanceof ReconcileConflictError) {
      return noStore(
        NextResponse.json({ success: false, error: error.message }, { status: 409 })
      )
    }
    console.error("Codeforces reconciliation repair error:", error)
    return noStore(
      NextResponse.json({ success: false, error: "Reconciliation repair failed." }, { status: 500 })
    )
  }
}

export const dynamic = "force-dynamic"
