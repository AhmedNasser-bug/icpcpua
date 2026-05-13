"use client"

import { useState } from "react"
import Link from "next/link"

/* ─── Application Form ─── */
function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", year: "", track: "", codeforces: "", motivation: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-8 py-20 text-center">
        <div className="w-32 h-32 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center">
          <svg className="w-16 h-16 text-[#FFD500]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.12z"/>
          </svg>
        </div>
        <h3 className="font-display text-5xl uppercase text-[#7B2CBF] [text-shadow:4px_4px_0_#00E5FF]">
          YOU&apos;RE IN THE QUEUE!
        </h3>
        <p className="font-body text-base max-w-md">
          Application received. We&apos;ll reach out via email with next steps for the 2026 season. Stay sharp.
        </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Full Name *</label>
          <input
            required
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="Ahmed Khalid"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Email *</label>
          <input
            required
            type="email"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            placeholder="you@pua.edu.eg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Academic Year *</label>
          <select
            required
            title="Academic Year"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          >
            <option value="">Select year</option>
            <option>Year 1</option>
            <option>Year 2</option>
            <option>Year 3</option>
            <option>Year 4</option>
          </select>
        </div>
        <div>
          <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Track *</label>
          <select
            required
            title="Track"
            className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo"
            value={form.track}
            onChange={(e) => setForm({ ...form, track: e.target.value })}
          >
            <option value="">Select track</option>
            <option>Level 01 — Fundamentals</option>
            <option>Level 02 — Advanced</option>
            <option>Organizing Committee — Dev</option>
            <option>Organizing Committee — Design</option>
            <option>Organizing Committee — Ops</option>
          </select>
        </div>
      </div>
      <div>
        <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Codeforces Handle <span className="normal-case text-[#0F0F0F]/50">(optional)</span></label>
        <input
          className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo"
          placeholder="tourist"
          value={form.codeforces}
          onChange={(e) => setForm({ ...form, codeforces: e.target.value })}
        />
      </div>
      <div>
        <label className="font-body text-xs font-bold uppercase block mb-2 tracking-widest">Why do you want to join? *</label>
        <textarea
          required
          rows={4}
          className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF] shadow-neo resize-none"
          placeholder="Tell us what drives you to compete..."
          value={form.motivation}
          onChange={(e) => setForm({ ...form, motivation: e.target.value })}
        />
      </div>
      <button
        type="submit"
        className="btn-solid bg-[#7B2CBF] text-white font-display text-2xl uppercase tracking-widest border-[3px] border-[#0F0F0F] shadow-solid py-5 hover:bg-[#FF0055] transition-colors relative group overflow-hidden"
      >
        <span className="relative z-10">SUBMIT APPLICATION</span>
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
            <h2
              className="font-display text-6xl lg:text-7xl text-[#0F0F0F] uppercase mb-6 leading-none [text-shadow:4px_4px_0_#00E5FF]"
            >
              READY TO BE THE <span className="text-[#7B2CBF] underline decoration-[#0F0F0F] decoration-8 underline-offset-8">BEST?</span>
            </h2>
            <p className="font-body font-bold text-sm text-[#0F0F0F]/60 uppercase tracking-widest mb-10">
              Applications for the 2026 season are now open.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Fill in your details below",
                "We review & reach out within 48 hrs",
                "Complete an online qualifying round",
                "Welcome to PUA ICPC",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#7B2CBF] border-[2px] border-[#0F0F0F] flex items-center justify-center shrink-0">
                    <span className="font-display text-white text-lg">{i + 1}</span>
                  </div>
                  <span className="font-body font-bold text-sm uppercase tracking-wide">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border-[3px] border-[#0F0F0F] shadow-solid p-8 relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />
            <ApplicationForm />
          </div>
        </div>
      </div>
    </section>
  )
}
