import { NextResponse } from "next/server"
import {
  getLeaderboard,
  normalizeLeaderboardTrack,
  parseLeaderboardPage,
  parseLeaderboardPageSize,
} from "@/lib/leaderboard"
import { verifyTraineeSession } from "@/lib/trainee-session"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const track = normalizeLeaderboardTrack(searchParams.get("track"))
    const page = parseLeaderboardPage(searchParams.get("page"))
    const pageSize = parseLeaderboardPageSize(
      searchParams.get("pageSize") ?? searchParams.get("limit")
    )
    const session = await verifyTraineeSession(req)
    const viewerId = session.status === "authenticated" ? session.traineeId : null

    const result = await getLeaderboard({ track, page, pageSize, viewerId })
    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store")
    response.headers.set("Vary", "Cookie")
    return response
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load leaderboard." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
