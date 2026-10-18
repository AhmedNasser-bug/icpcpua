"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Trophy, Code2, CheckCircle2, ArrowRight, BellRing } from "lucide-react"
import { VectorNodes } from "@/components/vector-nodes"

export function JoinModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Keyboard accessibility: Escape key to close & focus management
  useEffect(() => {
    emailInputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    try {
      const waitlistEntry = {
        email: email.trim(),
        source: "home_modal",
        timestamp: new Date().toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
      existing.push(waitlistEntry)
      localStorage.setItem("pua_icpc_waitlist", JSON.stringify(existing))
    } catch {
      // LocalStorage fallback
    }

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 300)
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
        <VectorNodes />

        {!submitted ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#0F0F0F]">
              <div>
                <span className="inline-block bg-[#FFD500] text-[#0F0F0F] border-2 border-[#0F0F0F] px-2 py-0.5 font-mono text-[10px] font-bold uppercase mb-1">
                  Season 2026 // Launching Soon
                </span>
                <h2 id="join-modal-title" className="font-display text-2xl sm:text-3xl uppercase text-[#0F0F0F]">
                  WAIT FOR IT
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="border-[3px] border-[#0F0F0F] p-1.5 bg-white hover:bg-[#FF0055] hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p id="join-modal-desc" className="font-body text-xs sm:text-sm text-neutral-800 mb-4">
              Admissions are opening soon. Prepare to compete with PUA&apos;s best coders.
            </p>

            {/* Concise Pitch */}
            <div className="space-y-3 mb-5">
              <div className="bg-white border-[2.5px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F] flex items-start gap-3">
                <div className="p-2 bg-[#FFD500] border-2 border-[#0F0F0F] shrink-0">
                  <Code2 className="w-5 h-5 text-[#0F0F0F]" />
                </div>
                <div>
                  <h3 className="font-display text-sm uppercase text-[#0F0F0F]">THE TRAINING</h3>
                  <p className="font-body text-xs text-neutral-600">
                    Two mentor-led tracks: <strong>Level 1 (Fundamentals)</strong> from scratch to C++ STL, and <strong>Level 2 (Advanced)</strong> for graphs, dynamic programming, and ECPC contest preparation. 100% free.
                  </p>
                </div>
              </div>

              <div className="bg-white border-[2.5px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F] flex items-start gap-3">
                <div className="p-2 bg-[#00E5FF] border-2 border-[#0F0F0F] shrink-0">
                  <Trophy className="w-5 h-5 text-[#0F0F0F]" />
                </div>
                <div>
                  <h3 className="font-display text-sm uppercase text-[#0F0F0F]">THE LEADERBOARD</h3>
                  <p className="font-body text-xs text-neutral-600">
                    Live competitive scoreboard tracking solved problems, gym rating, and attendance. Top performers qualify for official ICPC team sponsorship.
                  </p>
                </div>
              </div>
            </div>

            {/* Waitlist Input */}
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="waitlist-email" className="font-body text-xs font-bold uppercase block mb-1">
                  Email Address for Priority Access
                </label>
                <input
                  id="waitlist-email"
                  ref={emailInputRef}
                  required
                  type="email"
                  className="w-full border-[3px] border-[#0F0F0F] bg-white px-3 py-2.5 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] shadow-neo"
                  placeholder="Enter your student or personal email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 bg-[#7B2CBF] text-white font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] py-3 hover:bg-[#FF0055] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <BellRing className="w-4 h-4" />
                <span>NOTIFY ME WHEN ADMISSIONS OPEN</span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t-2 border-[#0F0F0F] flex items-center justify-between text-xs">
              <Link
                href="/leaderboard"
                onClick={onClose}
                className="font-bold text-[#7B2CBF] hover:text-[#FF0055] uppercase underline inline-flex items-center gap-1"
              >
                <span>View Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/join"
                onClick={onClose}
                className="font-bold text-neutral-600 hover:text-[#0F0F0F] uppercase underline"
              >
                Full Syllabus &amp; Details &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-slide-in">
            <div className="w-16 h-16 bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#0F0F0F]" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-[#00E5FF] border border-[#0F0F0F]">
                PRIORITY PASS LOCKED
              </span>
              <h3 className="font-display text-2xl uppercase text-[#7B2CBF]">
                YOU&apos;RE ON THE LIST!
              </h3>
              <p className="font-body text-xs text-neutral-700 max-w-xs mx-auto">
                We will email <span className="font-bold text-[#0F0F0F]">{email}</span> the moment Season 2026 admissions go live.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full mt-3">
              <Link
                href="/leaderboard"
                onClick={onClose}
                className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-sm uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-2.5 text-center hover:-translate-y-0.5 transition-transform"
              >
                EXPLORE LEADERBOARD PREVIEW
              </Link>
              <Link
                href="/join"
                onClick={onClose}
                className="btn-solid bg-white text-[#0F0F0F] font-display text-sm uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-2.5 text-center hover:-translate-y-0.5 transition-transform"
              >
                READ TRACK SYLLABUS
              </Link>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono font-bold uppercase text-neutral-500 hover:text-[#0F0F0F] underline mt-2 cursor-pointer"
            >
              CLOSE WINDOW
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
