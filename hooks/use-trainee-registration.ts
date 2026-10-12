"use client"

import { useState } from "react"
import { getErrorMessage } from "@/lib/errors"

interface TraineeRegistrationForm {
  fullName: string
  universityId: string
  email: string
  phone: string
  academicYear: string
  track: string
  codeforcesHandle: string
  referralCode: string
}

const INITIAL_FORM: TraineeRegistrationForm = {
  fullName: "",
  universityId: "",
  email: "",
  phone: "",
  academicYear: "Year 1",
  track: "level_1",
  codeforcesHandle: "",
  referralCode: "",
}

interface UseTraineeRegistrationOptions {
  initialReferralCode?: string
  /** Runs after a successful registration, before the submitted state flips. */
  onRegistered?: (form: TraineeRegistrationForm) => Promise<void> | void
}

/**
 * Shared state and submit handling for the cadet intake forms (home modal
 * and /join application section). Posts to /api/trainees/register and
 * exposes loading, error and awarded-points state.
 */
export function useTraineeRegistration({
  initialReferralCode = "",
  onRegistered,
}: UseTraineeRegistrationOptions = {}) {
  const [form, setForm] = useState<TraineeRegistrationForm>({
    ...INITIAL_FORM,
    referralCode: initialReferralCode.toUpperCase(),
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [awardedPoints, setAwardedPoints] = useState(10)
  const [lastReferralCode, setLastReferralCode] = useState(initialReferralCode)

  // Keep the referral code in sync when the URL parameter changes.
  if (lastReferralCode !== initialReferralCode) {
    setLastReferralCode(initialReferralCode)
    if (initialReferralCode) {
      setForm((prev) => ({ ...prev, referralCode: initialReferralCode.toUpperCase() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch("/api/trainees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          universityId: form.universityId,
          email: form.email,
          phone: form.phone,
          academicYear: form.academicYear,
          track: form.track,
          codeforcesHandle: form.codeforcesHandle,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register. Please check your data.")
      }

      setAwardedPoints(data.trainee?.pointsTotal || 10)
      await onRegistered?.(form)
      setSubmitted(true)
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "An unexpected error occurred during submission."))
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    setForm,
    submitted,
    loading,
    errorMsg,
    awardedPoints,
    handleSubmit,
  }
}
