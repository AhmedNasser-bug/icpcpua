import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  Auth,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyMockDevKey1234567890abcdef",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "icpcpua-community.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "icpcpua-community",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "icpcpua-community.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "100000000001",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:100000000001:web:abcdef1234567890",
}

// Initialize Firebase client safely for SSR/Edge/Client
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Client Firestore
export const db: Firestore = getFirestore(app)

// Client Firebase Authentication
export const auth: Auth = getAuth(app)

// Auth Providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: "select_account" })

export const githubProvider = new GithubAuthProvider()
