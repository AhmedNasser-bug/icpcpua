"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { recordBountyReferral } from "@/lib/bounty"
import { Check, Sparkles } from "lucide-react"

/* ─── Inner Form Logic with URL Params ─── */
function ApplicationFormContent() {
  const searchParams = useSearchParams()
  const refCodeParam = searchParams.get("ref") || ""

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creditedScout, setCreditedScout] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    uniId: "",
    email: "",
    year: "",
    track: "",
    codeforces: "",
    motivation: "",
    referralCode: refCodeParam.toUpperCase(),
  })

  useEffect(() => {
    if (refCodeParam) {
      setForm((prev) => ({ ...prev, referralCode: refCodeParam.toUpperCase() }))
    }
  }, [refCodeParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // If referral code is present, record the referral in Supabase
    if (form.referralCode.trim()) {
      try {
        const res = await recordBountyReferral(
          form.referralCode.trim(),
          form.name.trim(),
          form.uniId.trim()
        )
        if (res.success) {
          setCreditedScout(form.referralCode.trim())
        }
      } catch (err) {
        console.error("Referral logging error:", err)
      }
    }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-8 py-20 text-center animate-slide-in">
        <div className="w-32 h-32 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center">
          <svg className="w-16 h-16 text-[#FFD500]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.12z" />
          </svg>
        </div>
        <h3 className="font-display text-5xl uppercase text-[#7B2CBF] [text-shadow:4px_4px_0_#00E5FF]">
          YOU&apos;RE IN THE QUEUE!
        </h3>
        <p className="font-body text-base max-w-md font-bold text-zinc-800">
          Application received for Cadet {form.name} (ID: {form.uniId}). We&apos;ll reach out via email with next steps for the 2026 season. Stay sharp.
        </p>

        {creditedScout && (
          <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Check className="w-5 h-5 text-[#0F0F0F]" />
            <span>SCOUT CREDIT DISPATCHED TO [{creditedScout}] // +1 BOUNTY XP LOGGED</span>
          </div>
        )}

        <Link
          href="/events"
          className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-xl uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-10 py-4 hover:-translate-y-1 transition-transform"
        >
          VIEW UPCOMING EVENTS
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
            Full Name *
          </label>
          <input
            required
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="Ahmed Khalid"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
            University ID (Uni ID) *
          </label>
          <input
            required
            type="text"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="202300481"
            value={form.uniId}
            onChange={(e) => setForm({ ...form, uniId: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
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
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
            Academic Year *
          </label>
          <select
            required
            title="Academic Year"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          >
            <option value="">Select year</option>
            <option>Year 1 (Preparatory / Freshmen)</option>
            <option>Year 2 (Sophomore)</option>
            <option>Year 3 (Junior)</option>
            <option>Year 4 (Senior)</option>
          </select>
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
            Track Selection *
          </label>
          <select
            required
            title="Track"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.track}
            onChange={(e) => setForm({ ...form, track: e.target.value })}
          >
            <option value="">Select track</option>
            <option>Level 01 — Algorithmic Fundamentals</option>
            <option>Level 02 — Advanced CP &amp; Graph/DP</option>
            <option>Organizing Committee — Technical Lead</option>
            <option>Organizing Committee — Design &amp; Web</option>
            <option>Organizing Committee — Ops &amp; PR</option>
            <option>Organizing Committee — HR</option>
          </select>
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
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

      <div>
        <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
          Codeforces Handle <span className="normal-case text-[#0F0F0F]/50">(optional)</span>
        </label>
        <input
          className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
          placeholder="tourist"
          value={form.codeforces}
          onChange={(e) => setForm({ ...form, codeforces: e.target.value })}
        />
      </div>

      <div>
        <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">
          Why do you want to join? *
        </label>
        <textarea
          required
          rows={3}
          className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo resize-none"
          placeholder="Tell us what drives you to compete and conquer algorithms..."
          value={form.motivation}
          onChange={(e) => setForm({ ...form, motivation: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-solid bg-[#7B2CBF] text-white font-display text-2xl uppercase tracking-widest border-[3px] border-[#0F0F0F] shadow-solid py-5 hover:bg-[#FF0055] transition-colors relative group overflow-hidden disabled:opacity-50 cursor-pointer"
      >
        <span className="relative z-10">
          {loading ? "TRANSMITTING CADET FILE..." : "SUBMIT APPLICATION"}
        </span>
        <div className="absolute inset-0 bg-[#FF0055] translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
      </button>
    </form>
  )
}

export function ApplicationSection() {
  return (
    <section id="apply" className="w-full bg-[#FFF4E0] border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        <div className="grid md:grid-cols-2 gap-20 items-start">
          <div>
            <h2 className="font-display text-6xl lg:text-7xl text-[#0F0F0F] uppercase mb-6 leading-none [text-shadow:4px_4px_0_#00E5FF]">
              READY TO BE THE{" "}
              <span className="text-[#7B2CBF] underline decoration-[#0F0F0F] decoration-8 underline-offset-8">
                BEST?
              </span>
            </h2>
            <p className="font-body font-bold text-sm text-[#0F0F0F]/60 uppercase tracking-widest mb-10">
              Applications for the 2026 season are now open.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm p-4">
                <span className="w-3 h-3 bg-[#FFD500] border-2 border-[#0F0F0F] flex-shrink-0" />
                <span className="font-body text-sm font-bold uppercase">7 Months Intensive Coaching</span>
              </div>
              <div className="flex items-center gap-4 bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm p-4">
                <span className="w-3 h-3 bg-[#00E5FF] border-2 border-[#0F0F0F] flex-shrink-0" />
                <span className="font-body text-sm font-bold uppercase">500+ Curated Contest Problems</span>
              </div>
              <div className="flex items-center gap-4 bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm p-4">
                <span className="w-3 h-3 bg-[#FF0055] border-2 border-[#0F0F0F] flex-shrink-0" />
                <span className="font-body text-sm font-bold uppercase">Official ECPC Qualification Pathway</span>
              </div>
            </div>
          </div>

          <div className="bg-white border-[4px] border-[#0F0F0F] shadow-solid p-8 md:p-12 relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            <div className="mb-8">
              <span className="bg-[#FFD500] text-[#0F0F0F] font-body text-xs font-bold uppercase px-3 py-1 border-[2px] border-[#0F0F0F]">
                OFFICIAL CADET DOSSIER
              </span>
              <h3 className="font-display text-3xl uppercase text-[#0F0F0F] mt-3">
                APPLICATION FORM
              </h3>
            </div>

            <Suspense fallback={<div className="font-body text-sm font-bold p-6">Loading form parameters...</div>}>
              <ApplicationFormContent />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}
