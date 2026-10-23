"use client"

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import {
  browserLocalPersistence,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth"

interface FirebaseClientConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

/**
 * Firebase client configuration is public by design. It is deliberately
 * separate from the server-only service-account credentials.
 */
function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim()
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()

  if (!apiKey || !authDomain || !projectId || !appId) return null
  return { apiKey, authDomain, projectId, appId }
}

export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig() !== null
}

function firebaseApp(): FirebaseApp {
  const config = getFirebaseClientConfig()
  if (!config) {
    throw new Error("Firebase client authentication is not configured.")
  }

  return getApps().length > 0 ? getApp() : initializeApp(config)
}

function getFirebaseAuth(): Auth | null {
  if (!isFirebaseClientConfigured()) return null
  return getAuth(firebaseApp())
}

export async function signInFirebaseUser(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error("Firebase client authentication is not configured.")

  await setPersistence(auth, browserLocalPersistence)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function getFirebaseIdToken(
  user: User,
  forceRefresh = false
): Promise<string> {
  return user.getIdToken(forceRefresh)
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error("Firebase client authentication is not configured.")
  await sendPasswordResetEmail(auth, email)
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth) await signOut(auth)
}

export function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    error !== null && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : ""

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email. Sign in instead."
    case "auth/invalid-email":
      return "Enter a valid email address."
    case "auth/weak-password":
      return "Choose a password with at least 8 characters."
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect."
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again."
    case "auth/user-disabled":
      return "This account has been disabled. Contact the training team."
    case "auth/network-request-failed":
      return "Could not reach the authentication service. Check your connection."
    case "auth/requires-recent-login":
      return "Sign in again before completing this action."
    default:
      return "Authentication failed. Please try again."
  }
}
