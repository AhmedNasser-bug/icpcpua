"use client"

import { useState } from "react"
import { AlertCircle, KeyRound, Loader2 } from "lucide-react"
import {
  firebaseAuthErrorMessage,
  getFirebaseIdToken,
  isFirebaseClientConfigured,
  sendFirebasePasswordReset,
  signInFirebaseUser,
} from "@/lib/firebase/client"

export function TraineeSignInForm({
  onSignedIn,
  fallbackMessage,
}: {
  onSignedIn: () => Promise<void> | void
  fallbackMessage?: string | null
}) {
  const configured = isFirebaseClientConfigured()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [linkRequired, setLinkRequired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(fallbackMessage ?? null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!configured) {
      setError("Firebase Authentication is not configured on this deployment.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const user = await signInFirebaseUser(email.trim(), password)
      const idToken = await getFirebaseIdToken(user, true)
      const response = await fetch("/api/trainees/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          idToken,
          ...(linkRequired && universityId.trim()
            ? { universityId: universityId.trim() }
            : {}),
        }),
      })
      const data = await response.json()

      if (response.status === 409 && data.code === "ACCOUNT_LINK_REQUIRED") {
        setLinkRequired(true)
        setError(data.error || "Confirm your university ID to finish linking this account.")
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not sign in.")
      }

      await onSignedIn()
    } catch (err) {
      const firebaseCode =
        err !== null && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code)
          : ""
      setError(
        firebaseCode.startsWith("auth/")
          ? firebaseAuthErrorMessage(err)
          : err instanceof Error && err.message
            ? err.message
            : "Could not sign in."
      )
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await sendFirebasePasswordReset(email.trim())
      setResetSent(true)
    } catch (err) {
      setError(firebaseAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-5 sm:p-7 shadow-solid"
    >
      <span className="vector-node vector-node-tl" />
      <span className="vector-node vector-node-br" />

      <div className="mb-5 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-[#7B2CBF]" />
        <div>
          <h2 className="font-display text-xl uppercase text-[#0F0F0F]">Cadet sign-in</h2>
          <p className="font-mono text-[11px] text-neutral-700">
            Sign in with the email and password for your training account.
          </p>
        </div>
      </div>

      {!configured && (
        <div className="mb-4 border-[2px] border-[#0F0F0F] bg-[#FFD500] p-3 font-mono text-xs">
          Firebase Authentication is not configured for this build. Set the
          NEXT_PUBLIC_FIREBASE_* variables and rebuild.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 border-[2px] border-[#FF0055] bg-red-100 p-3 font-mono text-xs text-[#FF0055]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resetSent && (
        <div
          role="status"
          className="mb-4 border-[2px] border-[#0F0F0F] bg-[#00E5FF] p-3 font-mono text-xs"
        >
          If that address belongs to an account, Firebase has sent a password-reset email.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-widest">
            Email address
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF]"
            placeholder="you@pua.edu.eg"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-widest">
            Password
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF]"
            placeholder="Your password"
            autoComplete="current-password"
          />
        </label>
      </div>

      {linkRequired && (
        <label className="mt-4 block">
          <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-widest">
            University ID (one-time account link)
          </span>
          <input
            required
            value={universityId}
            onChange={(event) => setUniversityId(event.target.value)}
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF]"
            placeholder="e.g. 202300481"
            autoComplete="username"
          />
        </label>
      )}

      <button
        type="submit"
        disabled={loading || !configured || (linkRequired && !universityId.trim())}
        className="btn-solid mt-5 flex w-full items-center justify-center gap-2 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] py-3 font-display text-base uppercase tracking-wider text-white shadow-solid-sm hover:bg-[#FF0055] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        <span>{loading ? "Signing in..." : "Sign in to my profile"}</span>
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void resetPassword()}
          disabled={loading}
          className="font-mono text-[11px] font-bold uppercase underline text-[#7B2CBF] hover:text-[#FF0055] disabled:opacity-50"
        >
          Forgot password?
        </button>
        <p className="font-mono text-[10px] text-neutral-600">
          Existing trainees sign in with the email on their registration record.
        </p>
      </div>
    </form>
  )
}
