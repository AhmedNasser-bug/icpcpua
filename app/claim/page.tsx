"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import {
  QrCode,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Flame,
  UserCheck,
  Zap,
} from "lucide-react"

function ClaimContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || "CAMPUS_BOOTH_DAY1"
  const initialPoints = searchParams.get("points") || "10"

  const [code, setCode] = useState(initialCode)
  const [universityId, setUniversityId] = useState("")
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

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!universityId.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/points/claim-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: universityId.trim(),
          code: code.trim(),
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
          error: data.error || "Failed to claim points. Please check your details.",
          alreadyClaimed: data.alreadyClaimed,
          needsRegistration: data.needsRegistration,
        })
      }
    } catch {
      setResult({
        success: false,
        error: "Network error occurred. Please check your connection and try again.",
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

      {/* Main Card */}
      <div className="bg-white border-4 border-[#0F0F0F] p-6 sm:p-8 shadow-[8px_8px_0px_#0F0F0F] relative">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* State 1: Claim Success */}
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
                <span className="text-neutral-500">Cadet ID:</span>
                <span className="font-bold text-[#0F0F0F]">{universityId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Challenge:</span>
                <span className="font-bold text-[#7B2CBF]">{result.campaign}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED &amp; SYNCED
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
        ) : (
          /* State 2: Input Form */
          <form onSubmit={handleClaim} className="space-y-5">
            <div>
              <label
                htmlFor="universityId"
                className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-1.5"
              >
                ENTER YOUR UNIVERSITY ID <span className="text-[#FF0055]">*</span>
              </label>
              <input
                id="universityId"
                type="text"
                required
                placeholder="e.g. 202300123"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                disabled={loading}
                autoFocus
                className="w-full bg-[#FFF4E0] border-3 border-[#0F0F0F] p-3 font-mono text-base font-bold text-[#0F0F0F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7B2CBF] transition-all"
              />
              <p className="font-mono text-[11px] text-neutral-500 mt-1">
                Must match the University ID you used when applying to ICPC PUA.
              </p>
            </div>

            <div>
              <label
                htmlFor="code"
                className="block font-mono text-xs font-bold uppercase text-[#0F0F0F] mb-1.5"
              >
                CHALLENGE CODE
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-100 border-2 border-[#0F0F0F] p-2.5 font-mono text-sm font-bold text-neutral-700 uppercase"
              />
            </div>

            {/* Error & Registration Alerts */}
            {result?.error && (
              <div
                className={`border-3 border-[#0F0F0F] p-4 font-mono text-xs ${
                  result.needsRegistration
                    ? "bg-[#FFE8EC] text-[#9A0026]"
                    : result.alreadyClaimed
                    ? "bg-[#FFF9DB] text-[#856404]"
                    : "bg-[#FFE8EC] text-[#9A0026]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-bold">{result.error}</p>

                    {result.needsRegistration && (
                      <div className="pt-2">
                        <Link
                          href={`/join?uniId=${encodeURIComponent(universityId)}`}
                          className="inline-flex items-center gap-1.5 bg-[#FF0055] text-white px-3 py-1.5 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-bold text-xs hover:bg-[#d90048] transition-all"
                        >
                          <UserCheck className="w-4 h-4" /> REGISTER FOR FREE SQUAD
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {result.alreadyClaimed && (
                      <div className="pt-2">
                        <Link
                          href="/leaderboard"
                          className="inline-flex items-center gap-1.5 bg-[#FFD500] text-[#0F0F0F] px-3 py-1.5 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-bold text-xs hover:bg-[#ecc500] transition-all"
                        >
                          <Trophy className="w-4 h-4" /> VIEW YOUR LEADERBOARD RANK
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !universityId.trim()}
              className="w-full bg-[#7B2CBF] hover:bg-[#6823a3] disabled:opacity-50 disabled:cursor-not-allowed border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none text-white py-3.5 px-6 font-mono font-bold text-base uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>CLAIMING POINTS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-[#FFD500]" />
                  <span>CLAIM +{initialPoints} POINTS</span>
                </>
              )}
            </button>

            {/* Helper tips */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> 1-Claim Per Cadet
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#FF0055]" /> Syncs to Leaderboard
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Info Box */}
      <div className="mt-8 bg-[#FFF4E0] border-3 border-[#0F0F0F] p-4 text-center font-mono text-xs">
        <p className="text-neutral-700">
          Want to share the flyer or print one for your study group?{" "}
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
