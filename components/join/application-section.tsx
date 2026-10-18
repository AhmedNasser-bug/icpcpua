"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { VectorNodes } from "@/components/vector-nodes"
import {
  Sparkles,
  Trophy,
  Code2,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  Award,
} from "lucide-react"

/* ─── Waitlist & Pitch Inner Component ─── */
function WaitlistContent() {
  const searchParams = useSearchParams()
  const refCodeParam = searchParams.get("ref") || ""

  const [email, setEmail] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    // Store in local waitlist ledger for immediate client confirmation
    try {
      const waitlistEntry = {
        email: email.trim(),
        universityId: universityId.trim(),
        referralCode: refCodeParam.toUpperCase(),
        timestamp: new Date().toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
      existing.push(waitlistEntry)
      localStorage.setItem("pua_icpc_waitlist", JSON.stringify(existing))
    } catch {
      // LocalStorage quota/incognito fallback
    }

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 400)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center animate-slide-in">
        <div className="w-20 h-20 bg-[#FFD500] border-[4px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-[#0F0F0F] stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase px-3 py-1 bg-[#00E5FF] border-2 border-[#0F0F0F]">
            WAITLIST CONFIRMED // PRIORITY PASS LOCKED
          </span>
          <h3 className="font-display text-3xl sm:text-4xl uppercase text-[#7B2CBF] [text-shadow:3px_3px_0_#00E5FF]">
            YOU&apos;RE FIRST IN LINE!
          </h3>
          <p className="font-body text-sm font-bold text-[#0F0F0F]/80 max-w-md mx-auto">
            We will dispatch your early admissions link directly to{" "}
            <span className="text-[#7B2CBF] underline">{email}</span> the moment the gates unlock.
          </p>
        </div>

        {refCodeParam && (
          <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-3 shadow-[4px_4px_0px_#0F0F0F] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F0F0F]" />
            <span>SCOUT INVITATION ATTACHED: [{refCodeParam.toUpperCase()}]</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          <Link
            href="/leaderboard"
            className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-6 py-3 hover:-translate-y-1 transition-transform inline-flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            <span>VIEW LIVE LEADERBOARD</span>
          </Link>
          <Link
            href="/events"
            className="btn-solid bg-white text-[#0F0F0F] font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-6 py-3 hover:-translate-y-1 transition-transform inline-flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            <span>EXPLORE TRAINING CALENDAR</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Referral Banner */}
      {refCodeParam && (
        <div className="bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-between text-xs font-bold uppercase">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F0F0F]" />
            <span>INVITED BY SCOUT: <strong>{refCodeParam.toUpperCase()}</strong></span>
          </div>
          <span className="bg-white border border-[#0F0F0F] px-2 py-0.5 text-[10px]">
            VIP NOTIFICATION
          </span>
        </div>
      )}

      {/* Two Pillars: The Training & The Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: The Training */}
        <div className="bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#0F0F0F] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#FFD500] border-2 border-[#0F0F0F] font-mono text-xs font-bold uppercase mb-3">
              <Code2 className="w-4 h-4 text-[#0F0F0F]" />
              <span>THE TRAINING MATRIX</span>
            </div>
            <h3 className="font-display text-2xl uppercase text-[#0F0F0F] mb-3">
              TWO ELITE TRACKS
            </h3>
            <p className="font-body text-xs text-[#0F0F0F]/80 leading-relaxed mb-4">
              A structured, mentor-led curriculum designed to elevate your problem-solving from basic syntax to competitive algorithmic mastery.
            </p>
            <ul className="space-y-2.5 font-mono text-xs text-[#0F0F0F]">
              <li className="flex items-start gap-2 bg-[#FFF4E0] p-2 border border-[#0F0F0F]">
                <Flame className="w-4 h-4 text-[#FF0055] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[#7B2CBF]">Level 1 (Fundamentals):</span> C++ STL, Complexity Analysis, Two Pointers, Math &amp; Recursion.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-[#FFF4E0] p-2 border border-[#0F0F0F]">
                <Flame className="w-4 h-4 text-[#7B2CBF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[#7B2CBF]">Level 2 (Advanced / ECPC):</span> Graph Theory, Dynamic Programming, Trees &amp; Segment Trees.
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t-2 border-[#0F0F0F] flex items-center justify-between text-xs font-bold text-neutral-600 uppercase">
            <span>100% Free Community</span>
            <span className="text-[#7B2CBF]">Weekly Live Contests</span>
          </div>
        </div>

        {/* Pillar 2: The Leaderboard */}
        <div className="bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#0F0F0F] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#00E5FF] border-2 border-[#0F0F0F] font-mono text-xs font-bold uppercase mb-3">
              <Trophy className="w-4 h-4 text-[#0F0F0F]" />
              <span>THE LEADERBOARD</span>
            </div>
            <h3 className="font-display text-2xl uppercase text-[#0F0F0F] mb-3">
              CLIMB THE RANKS
            </h3>
            <p className="font-body text-xs text-[#0F0F0F]/80 leading-relaxed mb-4">
              Real-time competitive ranking engine. Solve gym problems, attend deep-dive sessions, and climb the scoreboard to earn official PUA team qualification.
            </p>
            <ul className="space-y-2.5 font-mono text-xs text-[#0F0F0F]">
              <li className="flex items-start gap-2 bg-[#FFF4E0] p-2 border border-[#0F0F0F]">
                <Award className="w-4 h-4 text-[#FFD500] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[#0F0F0F]">Point Audit Engine:</span> Earn points for solved problems, upsolving streaks, and campus drills.
                </div>
              </li>
              <li className="flex items-start gap-2 bg-[#FFF4E0] p-2 border border-[#0F0F0F]">
                <Award className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase text-[#0F0F0F]">ECPC Team Selection:</span> Top cadets secure sponsored slots in national programming championships.
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t-2 border-[#0F0F0F] flex items-center justify-between">
            <Link
              href="/leaderboard"
              className="text-xs font-bold text-[#7B2CBF] hover:text-[#FF0055] inline-flex items-center gap-1 uppercase underline"
            >
              Preview Live Leaderboard &rarr;
            </Link>
            <span className="font-mono text-[11px] bg-[#0F0F0F] text-white px-2 py-0.5">
              SEASON 2026
            </span>
          </div>
        </div>
      </div>

      {/* Waitlist Callout Form */}
      <div className="bg-[#FFFDF8] border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#0F0F0F]">
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FF0055] text-white font-mono text-[11px] font-bold uppercase mb-2">
            <BellRing className="w-3.5 h-3.5" />
            <span>EARLY ACCESS PASS</span>
          </div>
          <h4 className="font-display text-xl sm:text-2xl uppercase text-[#0F0F0F]">
            BE FIRST TO KNOW WHEN REGISTRATION UNLOCKS
          </h4>
          <p className="font-body text-xs text-[#0F0F0F]/70 font-bold mt-1">
            Official admissions open soon. Drop your email to lock priority access before public spots fill up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your student or personal email..."
            className="flex-grow border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            aria-label="Email address for waitlist notification"
          />
          <input
            type="text"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            placeholder="Uni ID (Optional)"
            className="sm:w-36 border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            aria-label="University ID (optional)"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-solid bg-[#7B2CBF] text-white font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-6 py-3 hover:bg-[#FF0055] transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <span>JOIN WAITLIST</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <p className="font-mono text-xs text-center text-neutral-600">
        Interested in joining as an instructor, coach, or committee member?{" "}
        <Link href="/recruitment" className="underline font-bold text-[#7B2CBF] hover:text-[#FF0055]">
          Explore the Committee Directory &rarr;
        </Link>
      </p>
    </div>
  )
}

/* ─── Exported Section with Suspense Boundary ─── */
export function ApplicationSection() {
  return (
    <section className="bg-white border-b-[3px] border-[#0F0F0F] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFF4E0] border-[4px] border-[#0F0F0F] shadow-solid p-6 md:p-12 relative">
          <VectorNodes />

          <div className="mb-8 border-b-[3px] border-[#0F0F0F] pb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF0055] block mb-2">
              Admissions Launching Soon // Season 2026
            </span>
            <h2 className="font-display text-3xl md:text-5xl uppercase text-[#0F0F0F]">
              WAIT FOR IT: CRACK THE CODE. RULE THE LEADERBOARD.
            </h2>
            <p className="font-body text-sm font-bold text-[#0F0F0F]/70 mt-2">
              Competitive programming at PUA is entering a new era. Review the training tracks, check out the live leaderboard, and secure your early access spot.
            </p>
          </div>

          <Suspense fallback={<div className="font-mono text-center py-12">Loading admissions matrix...</div>}>
            <WaitlistContent />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
