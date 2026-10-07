import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { TraineeDocument } from "@/lib/firebase-schema"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const uid = searchParams.get("uid")

    if (!email && !uid) {
      return NextResponse.json(
        { success: false, error: "Please provide either email or uid query parameter." },
        { status: 400 }
      )
    }

    if (!adminDb) {
      // Mock trainee in dev mode
      return NextResponse.json({
        success: true,
        mock: true,
        trainee: null,
      })
    }

    let trainee: TraineeDocument | null = null

    // 1. Try querying by authUid
    if (uid) {
      const snap = await adminDb
        .collection("trainees")
        .where("authUid", "==", uid)
        .limit(1)
        .get()

      if (!snap.empty) {
        trainee = snap.docs[0].data() as TraineeDocument
      }
    }

    // 2. If not found by uid, query by email
    if (!trainee && email) {
      const snap = await adminDb
        .collection("trainees")
        .where("email", "==", email.toLowerCase().trim())
        .limit(1)
        .get()

      if (!snap.empty) {
        trainee = snap.docs[0].data() as TraineeDocument
      }
    }

    return NextResponse.json({
      success: true,
      trainee,
    })
  } catch (error: any) {
    console.error("Fetch trainee profile error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch trainee profile." },
      { status: 500 }
    )
  }
}
