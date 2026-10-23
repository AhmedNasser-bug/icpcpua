import { NextResponse } from "next/server"
import { requireTrainee } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import { getTraineeStandings } from "@/lib/leaderboard"
import { readTraineeSessionCookie } from "@/lib/trainee-session"

export async function GET(req: Request) {
  if (!adminDb && readTraineeSessionCookie(req)) {
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Leaderboard standings need a configured database.",
      },
      { status: 503 }
    )
  }

  const authenticated = await requireTrainee(req)
  if (!authenticated.ok) return authenticated.response

  if (!adminDb) {
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        error: "Leaderboard standings need a configured database.",
      },
      { status: 503 }
    )
  }

  try {
    const standings = await getTraineeStandings(authenticated.auth.traineeId)
    if (!standings.global && !standings.track) {
      return NextResponse.json(
        { success: false, error: "Trainee record was not found." },
        { status: 404 }
      )
    }

    const response = NextResponse.json({ success: true, standings })
    response.headers.set("Cache-Control", "no-store")
    response.headers.set("Vary", "Cookie")
    return response
  } catch (error) {
    console.error("Personal leaderboard fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load your leaderboard standing." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
