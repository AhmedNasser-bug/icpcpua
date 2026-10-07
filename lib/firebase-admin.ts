import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore"

function getFirebaseAdminApp(): App | null {
  const currentApps = getApps()
  if (currentApps.length > 0) {
    return currentApps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } catch (e) {
      console.error("Firebase admin cert init failed:", e)
    }
  }

  if (projectId) {
    try {
      return initializeApp({ projectId })
    } catch (e) {
      console.error("Firebase admin project init failed:", e)
    }
  }

  return null
}

const adminApp = getFirebaseAdminApp()
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null
export { FieldValue }
