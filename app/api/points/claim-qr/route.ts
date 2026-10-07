import { NextResponse } from "next/server"
import { adminDb, FieldValue } from "@/lib/firebase-admin"
import { PointEventDocument } from "@/lib/firebase-schema"

// Valid campaign QR codes and their authorized point rewards
const VALID_QR_CAMPAIGNS: Record<string, { points: number; title: string }> = {
  CAMPUS_BOOTH_DAY1: { points: 10, title: "On-Campus Booth Discovery // Day 1 Challenge" },
  CAMPUS_HALL_B: { points: 10, title: "Building B Lecture Hall Challenge" },
  ORIENTATION_2026: { points: 15, title: "Season 2026 Orientation Attendee Bonus" },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { universityId, code } = body

    if (!universityId || !code) {
      return NextResponse.json(
        { success: false, error: "Please provide both your University ID and the QR challenge code." },
        { status: 400 }
      )
    }

    const cleanUniId = String(universityId).trim()
    const cleanCode = String(code).trim().toUpperCase()

    const campaign = VALID_QR_CAMPAIGNS[cleanCode]
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired QR challenge code." },
        { status: 404 }
      )
    }

    // If Firebase Admin is not yet configured, return mock success
    if (!adminDb) {
      return NextResponse.json({
        success: true,
        mock: true,
        points: campaign.points,
        message: `+${campaign.points} PTS credited to cadet ${cleanUniId} for ${campaign.title} (dev mode)!`,
        campaign: campaign.title,
      })
    }

    // 1. Verify trainee is registered
    const traineeRef = adminDb.collection("trainees").doc(cleanUniId)
    const traineeDoc = await traineeRef.get()

    if (!traineeDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          needsRegistration: true,
          error: "You must be registered in the ICPC PUA squad before claiming challenge points.",
        },
        { status: 404 }
      )
    }

    // 2. Prevent duplicate claim of the same QR challenge by the same student
    const existingClaim = await adminDb
      .collection("point_events")
      .where("universityId", "==", cleanUniId)
      .where("type", "==", "qr_scan")
      .where("metadata.qrCodeId", "==", cleanCode)
      .limit(1)
      .get()

    if (!existingClaim.empty) {
      return NextResponse.json(
        {
          success: false,
          alreadyClaimed: true,
          error: `You have already claimed points for "${campaign.title}". Each challenge code is valid once per cadet.`,
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const eventRef = adminDb.collection("point_events").doc()

    const eventData: PointEventDocument = {
      id: eventRef.id,
      traineeId: cleanUniId,
      universityId: cleanUniId,
      type: "qr_scan",
      points: campaign.points,
      reason: campaign.title,
      metadata: {
        qrCodeId: cleanCode,
      },
      createdAt: now,
    }

    // 3. Atomically credit points and increment scan counter
    const batch = adminDb.batch()
    batch.set(eventRef, eventData)
    batch.update(traineeRef, {
      pointsTotal: FieldValue.increment(campaign.points),
      qrScansCount: FieldValue.increment(1),
      updatedAt: now,
    })

    await batch.commit()

    const updatedTraineeDoc = await traineeRef.get()
    const newTotal = updatedTraineeDoc.data()?.pointsTotal ?? 10

    return NextResponse.json({
      success: true,
      points: campaign.points,
      newTotal,
      message: `Success! +${campaign.points} points awarded. Your total standing is now ${newTotal} PTS.`,
      campaign: campaign.title,
    })
  } catch (error: any) {
    console.error("QR claim error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process QR point claim." },
      { status: 500 }
    )
  }
}
