"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Flame,
  UserCheck,
  Zap,
  Github,
  Phone,
} from "lucide-react"

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
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

function ClaimContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || "CAMPUS_BOOTH_DAY1"
  const initialPoints = searchParams.get("points") || "10"

  const {
    user,
    traineeProfile,
    signInWithGoogle,
    signInWithGithub,
    signInWithMockDev,
  } = useAuth()

  const [code, setCode] = useState(initialCode)
  const [manualUniId, setManualUniId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    points?: number
    campaign?: string
    alreadyClaimed?: boolean
    needsRegistration?: boolean
  } | null>(null)

  useEffect(() => {
    if (searchParams.get("code")) {
      setCode(searchParams.get("code") || "")
    }
  }, [searchParams])

  const activeUniId = traineeProfile?.universityId || manualUniId

  const handleClaim = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeUniId.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/points/claim-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: activeUniId.trim(),
          code: code.trim(),
          authUid: user?.uid,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult({
          success: true,
          points: data.points || Number(initialPoints) || 10,
          campaign: data.campaign || "Campus Challenge",
          message: data.message || `+${data.points || 10} PTS credited to your profile!`,
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to claim points.",
          alreadyClaimed: data.alreadyClaimed,
          needsRegistration: data.needsRegistration,
        })
      }
    } catch {
      setResult({
        success: false,
        error: "Network error occurred. Please check your connection.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-8 sm:py-12">
      {/* Top Banner */}
      <div className="bg-[#FFD500] border-4 border-[#0F0F0F] p-4 sm:p-6 shadow-[6px_6px_0px_#0F0F0F] mb-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase tracking-widest text-[#0F0F0F]">
          <span className="w-2.5 h-2.5 bg-[#FF0055] rounded-full animate-ping" />
          <span>ON-CAMPUS SCANNER REWARD</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-[#0F0F0F] leading-tight mb-2">
          CLAIM YOUR +{initialPoints} BONUS POINTS!
        </h1>
        <p className="font-mono text-xs sm:text-sm text-[#0F0F0F]/80">
          Campaign: <span className="font-bold bg-white px-2 py-0.5 border border-[#0F0F0F]">{code}</span>
        </p>
      </div>

      {/* Main Neo-Brutalist Card */}
      <div className="bg-white border-4 border-[#0F0F0F] p-6 sm:p-8 shadow-[8px_8px_0px_#0F0F0F] relative">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* ============================================================
            CASE 1: SUCCESS REWARD UNLOCKED
            ============================================================ */}
        {result?.success ? (
          <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-[#00E5FF] border-4 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] mx-auto flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[#0F0F0F]" />
            </div>

            <div>
              <div className="inline-block bg-[#FFD500] border-2 border-[#0F0F0F] px-3 py-1 font-mono text-xs font-bold uppercase mb-2">
                REWARD UNLOCKED
              </div>
              <h2 className="text-3xl sm:text-4xl font-display text-[#0F0F0F] uppercase">
                +{result.points} POINTS CREDITED!
              </h2>
              <p className="font-mono text-xs sm:text-sm text-neutral-600 mt-2 max-w-sm mx-auto">
                {result.message}
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-2 border-[#0F0F0F] text-left font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Cadet:</span>
                <span className="font-bold text-[#0F0F0F]">{user?.displayName || "Verified Cadet"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cadet ID:</span>
                <span className="font-bold text-[#7B2CBF]">{activeUniId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SECURELY SYNCED
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/leaderboard"
                className="flex-1 bg-[#00E5FF] hover:bg-[#00cbe3] border-3 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-3 px-4 font-mono font-bold text-sm uppercase text-[#0F0F0F] flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <Trophy className="w-4 h-4" /> CHECK LEADERBOARD
              </Link>
              <Link
                href="/"
                className="flex-1 bg-white hover:bg-neutral-100 border-3 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-3 px-4 font-mono font-bold text-sm uppercase text-[#0F0F0F] flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                RETURN HOME
              </Link>
            </div>
          </div>
        ) : !user ? (
          /* ============================================================
             CASE 2: USER NOT LOGGED IN -> REQUIRE AUTH FIRST
             ============================================================ */
          <div className="space-y-5">
            <div className="border-b-3 border-[#0F0F0F] pb-3">
              <span className="inline-block bg-[#FF0055] text-white px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider mb-1">
                IDENTITY VERIFICATION REQUIRED
              </span>
              <h2 className="text-xl sm:text-2xl font-display uppercase text-[#0F0F0F]">
                SIGN IN TO CLAIM YOUR +10 PTS
              </h2>
              <p className="font-mono text-xs text-neutral-600 mt-1">
                Authenticate first with Google, GitHub, or Phone to link your reward to your official cadet account.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-[#0F0F0F] border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono text-xs font-bold uppercase py-3.5 px-4 transition-all cursor-pointer"
              >
                <GoogleIcon />
                <span>SIGN IN WITH GOOGLE</span>
              </button>

              <button
                type="button"
                onClick={() => signInWithGithub()}
                className="w-full flex items-center justify-center gap-3 bg-[#0F0F0F] hover:bg-neutral-800 text-white border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#7B2CBF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono text-xs font-bold uppercase py-3.5 px-4 transition-all cursor-pointer"
              >
                <Github className="w-4 h-4 text-white" />
                <span>SIGN IN WITH GITHUB</span>
              </button>

              <Link
                href={`/register?code=${encodeURIComponent(code)}`}
                className="w-full flex items-center justify-center gap-2 bg-[#FFF4E0] hover:bg-[#ffeac4] text-[#0F0F0F] border-2 border-dashed border-[#0F0F0F] font-mono text-xs font-bold uppercase py-3 px-4 transition-all"
              >
                <Phone className="w-4 h-4 text-[#7B2CBF]" />
                <span>USE PHONE OR REGISTER NEW ACCOUNT</span>
              </Link>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() =>
                    signInWithMockDev({
                      displayName: "Cadet Scout",
                      email: "scout@pua.edu.eg",
                      providerId: "mock",
                    })
                  }
                  className="font-mono text-[11px] text-neutral-400 hover:text-[#7B2CBF] underline cursor-pointer"
                >
                  (Dev Quick Test Sign-in)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             CASE 3: AUTHENTICATED -> 1-CLICK VERIFIED CLAIM
             ============================================================ */
          <div className="space-y-5">
            {/* Authenticated Cadet Badge */}
            <div className="bg-[#FFF4E0] border-3 border-[#0F0F0F] p-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#7B2CBF] tracking-wider block">
                  AUTHENTICATED CADET
                </span>
                <span className="font-display text-base text-[#0F0F0F] uppercase">
                  {user.displayName || user.email}
                </span>
                {traineeProfile?.universityId && (
                  <p className="font-mono text-xs text-neutral-600 mt-0.5">
                    PUA ID: <span className="font-bold text-[#0F0F0F]">{traineeProfile.universityId}</span>
                  </p>
                )}
              </div>
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>

            {/* If cadet doesn't have an enrolled University ID, prompt them */}
            {!traineeProfile?.universityId ? (
              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label htmlFor="uniId" className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-1.5">
                    LINK UNIVERSITY ID <span className="text-[#FF0055]">*</span>
                  </label>
                  <input
                    id="uniId"
                    type="text"
                    required
                    placeholder="e.g. 202300123"
                    value={manualUniId}
                    onChange={(e) => setManualUniId(e.target.value)}
                    className="w-full bg-[#FFF9F0] border-3 border-[#0F0F0F] p-3 font-mono text-base font-bold text-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#7B2CBF]"
                  />
                  <p className="font-mono text-[11px] text-neutral-500 mt-1">
                    Your student ID links your claimed points to your leaderboard profile.
                  </p>
                </div>

                {result?.error && (
                  <div className="bg-[#FFE8EC] text-[#9A0026] border-3 border-[#0F0F0F] p-3 font-mono text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p>{result.error}</p>
                      {result.needsRegistration && (
                        <Link
                          href={`/register?uniId=${encodeURIComponent(manualUniId)}`}
                          className="inline-flex items-center gap-1.5 bg-[#FF0055] text-white px-2.5 py-1 font-bold text-[11px] border border-[#0F0F0F]"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Complete Registration First
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !manualUniId.trim()}
                  className="w-full bg-[#7B2CBF] hover:bg-[#6823a3] disabled:opacity-50 text-white py-3.5 px-6 border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono font-bold text-sm uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {loading ? (
                    <span>VERIFYING &amp; CLAIMING...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-[#FFD500]" />
                      <span>CLAIM +{initialPoints} POINTS</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Already has profile: 1-Click Instant Claim */
              <div className="space-y-4">
                {result?.error && (
                  <div className="bg-[#FFE8EC] text-[#9A0026] border-3 border-[#0F0F0F] p-3 font-mono text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{result.error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleClaim()}
                  disabled={loading}
                  className="w-full bg-[#7B2CBF] hover:bg-[#6823a3] disabled:opacity-50 text-white py-4 px-6 border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none font-mono font-bold text-base uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {loading ? (
                    <span>CLAIMING...</span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-[#FFD500]" />
                      <span>1-TAP CLAIM +{initialPoints} POINTS</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="border-t-2 border-dashed border-neutral-300 pt-3 flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Authenticated &amp; Verified
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#FF0055]" /> Instant Leaderboard Sync
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Box */}
      <div className="mt-8 bg-[#FFF4E0] border-3 border-[#0F0F0F] p-4 text-center font-mono text-xs">
        <p className="text-neutral-700">
          Need to invite friends or print flyers for your college floor?{" "}
          <Link href="/flyer" className="font-bold underline text-[#7B2CBF] hover:text-[#0F0F0F]">
            Open Printable Campus Flyer &rarr;
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0]">
      <PuaNavbar />
      <main id="main-content" className="flex-grow flex items-center justify-center">
        <Suspense
          fallback={
            <div className="p-12 text-center font-mono font-bold text-[#0F0F0F]">
              Loading challenge portal...
            </div>
          }
        >
          <ClaimContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
