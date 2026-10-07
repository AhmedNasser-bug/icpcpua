import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { TraineeDocument, PointEventDocument } from "@/lib/firebase-schema"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fullName, universityId, email, phone, academicYear, track, codeforcesHandle } = body

    // 1. Validate required fields (Lean registration)
    if (!fullName || !universityId || !email || !phone || !academicYear || !track) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields." },
        { status: 400 }
      )
    }

    const cleanUniId = String(universityId).trim()
    const cleanCfHandle = String(codeforcesHandle || "").trim().replace(/^@/, "")
    const cleanEmail = String(email).trim().toLowerCase()
    const cleanPhone = String(phone).trim()
    const cleanName = String(fullName).trim()

    // 2. Check if Firebase Admin is available
    if (!adminDb) {
      console.warn("Firebase Admin DB is not configured (missing environment variables). Returning simulated success.")
      return NextResponse.json({
        success: true,
        message: "Registration received (development fallback mode).",
        trainee: {
          id: `sim_${cleanUniId}`,
          fullName: cleanName,
          universityId: cleanUniId,
          email: cleanEmail,
          phone: cleanPhone,
          academicYear,
          track,
          codeforcesHandle: cleanCfHandle,
          pointsTotal: 10,
          status: "active",
        },
      })
    }

    // 3. Check for existing trainee by University ID
    const traineeRef = adminDb.collection("trainees").doc(cleanUniId)
    const existingDoc = await traineeRef.get()

    if (existingDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "A trainee with this University ID is already registered in the system.",
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const initialPoints = 10 // Welcome points for signing up

    const newTrainee: TraineeDocument = {
      id: cleanUniId,
      fullName: cleanName,
      universityId: cleanUniId,
      email: cleanEmail,
      phone: cleanPhone,
      academicYear,
      track,
      codeforcesHandle: cleanCfHandle,
      status: "active",
      pointsTotal: initialPoints,
      cfRating: 0,
      cfSolvedCount: 0,
      attendedSessionsCount: 0,
      qrScansCount: 0,
      registeredAt: now,
      updatedAt: now,
    }

    // 4. Batch write: save Trainee + create initial PointEvent audit ledger
    const batch = adminDb.batch()
    batch.set(traineeRef, newTrainee)

    const eventRef = adminDb.collection("point_events").doc()
    const welcomeEvent: PointEventDocument = {
      id: eventRef.id,
      traineeId: cleanUniId,
      universityId: cleanUniId,
      type: "registration_welcome",
      points: initialPoints,
      reason: "Initial onboarding & profile creation bonus",
      createdAt: now,
    }
    batch.set(eventRef, welcomeEvent)

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: "Trainee registered successfully! +10 welcome points added to your leaderboard standing.",
      trainee: newTrainee,
    })
  } catch (error: any) {
    console.error("Trainee registration error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error occurred." },
      { status: 500 }
    )
  }
}
