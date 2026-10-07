import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { TraineeDocument, PointEventDocument } from "@/lib/firebase-schema"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      fullName,
      universityId,
      email,
      phone,
      academicYear,
      track,
      codeforcesHandle,
      authUid,
      authProvider,
    } = body

    // 1. Validate minimal required fields (ultra-lean registration)
    if (!fullName || !universityId || !track) {
      return NextResponse.json(
        { success: false, error: "Full Name, University ID, and Track selection are required." },
        { status: 400 }
      )
    }

    const cleanUniId = String(universityId).trim()
    const cleanCfHandle = String(codeforcesHandle || "").trim().replace(/^@/, "")
    const cleanEmail = String(email || `${cleanUniId}@pua.edu.eg`).trim().toLowerCase()
    const cleanPhone = String(phone || "Not provided").trim()
    const cleanName = String(fullName).trim()
    const finalYear = academicYear || "Year 1"
    const finalTrack = track === "level_2" ? "level_2" : "level_1"

    // 2. Check if Firebase Admin is available
    if (!adminDb) {
      console.warn("Firebase Admin DB is not configured. Returning simulated registration success.")
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Registration received (development fallback mode).",
        trainee: {
          id: cleanUniId,
          authUid: authUid || `sim_${cleanUniId}`,
          authProvider: authProvider || "mock",
          fullName: cleanName,
          universityId: cleanUniId,
          email: cleanEmail,
          phone: cleanPhone,
          academicYear: finalYear,
          track: finalTrack,
          codeforcesHandle: cleanCfHandle,
          pointsTotal: 10,
          status: "active",
        },
      })
    }

    // 3. Check for existing trainee by University ID
    const traineeRef = adminDb.collection("trainees").doc(cleanUniId)
    const existingDoc = await traineeRef.get()

    const now = new Date().toISOString()
    const initialPoints = 10 // Welcome points for signing up

    if (existingDoc.exists) {
      // If trainee exists, update their authUid and info without throwing duplicate error
      const existingData = existingDoc.data() as TraineeDocument
      const updatedData: Partial<TraineeDocument> = {
        authUid: authUid || existingData.authUid,
        authProvider: authProvider || existingData.authProvider,
        fullName: cleanName || existingData.fullName,
        email: cleanEmail || existingData.email,
        track: finalTrack,
        updatedAt: now,
      }
      if (cleanCfHandle) {
        updatedData.codeforcesHandle = cleanCfHandle
      }
      await traineeRef.update(updatedData)

      return NextResponse.json({
        success: true,
        message: "Cadet profile updated and linked successfully!",
        trainee: { ...existingData, ...updatedData },
      })
    }

    const newTrainee: TraineeDocument = {
      id: cleanUniId,
      authUid: authUid || undefined,
      authProvider: authProvider || undefined,
      fullName: cleanName,
      universityId: cleanUniId,
      email: cleanEmail,
      phone: cleanPhone,
      academicYear: finalYear,
      track: finalTrack,
      codeforcesHandle: cleanCfHandle || undefined,
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
