import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { validateServerEnv } from "@/lib/server-env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FIRESTORE_TIMEOUT_MS = 2500

async function firestoreReachable(): Promise<boolean> {
  if (!adminDb) return false

  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    const check = adminDb.collection("trainees").limit(1).get()
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), FIRESTORE_TIMEOUT_MS)
    })
    await Promise.race([check, timeout])
    return true
  } catch {
    return false
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function GET() {
  const configuration = validateServerEnv()
  const firestore = await firestoreReachable()
  const ready = configuration.ok && firestore

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        configuration: configuration.ok ? "ok" : "invalid",
        firestore: firestore ? "ok" : "unavailable",
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  )
}
