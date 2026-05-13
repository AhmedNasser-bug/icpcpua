"use client"

import { useState } from "react"
import Link from "next/link"

export function JoinModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", year: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F0F0F]/70 p-4">
      <div className="relative bg-[#FFF4E0] border-[3px] border-[#0F0F0F] shadow-solid max-w-lg w-full p-8">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />
        {!submitted ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl uppercase text-[#0F0F0F]">Join the Squad</h2>
              <button
                onClick={onClose}
                className="border-[3px] border-[#0F0F0F] p-1 hover:bg-[#FF0055] hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="font-body text-sm mb-6">Register for the upcoming PUA ICPC training season.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Full Name</label>
                <input required className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]" placeholder="Ahmed Khalid" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Email</label>
                <input required type="email" className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]" placeholder="you@pua.edu.eg" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Academic Year</label>
                <select required className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  <option value="">Select year</option>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                </select>
              </div>
              <button type="submit" className="btn-solid mt-2 bg-[#7B2CBF] text-white font-display text-xl uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-4 hover:bg-[#FF0055] transition-colors">
                REGISTER NOW
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/join" onClick={onClose} className="font-body text-xs font-bold uppercase tracking-widest text-[#7B2CBF] underline decoration-[#7B2CBF] decoration-2 underline-offset-4 hover:text-[#FF0055] transition-colors">
                View full application page &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="w-24 h-24 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FFD500]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.12z"/>
              </svg>
            </div>
            <h3 className="font-display text-3xl uppercase text-[#7B2CBF] text-shadow-cyan">YOU&apos;RE IN!</h3>
            <p className="font-body text-sm max-w-xs">Welcome to PUA ICPC. Check your email for onboarding details.</p>
            <Link href="/events" className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-8 py-3" onClick={onClose}>
              VIEW EVENTS
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
