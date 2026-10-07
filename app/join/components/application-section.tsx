"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { recordBountyReferral } from "@/lib/bounty"
import { Check, Sparkles, Loader2, AlertCircle, Trophy, UserCheck } from "lucide-react"

/* ─── Inner Form Logic with URL Params ─── */
function ApplicationFormContent() {
  const searchParams = useSearchParams()
  const refCodeParam = searchParams.get("ref") || ""

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [creditedScout, setCreditedScout] = useState<string | null>(null)
  const [awardedPoints, setAwardedPoints] = useState<number>(10)

  const [form, setForm] = useState({
    fullName: "",
    universityId: "",
    email: "",
    phone: "",
    academicYear: "Year 1",
    track: "level_1",
    codeforcesHandle: "",
    referralCode: refCodeParam.toUpperCase(),
  })

  useEffect(() => {
    if (refCodeParam) {
      setForm((prev) => ({ ...prev, referralCode: refCodeParam.toUpperCase() }))
    }
  }, [refCodeParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      // 1. Submit trainee registration to Firebase backend API
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

      // 2. If referral code is present, record the referral credit
      if (form.referralCode.trim()) {
        try {
          const bountyRes = await recordBountyReferral(
            form.referralCode.trim(),
            form.fullName.trim(),
            form.universityId.trim()
          )
          if (bountyRes.success) {
            setCreditedScout(form.referralCode.trim())
          }
        } catch (err) {
          console.error("Referral logging error:", err)
        }
      }

      setSubmitted(true)
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during submission.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center animate-slide-in">
        <div className="w-24 h-24 bg-[#FFD500] border-[4px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] flex items-center justify-center">
          <Check className="w-14 h-14 text-[#0F0F0F] stroke-[3]" />
        </div>
        
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase px-3 py-1 bg-[#00E5FF] border-2 border-[#0F0F0F]">
            REGISTRATION ACTIVATED // SEASON 2026
          </span>
          <h3 className="font-display text-4xl sm:text-5xl uppercase text-[#7B2CBF] [text-shadow:4px_4px_0_#00E5FF]">
            YOU&apos;RE IN THE SQUAD!
          </h3>
        </div>

        <div className="p-5 bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-[#7B2CBF] mb-1">
            <Trophy className="w-6 h-6" />
            <p className="font-display text-3xl">+{awardedPoints} POINTS AWARDED</p>
          </div>
          <p className="font-mono text-xs text-neutral-600 uppercase">
            Cadet {form.fullName} (Uni ID: {form.universityId}) is now active on the Leaderboard.
          </p>
        </div>

        {creditedScout && (
          <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0F0F0F]" />
            <span>SCOUT CREDIT DISPATCHED TO [{creditedScout}] // BOUNTY ATTACHED</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/leaderboard"
            className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-8 py-3.5 hover:-translate-y-1 transition-transform"
          >
            VIEW LEADERBOARD STANDING
          </Link>
          <Link
            href="/events"
            className="btn-solid bg-white text-[#0F0F0F] font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-8 py-3.5 hover:-translate-y-1 transition-transform"
          >
            VIEW CALENDAR & SESSIONS
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Referral indicator */}
      {form.referralCode && (
        <div className="bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-between text-xs font-bold uppercase">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F0F0F]" />
            <span>REFERRED BY SCOUT: <strong>{form.referralCode}</strong></span>
          </div>
          <span className="bg-white border border-[#0F0F0F] px-1.5 py-0.5 text-[10px]">
            BOUNTY ATTACHED
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-100 border-[3px] border-[#FF0055] text-[#FF0055] font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Full Name *
          </label>
          <input
            required
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="e.g. Ahmed Khalid"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            University ID *
          </label>
          <input
            required
            type="text"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="e.g. 202300481"
            value={form.universityId}
            onChange={(e) => setForm({ ...form, universityId: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Email Address *
          </label>
          <input
            required
            type="email"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="you@pua.edu.eg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Phone / WhatsApp *
          </label>
          <input
            required
            type="tel"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="01012345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Academic Year *
          </label>
          <select
            required
            title="Academic Year"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          >
            <option value="Year 1">Year 1 (Preparatory / Freshman)</option>
            <option value="Year 2">Year 2 (Sophomore)</option>
            <option value="Year 3">Year 3 (Junior)</option>
            <option value="Year 4">Year 4 (Senior)</option>
          </select>
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Training Track *
          </label>
          <select
            required
            title="Training Track"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.track}
            onChange={(e) => setForm({ ...form, track: e.target.value })}
          >
            <option value="level_1">Level 1 — Algorithmic Fundamentals (From Scratch)</option>
            <option value="level_2">Level 2 — Advanced ECPC &amp; Graph/DP</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Codeforces Handle <span className="normal-case text-[#0F0F0F]/50">(optional)</span>
          </label>
          <input
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="tourist"
            value={form.codeforcesHandle}
            onChange={(e) => setForm({ ...form, codeforcesHandle: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-1.5 tracking-widest">
            Scout Referral Code <span className="normal-case text-[#0F0F0F]/50">(optional)</span>
          </label>
          <input
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo uppercase"
            placeholder="E.G. AHMED-0481"
            value={form.referralCode}
            onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-solid mt-3 bg-[#7B2CBF] text-white font-display text-xl sm:text-2xl uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-4 hover:bg-[#FF0055] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>CONFIRMING REGISTRATION...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            <span>SUBMIT REGISTRATION &amp; CLAIM +10 POINTS</span>
          </>
        )}
      </button>

      <p className="font-mono text-xs text-center text-neutral-600">
        Interested in committee roles (Instructors, HR, Operations, Marketing, Design/Dev)?{" "}
        <Link href="/recruitment" className="underline font-bold text-[#7B2CBF] hover:text-[#FF0055]">
          Explore the Leadership Directory &rarr;
        </Link>
      </p>
    </form>
  )
}

/* ─── Exported Section with Suspense Boundary ─── */
export function ApplicationSection() {
  return (
    <section className="bg-white border-b-[3px] border-[#0F0F0F] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#FFF4E0] border-[4px] border-[#0F0F0F] shadow-solid p-6 md:p-12 relative">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />

          <div className="mb-8 border-b-[3px] border-[#0F0F0F] pb-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF0055] block mb-2">
              Season 2026 Admissions
            </span>
            <h2 className="font-display text-3xl md:text-5xl uppercase text-[#0F0F0F]">
              CADET ENROLLMENT FORM
            </h2>
            <p className="font-body text-sm font-bold text-[#0F0F0F]/70 mt-2">
              Registration is completely free and open to all PUA students regardless of faculty or level.
            </p>
          </div>

          <Suspense fallback={<div className="font-mono text-center py-12">Loading registration matrix...</div>}>
            <ApplicationFormContent />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
