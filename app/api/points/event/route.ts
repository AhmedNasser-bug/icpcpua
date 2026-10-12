import { NextResponse } from "next/server"
import type { UpdateData } from "firebase-admin/firestore"
import { adminDb, FieldValue } from "@/lib/firebase-admin"
import {
  POINT_EVENT_TYPES,
  PointEventType,
  PointEventDocument,
  TraineeDocument,
} from "@/lib/firebase-schema"
import { getErrorMessage } from "@/lib/errors"

const MAX_POINTS_PER_EVENT = 1000

function isPointEventType(value: unknown): value is PointEventType {
  return typeof value === "string" && (POINT_EVENT_TYPES as readonly string[]).includes(value)
}

function isAuthorized(req: Request) {
  const secret = process.env.POINTS_EVENT_SECRET
  if (!secret) return true
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
    }

    const body = await req.json()
    const { universityId, type, points, reason, metadata } = body

    if (!universityId || !type || typeof points !== "number" || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: universityId, type, points, reason" },
        { status: 400 }
      )
    }

    if (!isPointEventType(type)) {
      return NextResponse.json(
        { success: false, error: `Unknown point event type: ${String(type)}` },
        { status: 400 }
      )
    }

    if (!Number.isInteger(points) || Math.abs(points) > MAX_POINTS_PER_EVENT) {
      return NextResponse.json(
        {
          success: false,
          error: `Points must be an integer between -${MAX_POINTS_PER_EVENT} and ${MAX_POINTS_PER_EVENT}.`,
        },
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
      type,
      points,
      reason,
      metadata: metadata || {},
      createdAt: now,
    }

    // 3. Atomically update trainee's total score + push event to immutable ledger
    const batch = adminDb.batch()
    batch.set(eventRef, eventData)

    const updatePayload: UpdateData<TraineeDocument> = {
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
  } catch (error) {
    console.error("Point event processing error:", error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to log point event.") },
      { status: 500 }
    )
  }
}
