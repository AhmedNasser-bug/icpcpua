import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { TraineeDocument } from "@/lib/firebase-schema"

// Mock seed trainees if DB is empty or during local prototyping
const FALLBACK_LEADERBOARD = [
  {
    rank: 1,
    handle: "algo_queen",
    fullName: "Nourhan Ezzat",
    rating: 2100,
    solved: 540,
    pointsTotal: 1240,
    track: "level_2",
    initials: "NE",
    color: "#FFD500",
  },
  {
    rank: 2,
    handle: "byte_me",
    fullName: "Karim Mostafa",
    rating: 1850,
    solved: 487,
    pointsTotal: 1050,
    track: "level_2",
    initials: "KM",
    color: "#E0E0E0",
  },
  {
    rank: 3,
    handle: "dp_master",
    fullName: "Youssef Tarek",
    rating: 1795,
    solved: 412,
    pointsTotal: 960,
    track: "level_1",
    initials: "YT",
    color: "#FF0055",
  },
  {
    rank: 4,
    handle: "graph_wiz",
    fullName: "Salma Hany",
    rating: 1650,
    solved: 389,
    pointsTotal: 840,
    track: "level_1",
    initials: "SH",
    color: "#00E5FF",
  },
  {
    rank: 5,
    handle: "greedy_guy",
    fullName: "Omar Sherif",
    rating: 1540,
    solved: 345,
    pointsTotal: 720,
    track: "level_1",
    initials: "OS",
    color: "#7B2CBF",
  },
]

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const track = searchParams.get("track") // "all" | "level_1" | "level_2"
    const limitCount = parseInt(searchParams.get("limit") || "50", 10)

    if (!adminDb) {
      // Return filtered fallback data
      const filtered = track && track !== "all"
        ? FALLBACK_LEADERBOARD.filter((u) => u.track === track)
        : FALLBACK_LEADERBOARD

      return NextResponse.json({
        success: true,
        source: "local_cache",
        count: filtered.length,
        leaderboard: filtered,
      })
    }

    let query: FirebaseFirestore.Query = adminDb
      .collection("trainees")
      .where("status", "==", "active")

    if (track && track !== "all") {
      query = query.where("track", "==", track)
    }

    // Order by total points descending
    query = query.orderBy("pointsTotal", "desc").limit(limitCount)

    const snapshot = await query.get()

    if (snapshot.empty) {
      // If collection is empty, gracefully return initial seed leaderboard
      const filtered = track && track !== "all"
        ? FALLBACK_LEADERBOARD.filter((u) => u.track === track)
        : FALLBACK_LEADERBOARD

      return NextResponse.json({
        success: true,
        source: "seed_defaults",
        count: filtered.length,
        leaderboard: filtered,
      })
    }

    const leaderboard = snapshot.docs.map((doc, index) => {
      const data = doc.data() as TraineeDocument
      const initials = (data.fullName || "T")
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()

      const colors = ["#FFD500", "#E0E0E0", "#FF0055", "#00E5FF", "#7B2CBF"]

      return {
        rank: index + 1,
        handle: data.codeforcesHandle ? `@${data.codeforcesHandle}` : `@user_${data.universityId.slice(-4)}`,
        fullName: data.fullName,
        rating: data.cfRating || 0,
        solved: data.cfSolvedCount || 0,
        pointsTotal: data.pointsTotal || 0,
        track: data.track,
        initials: initials || "TR",
        color: colors[index % colors.length],
        universityId: data.universityId,
        attendedSessionsCount: data.attendedSessionsCount || 0,
        qrScansCount: data.qrScansCount || 0,
      }
    })

    return NextResponse.json({
      success: true,
      source: "firestore",
      count: leaderboard.length,
      leaderboard,
    })
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load leaderboard." },
      { status: 500 }
    )
  }
}
