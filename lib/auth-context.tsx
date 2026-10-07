"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth"
import { auth, googleProvider, githubProvider } from "./firebase"
import { TraineeDocument } from "./firebase-schema"

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  phoneNumber: string | null
  photoURL: string | null
  providerId: string
  isMock?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  traineeProfile: TraineeDocument | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<AuthUser | null>
  signInWithGithub: () => Promise<AuthUser | null>
  sendPhoneOtp: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult | null>
  signInWithMockDev: (mockUser: Partial<AuthUser>) => void
  signOutUser: () => Promise<void>
  refreshTraineeProfile: () => Promise<void>
  setTraineeProfile: (profile: TraineeDocument | null) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  traineeProfile: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => null,
  signInWithGithub: async () => null,
  sendPhoneOtp: async () => null,
  signInWithMockDev: () => {},
  signOutUser: async () => {},
  refreshTraineeProfile: async () => {},
  setTraineeProfile: () => {},
})

const MOCK_STORAGE_KEY = "pua_cadet_mock_session"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [traineeProfile, setTraineeProfile] = useState<TraineeDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trainee profile whenever user changes
  const fetchTrainee = async (authUser: AuthUser | null) => {
    if (!authUser) {
      setTraineeProfile(null)
      return
    }

    try {
      // Query profile by authUid or email
      const param = authUser.email ? `email=${encodeURIComponent(authUser.email)}` : `uid=${encodeURIComponent(authUser.uid)}`
      const res = await fetch(`/api/trainees/me?${param}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.trainee) {
          setTraineeProfile(data.trainee)
        }
      }
    } catch {
      // Silently proceed
    }
  }

  useEffect(() => {
    // 1. Check local mock storage if any for fast offline testing
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(MOCK_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          setUser(parsed)
          fetchTrainee(parsed)
          setLoading(false)
        }
      } catch {
        // Ignore cache parse error
      }
    }

    // 2. Firebase live auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          phoneNumber: firebaseUser.phoneNumber,
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerData[0]?.providerId || "firebase",
        }
        setUser(mappedUser)
        fetchTrainee(mappedUser)
        if (typeof window !== "undefined") {
          localStorage.removeItem(MOCK_STORAGE_KEY)
        }
      } else {
        // If not in mock session, clear user
        if (typeof window !== "undefined" && !localStorage.getItem(MOCK_STORAGE_KEY)) {
          setUser(null)
          setTraineeProfile(null)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 1. Google Sign-In
  const signInWithGoogle = async (): Promise<AuthUser | null> => {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const mappedUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        phoneNumber: result.user.phoneNumber,
        photoURL: result.user.photoURL,
        providerId: "google.com",
      }
      setUser(mappedUser)
      await fetchTrainee(mappedUser)
      return mappedUser
    } catch (err: any) {
      console.warn("Firebase Google Auth popup error, falling back if dev:", err)
      const message = err.message || "Failed to sign in with Google."
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 2. GitHub Sign-In
  const signInWithGithub = async (): Promise<AuthUser | null> => {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const mappedUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        phoneNumber: result.user.phoneNumber,
        photoURL: result.user.photoURL,
        providerId: "github.com",
      }
      setUser(mappedUser)
      await fetchTrainee(mappedUser)
      return mappedUser
    } catch (err: any) {
      console.warn("Firebase GitHub Auth error:", err)
      const message = err.message || "Failed to sign in with GitHub."
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 3. Phone Sign-In (SMS OTP)
  const sendPhoneOtp = async (phoneNumber: string, containerId: string): Promise<ConfirmationResult | null> => {
    setError(null)
    try {
      const appVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
      })
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      return confirmationResult
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err)
      setError(err.message || "Failed to send SMS code. Check phone format (+20...).")
      return null
    }
  }

  // 4. Quick Dev / Demo Sign-In (for local development or testing when keys are pending)
  const signInWithMockDev = (mockData: Partial<AuthUser>) => {
    const mockUser: AuthUser = {
      uid: mockData.uid || `cadet_mock_${Date.now()}`,
      email: mockData.email || "cadet@pua.edu.eg",
      displayName: mockData.displayName || "Demo Cadet",
      phoneNumber: mockData.phoneNumber || "+201000000000",
      photoURL: mockData.photoURL || null,
      providerId: mockData.providerId || "mock",
      isMock: true,
    }
    setUser(mockUser)
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser))
    }
    fetchTrainee(mockUser)
  }

  // 5. Sign Out
  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_STORAGE_KEY)
    }
    setUser(null)
    setTraineeProfile(null)
  }

  const refreshTraineeProfile = async () => {
    await fetchTrainee(user)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        traineeProfile,
        loading,
        error,
        signInWithGoogle,
        signInWithGithub,
        sendPhoneOtp,
        signInWithMockDev,
        signOutUser,
        refreshTraineeProfile,
        setTraineeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
