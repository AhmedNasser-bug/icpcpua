"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Check, Sparkles, Loader2, AlertCircle } from "lucide-react"

export function JoinModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [awardedPoints, setAwardedPoints] = useState<number>(10)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    fullName: "",
    universityId: "",
    email: "",
    phone: "",
    academicYear: "Year 1",
    track: "level_1",
    codeforcesHandle: "",
  })

  // Keyboard accessibility: Escape key to close & focus trap
  useEffect(() => {
    firstInputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch("/api/trainees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register. Please check your data.")
      }

      setAwardedPoints(data.trainee?.pointsTotal || 10)
      setSubmitted(true)
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F0F0F]/80 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-modal-title"
      aria-describedby="join-modal-desc"
    >
      <div
        ref={modalRef}
        className="relative bg-[#FFF4E0] border-[4px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] max-w-lg w-full p-6 sm:p-8 my-8"
      >
        <span className="vector-node vector-node-tl" aria-hidden="true" />
        <span className="vector-node vector-node-tr" aria-hidden="true" />
        <span className="vector-node vector-node-bl" aria-hidden="true" />
        <span className="vector-node vector-node-br" aria-hidden="true" />

        {!submitted ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#0F0F0F]">
              <div>
                <span className="inline-block bg-[#FFD500] text-[#0F0F0F] border-2 border-[#0F0F0F] px-2 py-0.5 font-mono text-[10px] font-bold uppercase mb-1">
                  Season 2026 Registration
                </span>
                <h2 id="join-modal-title" className="font-display text-2xl sm:text-3xl uppercase text-[#0F0F0F]">
                  JOIN THE SQUAD
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="border-[3px] border-[#0F0F0F] p-1.5 bg-white hover:bg-[#FF0055] hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close registration dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p id="join-modal-desc" className="font-body text-xs sm:text-sm text-neutral-800 mb-5">
              Instant registration for the ICPC PUA Training Season. You will automatically receive{" "}
              <strong className="text-[#7B2CBF]">+10 points</strong> on the community leaderboard.
            </p>

            {errorMsg && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-100 border-[3px] border-[#FF0055] text-[#FF0055] font-mono text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="reg-name" className="font-body text-xs font-bold uppercase block mb-1">
                  Full Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-name"
                  ref={firstInputRef}
                  required
                  className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                  placeholder="e.g. Ahmed Mahmoud"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-uni-id" className="font-body text-xs font-bold uppercase block mb-1">
                    University ID <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-uni-id"
                    required
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    placeholder="e.g. 202301982"
                    value={form.universityId}
                    onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-year" className="font-body text-xs font-bold uppercase block mb-1">
                    Academic Year <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="reg-year"
                    required
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  >
                    <option value="Year 1">Year 1 (Freshman)</option>
                    <option value="Year 2">Year 2 (Sophomore)</option>
                    <option value="Year 3">Year 3 (Junior)</option>
                    <option value="Year 4">Year 4 (Senior)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="font-body text-xs font-bold uppercase block mb-1">
                    Email Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-email"
                    required
                    type="email"
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    placeholder="you@pua.edu.eg"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="font-body text-xs font-bold uppercase block mb-1">
                    Phone / WhatsApp <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-phone"
                    required
                    type="tel"
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    placeholder="01012345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-track" className="font-body text-xs font-bold uppercase block mb-1">
                    Training Track <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="reg-track"
                    required
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    value={form.track}
                    onChange={(e) => setForm({ ...form, track: e.target.value })}
                  >
                    <option value="level_1">Level 1 (Fundamentals)</option>
                    <option value="level_2">Level 2 (Advanced)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-cf" className="font-body text-xs font-bold uppercase block mb-1">
                    Codeforces Handle <span className="text-neutral-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="reg-cf"
                    className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                    placeholder="tourist"
                    value={form.codeforcesHandle}
                    onChange={(e) => setForm({ ...form, codeforcesHandle: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 bg-[#7B2CBF] text-white font-display text-xl uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] py-3.5 hover:bg-[#FF0055] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>REGISTERING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    <span>CLAIM MY SPOT &amp; +10 PTS</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/join"
                onClick={onClose}
                className="font-body text-xs font-bold uppercase tracking-widest text-[#7B2CBF] underline decoration-[#7B2CBF] decoration-2 underline-offset-4 hover:text-[#FF0055] transition-colors"
              >
                Need committee hiring details? Learn more &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="w-20 h-20 bg-[#FFD500] border-[4px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] flex items-center justify-center">
              <Check className="w-10 h-10 text-[#0F0F0F] stroke-[3]" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 bg-[#00E5FF] border-2 border-[#0F0F0F]">
                PROFILE INITIALIZED
              </span>
              <h3 className="font-display text-3xl uppercase text-[#7B2CBF]">YOU&apos;RE IN!</h3>
            </div>

            <div className="p-4 bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] w-full max-w-sm">
              <p className="font-display text-2xl text-[#0F0F0F]">+{awardedPoints} POINTS</p>
              <p className="font-mono text-xs text-neutral-600 uppercase">
                Added to community leaderboard for {form.fullName}
              </p>
            </div>

            <p className="font-body text-xs text-neutral-700 max-w-xs">
              Welcome to ICPC PUA. Your registration is confirmed. Check your email &amp; WhatsApp for orientation details.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/leaderboard"
                className="flex-1 bg-[#FFD500] text-[#0F0F0F] font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] py-3 hover:bg-[#00E5FF] transition-colors text-center min-h-[44px] flex items-center justify-center"
                onClick={onClose}
              >
                CHECK LEADERBOARD
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white text-[#0F0F0F] font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] py-3 hover:bg-neutral-100 transition-colors cursor-pointer min-h-[44px]"
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
