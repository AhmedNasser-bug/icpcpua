import { NextResponse } from "next/server"
import { adminDb, FieldValue } from "@/lib/firebase-admin"
import { PointEventType, PointEventDocument } from "@/lib/firebase-schema"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { universityId, type, points, reason, metadata } = body

    if (!universityId || !type || typeof points !== "number" || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: universityId, type, points, reason" },
        { status: 400 }
      )
    }

    const cleanUniId = String(universityId).trim()

    if (!adminDb) {
      return NextResponse.json({
        success: true,
        message: `Simulated: Awarded ${points} points to ${cleanUniId} (${reason})`,
      })
    }

    // 1. Check if trainee exists
    const traineeRef = adminDb.collection("trainees").doc(cleanUniId)
    const traineeDoc = await traineeRef.get()

    if (!traineeDoc.exists) {
      return NextResponse.json(
        { success: false, error: `Trainee with University ID ${cleanUniId} was not found.` },
        { status: 404 }
      )
    }

    // 2. Prevent duplicate QR scans if qrCodeId is provided
    if (type === "qr_scan" && metadata?.qrCodeId) {
      const existingScan = await adminDb
        .collection("point_events")
        .where("universityId", "==", cleanUniId)
        .where("type", "==", "qr_scan")
        .where("metadata.qrCodeId", "==", metadata.qrCodeId)
        .limit(1)
        .get()

      if (!existingScan.empty) {
        return NextResponse.json(
          { success: false, error: "This QR code has already been claimed by this student." },
          { status: 409 }
        )
      }
    }

    const now = new Date().toISOString()
    const eventRef = adminDb.collection("point_events").doc()

    const eventData: PointEventDocument = {
      id: eventRef.id,
      traineeId: cleanUniId,
      universityId: cleanUniId,
      type: type as PointEventType,
      points,
      reason,
      metadata: metadata || {},
      createdAt: now,
    }

    // 3. Atomically update trainee's total score + push event to immutable ledger
    const batch = adminDb.batch()
    batch.set(eventRef, eventData)

    const updatePayload: Record<string, any> = {
      pointsTotal: FieldValue.increment(points),
      updatedAt: now,
    }

    if (type === "qr_scan") {
      updatePayload.qrScansCount = FieldValue.increment(1)
    } else if (type === "session_attendance") {
      updatePayload.attendedSessionsCount = FieldValue.increment(1)
    }

    batch.update(traineeRef, updatePayload)
    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${points} points event for ${cleanUniId}!`,
      event: eventData,
    })
  } catch (error: any) {
    console.error("Point event processing error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log point event." },
      { status: 500 }
    )
  }
}
