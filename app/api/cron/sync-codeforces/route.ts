import { NextResponse } from "next/server"
import { isCronAuthorized, unauthorizedResponse } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import {
  codeforcesCronMaxDurationSeconds,
  codeforcesCronTimeBudgetMs,
} from "@/lib/codeforces/config"
import { syncDueCodeforcesAccounts } from "@/lib/codeforces/sync"

export const runtime = "nodejs"
export const maxDuration = 60

const ROUTE_MAX_DURATION_SECONDS = maxDuration

function boundedTimeBudget(): number {
  const configured = Math.min(
    codeforcesCronMaxDurationSeconds(),
    ROUTE_MAX_DURATION_SECONDS
  )
  const maxMs = Math.max(5_000, (configured - 10) * 1000)
  return Math.min(codeforcesCronTimeBudgetMs(), maxMs)
}

async function run(req: Request) {
  if (!isCronAuthorized(req)) return unauthorizedResponse()

  if (!adminDb) {
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Codeforces synchronization needs a configured database.",
      },
      { status: 503 }
    )
  }

  try {
    const result = await syncDueCodeforcesAccounts({
      timeBudgetMs: boundedTimeBudget(),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Codeforces cron sync error:", error)
    return NextResponse.json(
      { success: false, error: "Codeforces synchronization batch failed." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return run(req)
}

export async function POST(req: Request) {
  return run(req)
}

export const dynamic = "force-dynamic"
