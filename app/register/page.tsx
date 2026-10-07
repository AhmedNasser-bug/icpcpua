"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { useAuth, AuthUser } from "@/lib/auth-context"
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flame,
  UserCheck,
  Zap,
  Github,
  Phone,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Code2,
} from "lucide-react"

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function RegisterContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    user,
    traineeProfile,
    loading: authLoading,
    signInWithGoogle,
    signInWithGithub,
    sendPhoneOtp,
    signInWithMockDev,
    signOutUser,
    refreshTraineeProfile,
  } = useAuth()

  const prefillUniId = searchParams.get("uniId") || ""
  const prefillTrack = searchParams.get("track") || "level_1"

  // Registration Form State
  const [fullName, setFullName] = useState("")
  const [universityId, setUniversityId] = useState(prefillUniId)
  const [track, setTrack] = useState<"level_1" | "level_2">(
    prefillTrack === "level_2" ? "level_2" : "level_1"
  )
  const [codeforcesHandle, setCodeforcesHandle] = useState("")
  const [academicYear, setAcademicYear] = useState<"Year 1" | "Year 2" | "Year 3" | "Year 4">("Year 1")
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Phone Auth State
  const [phoneMode, setPhoneMode] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<any>(null)

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Auto-fill full name when user authenticates
  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName)
    }
  }, [user, fullName])

  // If user already has a registered trainee profile, load it
  useEffect(() => {
    if (traineeProfile) {
      setFullName(traineeProfile.fullName)
      setUniversityId(traineeProfile.universityId)
      setTrack(traineeProfile.track)
      if (traineeProfile.codeforcesHandle) {
        setCodeforcesHandle(traineeProfile.codeforcesHandle)
      }
      setRegistrationSuccess(true)
    }
  }, [traineeProfile])

  // Handle Phone Code Dispatch
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return
    const res = await sendPhoneOtp(phoneNumber.trim(), "recaptcha-container")
    if (res) {
      setConfirmationResult(res)
      setOtpSent(true)
    }
  }

  // Handle Phone Code Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode.trim() || !confirmationResult) return
    try {
      setSubmitting(true)
      await confirmationResult.confirm(otpCode.trim())
      setOtpSent(false)
      setPhoneMode(false)
    } catch (err: any) {
      setSubmitError(err.message || "Invalid SMS verification code.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Final Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !universityId.trim()) {
      setSubmitError("Please provide your Full Name and University ID.")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/trainees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          universityId: universityId.trim(),
          track,
          academicYear,
          email: user?.email || `${universityId.trim()}@pua.edu.eg`,
          phone: user?.phoneNumber || "Not provided",
          authUid: user?.uid,
          authProvider: user?.providerId || "unknown",
          codeforcesHandle: codeforcesHandle.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setRegistrationSuccess(true)
        await refreshTraineeProfile()
      } else {
        setSubmitError(data.error || "Failed to complete registration.")
      }
    } catch {
      setSubmitError("Network connection error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
      {/* Invisible ReCAPTCHA Container */}
      <div id="recaptcha-container" />

      {/* Top Banner */}
      <div className="bg-[#7B2CBF] text-white border-4 border-[#0F0F0F] p-5 sm:p-6 shadow-[6px_6px_0px_#0F0F0F] mb-8 relative">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase tracking-widest text-[#FFD500]">
          <span className="w-2.5 h-2.5 bg-[#FF0055] rounded-full animate-ping" />
          <span>PUA ICPC SQUAD // SEASON 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-white leading-tight">
          JOIN THE TRAINING
        </h1>
        <p className="font-mono text-xs sm:text-sm text-white/90 mt-1">
          Simplest registration in under 30 seconds. Earn your first <span className="text-[#FFD500] font-bold">+10 Points</span> automatically!
        </p>
      </div>

      {/* Main Neo-Brutalist Container */}
      <div className="bg-white border-4 border-[#0F0F0F] p-6 sm:p-8 shadow-[8px_8px_0px_#0F0F0F] relative">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* ============================================================
            STATE 1: ALREADY REGISTERED / SUCCESS
            ============================================================ */}
        {registrationSuccess ? (
          <div className="py-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-[#FFD500] border-4 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-[#0F0F0F]" />
              </div>
              <div className="inline-block bg-[#00E5FF] border-2 border-[#0F0F0F] px-3 py-1 font-mono text-xs font-bold uppercase">
                CADET PROFILE ACTIVE
              </div>
              <h2 className="text-3xl sm:text-4xl font-display text-[#0F0F0F] uppercase">
                YOU&apos;RE IN THE SQUAD!
              </h2>
              <p className="font-mono text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
                Welcome to ICPC PUA. Your profile has been activated with +10 points on the live campus leaderboard.
              </p>
            </div>

            {/* Cadet ID Badge */}
            <div className="p-5 bg-[#FFF4E0] border-3 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] font-mono text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b-2 border-[#0F0F0F]/20 pb-2">
                <span className="text-neutral-600">CADET NAME:</span>
                <span className="font-bold text-[#0F0F0F] uppercase">{fullName || user?.displayName}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-[#0F0F0F]/20 pb-2">
                <span className="text-neutral-600">UNIVERSITY ID:</span>
                <span className="font-bold text-[#7B2CBF]">{universityId}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-[#0F0F0F]/20 pb-2">
                <span className="text-neutral-600">TRAINING TRACK:</span>
                <span className="font-bold text-[#FF0055] uppercase">
                  {track === "level_2" ? "Level 2 (Advanced)" : "Level 1 (Fundamentals)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">TOTAL SCORE:</span>
                <span className="font-bold text-green-700 flex items-center gap-1 text-sm">
                  <Zap className="w-4 h-4 fill-green-600 text-green-600" />
                  {traineeProfile?.pointsTotal || 10} PTS
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/leaderboard"
                className="flex-1 bg-[#00E5FF] hover:bg-[#00c9e0] border-3 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-3.5 px-4 font-mono font-bold text-sm uppercase text-[#0F0F0F] flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <Trophy className="w-4 h-4" /> CHECK LEADERBOARD
              </Link>
              <Link
                href="/flyer"
                className="flex-1 bg-[#FFD500] hover:bg-[#ebc400] border-3 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-3.5 px-4 font-mono font-bold text-sm uppercase text-[#0F0F0F] flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <Sparkles className="w-4 h-4" /> CAMPUS FLYER &amp; QR
              </Link>
            </div>
          </div>
        ) : (
          /* ============================================================
             STATE 2: ONBOARDING FLOW
             ============================================================ */
          <div className="space-y-6">
            {/* STEP 1: AUTHENTICATION */}
            {!user ? (
              <div className="space-y-4">
                <div className="border-b-3 border-[#0F0F0F] pb-3">
                  <span className="inline-block bg-[#0F0F0F] text-white px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest mb-1.5">
                    STEP 1 OF 2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display uppercase text-[#0F0F0F]">
                    CHOOSE YOUR SIGN-IN METHOD
                  </h2>
                  <p className="font-mono text-xs text-neutral-600 mt-1">
                    Connect your account to protect your points, rank, and session attendance.
                  </p>
                </div>

                {/* Provider Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-50 text-[#0F0F0F] border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono text-xs font-bold uppercase py-3.5 px-4 transition-all cursor-pointer"
                  >
                    <GoogleIcon />
                    <span>GOOGLE</span>
                  </button>

                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={() => signInWithGithub()}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-2.5 bg-[#0F0F0F] hover:bg-neutral-800 text-white border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#7B2CBF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono text-xs font-bold uppercase py-3.5 px-4 transition-all cursor-pointer"
                  >
                    <Github className="w-5 h-5 text-white" />
                    <span>GITHUB</span>
                  </button>
                </div>

                {/* Phone Option Toggle */}
                {!phoneMode ? (
                  <button
                    type="button"
                    onClick={() => setPhoneMode(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFF4E0] hover:bg-[#ffe9c2] text-[#0F0F0F] border-2 border-dashed border-[#0F0F0F] font-mono text-xs font-bold uppercase py-2.5 px-4 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-[#7B2CBF]" />
                    <span>USE PHONE NUMBER (SMS OTP)</span>
                  </button>
                ) : (
                  <div className="bg-[#FFF4E0] border-3 border-[#0F0F0F] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase text-[#0F0F0F] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> PHONE VERIFICATION
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneMode(false)
                          setOtpSent(false)
                        }}
                        className="font-mono text-[11px] underline text-neutral-600 hover:text-black cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-2">
                        <input
                          type="tel"
                          placeholder="+20 100 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-white border-2 border-[#0F0F0F] p-2.5 font-mono text-xs font-bold focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!phoneNumber.trim()}
                          className="w-full bg-[#0F0F0F] text-white font-mono text-xs font-bold uppercase py-2 border-2 border-[#0F0F0F] hover:bg-neutral-800 transition-all cursor-pointer"
                        >
                          SEND SMS CODE
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-2">
                        <input
                          type="text"
                          placeholder="6-digit SMS code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full bg-white border-2 border-[#0F0F0F] p-2.5 font-mono text-xs font-bold focus:outline-none text-center tracking-widest text-lg"
                        />
                        <button
                          type="submit"
                          disabled={submitting || !otpCode.trim()}
                          className="w-full bg-[#7B2CBF] text-white font-mono text-xs font-bold uppercase py-2 border-2 border-[#0F0F0F] hover:bg-[#6a22a7] transition-all cursor-pointer"
                        >
                          CONFIRM SMS CODE
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Local Dev / Instant Offline Testing Tool */}
                <div className="pt-2 border-t-2 border-dashed border-neutral-200 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      signInWithMockDev({
                        displayName: "Test Cadet",
                        email: "cadet.demo@pua.edu.eg",
                        providerId: "mock",
                      })
                    }
                    className="font-mono text-[11px] text-neutral-500 hover:text-[#7B2CBF] underline cursor-pointer"
                  >
                    Quick Test Sign-in (Local Mock Mode)
                  </button>
                </div>
              </div>
            ) : (
              /* ============================================================
                 STEP 2: SIMPLEST REGISTRATION (AUTHENTICATED)
                 ============================================================ */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Authenticated User Status Strip */}
                <div className="bg-[#FFF4E0] border-3 border-[#0F0F0F] p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD500] border-2 border-[#0F0F0F] flex items-center justify-center font-display text-sm font-bold shrink-0">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-[#0F0F0F] flex items-center gap-1.5">
                        <span>{user.displayName || "Authenticated Cadet"}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div className="font-mono text-[11px] text-neutral-600">
                        {user.email || user.phoneNumber || "Verified Account"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    className="text-neutral-500 hover:text-[#FF0055] font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer shrink-0"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">SWITCH</span>
                  </button>
                </div>

                <div className="border-b-3 border-[#0F0F0F] pb-2">
                  <span className="inline-block bg-[#0F0F0F] text-white px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest mb-1">
                    STEP 2 OF 2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display uppercase text-[#0F0F0F]">
                    CAMPUS CREDENTIALS
                  </h2>
                  <p className="font-mono text-xs text-neutral-600">
                    Only 2 questions needed to join the squad roster.
                  </p>
                </div>

                {/* 1. Full Name */}
                <div>
                  <label htmlFor="fullName" className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-1">
                    FULL NAME <span className="text-[#FF0055]">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mostafa Ahmed"
                    className="w-full bg-[#FFF9F0] border-3 border-[#0F0F0F] p-3 font-mono text-sm font-bold text-[#0F0F0F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7B2CBF]"
                  />
                </div>

                {/* 2. University ID */}
                <div>
                  <label htmlFor="universityId" className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-1">
                    UNIVERSITY ID (PUA) <span className="text-[#FF0055]">*</span>
                  </label>
                  <input
                    id="universityId"
                    type="text"
                    required
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    placeholder="e.g. 202300123"
                    className="w-full bg-[#FFF9F0] border-3 border-[#0F0F0F] p-3 font-mono text-base font-bold text-[#0F0F0F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7B2CBF]"
                  />
                  <p className="font-mono text-[11px] text-neutral-500 mt-1">
                    Your student ID links your attendance and QR points to your official profile.
                  </p>
                </div>

                {/* 3. Track Selection */}
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-2">
                    SELECT TRAINING TRACK <span className="text-[#FF0055]">*</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTrack("level_1")}
                      className={`p-3.5 text-left border-3 border-[#0F0F0F] transition-all cursor-pointer ${
                        track === "level_1"
                          ? "bg-[#00E5FF] shadow-[4px_4px_0px_#0F0F0F] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="font-display text-sm uppercase text-[#0F0F0F]">LEVEL 1: FUNDAMENTALS</div>
                      <p className="font-mono text-[11px] text-neutral-700 mt-1">
                        C++ STL, Two Pointers, Binary Search &amp; problem-solving foundation.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrack("level_2")}
                      className={`p-3.5 text-left border-3 border-[#0F0F0F] transition-all cursor-pointer ${
                        track === "level_2"
                          ? "bg-[#FF0055] text-white shadow-[4px_4px_0px_#0F0F0F] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="font-display text-sm uppercase">LEVEL 2: ADVANCED</div>
                      <p className={`font-mono text-[11px] mt-1 ${track === "level_2" ? "text-white/90" : "text-neutral-700"}`}>
                        Dynamic Programming, Graph Theory, Trees &amp; ECPC Contest Prep.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Optional Collapsible Settings (Codeforces handle & Academic Year) */}
                <div className="border-2 border-dashed border-[#0F0F0F]/40 p-3 bg-[#F8F9FA]">
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    className="w-full flex items-center justify-between font-mono text-xs font-bold uppercase text-[#0F0F0F] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-[#7B2CBF]" />
                      <span>OPTIONAL DETAILS (CODEFORCES HANDLE, ETC.)</span>
                    </span>
                    {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showOptionalFields && (
                    <div className="pt-3 space-y-3 mt-2 border-t border-[#0F0F0F]/20">
                      <div>
                        <label htmlFor="codeforcesHandle" className="block font-mono text-[11px] font-bold uppercase text-neutral-600 mb-1">
                          Codeforces Handle <span className="text-neutral-400">(Can be added later in your profile)</span>
                        </label>
                        <input
                          id="codeforcesHandle"
                          type="text"
                          value={codeforcesHandle}
                          onChange={(e) => setCodeforcesHandle(e.target.value)}
                          placeholder="e.g. tourist"
                          className="w-full bg-white border-2 border-[#0F0F0F] p-2 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label htmlFor="academicYear" className="block font-mono text-[11px] font-bold uppercase text-neutral-600 mb-1">
                          Academic Year
                        </label>
                        <select
                          id="academicYear"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value as any)}
                          className="w-full bg-white border-2 border-[#0F0F0F] p-2 font-mono text-xs"
                        >
                          <option value="Year 1">Year 1 (Freshman)</option>
                          <option value="Year 2">Year 2 (Sophomore)</option>
                          <option value="Year 3">Year 3 (Junior)</option>
                          <option value="Year 4">Year 4 (Senior)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="bg-[#FFE8EC] text-[#9A0026] border-3 border-[#0F0F0F] p-3.5 font-mono text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Final Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#7B2CBF] hover:bg-[#6722a3] text-white border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none py-4 px-6 font-mono font-bold text-base uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>ACTIVATING MEMBERSHIP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-[#FFD500]" />
                      <span>COMPLETE REGISTRATION &amp; GET +10 PTS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0]">
      <PuaNavbar />
      <main id="main-content" className="flex-grow flex items-center justify-center">
        <Suspense
          fallback={
            <div className="p-12 text-center font-mono font-bold text-[#0F0F0F]">
              Loading Registration Portal...
            </div>
          }
        >
          <RegisterContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
