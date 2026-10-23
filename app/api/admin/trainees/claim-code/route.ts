import { NextResponse } from "next/server"
import { recordAuditEvent } from "@/lib/audit"
import { rejectCrossOrigin, requireAdmin } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"
import { asObject, readJsonBody, RequestBodyError } from "@/lib/http"
import { normalizeUniversityId } from "@/lib/ids"
import { generateClaimCode, hashClaimCode } from "@/lib/legacy-claim"
import { legacyClaimConfiguration } from "@/lib/server-env"

export const runtime = "nodejs"

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store")
  return response
}

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req)
  if (crossOrigin) return crossOrigin

  const admin = await requireAdmin(req)
  if (!admin.ok) return admin.response

  const claim = legacyClaimConfiguration()
  if (!claim.enabled || !claim.secret) {
    return noStore(
      NextResponse.json(
        {
          success: false,
          error: "The legacy claim flow is disabled or past its deadline.",
        },
        { status: 404 }
      )
    )
  }

  if (!adminDb) {
    return noStore(
      NextResponse.json(
        { success: false, simulated: true, error: "Claim codes need a database." },
        { status: 503 }
      )
    )
  }

  try {
    const body = asObject(await readJsonBody(req))
    const rawTraineeId = typeof body.traineeId === "string" ? body.traineeId.trim() : ""
    const traineeId = rawTraineeId ? normalizeUniversityId(rawTraineeId) : ""
    if (!traineeId) {
      return noStore(
        NextResponse.json({ success: false, error: "A valid traineeId is required." }, { status: 400 })
      )
    }

    const ref = adminDb.collection("trainees").doc(traineeId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      return noStore(
        NextResponse.json({ success: false, error: "Trainee record was not found." }, { status: 404 })
      )
    }

    const trainee = snapshot.data()!
    if (typeof trainee.authUid === "string" && trainee.authUid) {
      return noStore(
        NextResponse.json(
          { success: false, error: "This trainee is already linked to a Firebase account." },
          { status: 409 }
        )
      )
    }

    const code = generateClaimCode()
    const expiresAt = new Date(
      Math.min(Date.now() + 60 * 60 * 1000, claim.deadline ?? Number.POSITIVE_INFINITY)
    ).toISOString()

    await ref.set(
      {
        authClaimCodeHash: hashClaimCode(claim.secret, traineeId, code),
        authClaimExpiresAt: expiresAt,
        authClaimCreatedAt: new Date().toISOString(),
        authClaimCreatedBy: admin.auth.uid,
      },
      { merge: true }
    )

    await recordAuditEvent({
      type: "admin.claim_code_created",
      actorType: "admin",
      actorUid: admin.auth.uid,
      targetType: "trainee",
      targetId: traineeId,
      outcome: "success",
      detail: "legacy_claim_code",
      metadata: { expiresAt },
    })

    return noStore(
      NextResponse.json({
        success: true,
        traineeId,
        claimCode: code,
        expiresAt,
        warning: "This code is shown once. Deliver it through a trusted channel.",
      })
    )
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return noStore(
        NextResponse.json({ success: false, error: error.message }, { status: error.status })
      )
    }
    console.error("Claim code creation error:", error)
    return noStore(
      NextResponse.json({ success: false, error: "Failed to create a claim code." }, { status: 500 })
    )
  }
}

export const dynamic = "force-dynamic"
