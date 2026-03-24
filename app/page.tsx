"use client"

import { useState } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

function JoinModal({ onClose }: { onClose: () => void }) {
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
            <p className="font-body text-sm mb-6 text-[#0F0F0F]">
              Register for the upcoming PUA ICPC training season.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Full Name</label>
                <input
                  required
                  className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                  placeholder="Ahmed Khalid"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
                  placeholder="you@pua.edu.eg"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="font-body text-xs font-bold uppercase block mb-1">Academic Year</label>
                <select
                  required
                  className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
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
              <button
                type="submit"
                className="btn-solid mt-2 bg-[#7B2CBF] text-white font-display text-xl uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-4 hover:bg-[#FF0055] transition-colors"
              >
                REGISTER NOW
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            {/* thumbs up vector */}
            <div className="w-24 h-24 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FFD500]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.12z"/>
              </svg>
            </div>
            <h3 className="font-display text-3xl uppercase text-[#7B2CBF] text-shadow-cyan">YOU&apos;RE IN!</h3>
            <p className="font-body text-sm max-w-xs">Welcome to PUA ICPC. Check your email for onboarding details.</p>
            <Link
              href="/events"
              className="btn-solid bg-[#FFD500] text-[#0F0F0F] font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-8 py-3"
              onClick={onClose}
            >
              VIEW EVENTS
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      {modalOpen && <JoinModal onClose={() => setModalOpen(false)} />}

      <main className="flex-grow flex flex-col items-center w-full">
        {/* Hero Section */}
        <section className="w-full max-w-[1440px] px-10 py-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative">
          {/* Left: Copy & CTA */}
          <div className="w-full lg:w-1/2 flex flex-col gap-8 relative">
            {/* stipple decoration */}
            <div className="absolute -top-8 -left-8 opacity-20 pointer-events-none">
              <svg height="160" viewBox="0 0 100 100" width="160">
                <pattern height="10" id="dots-hero" patternUnits="userSpaceOnUse" width="10" x="0" y="0">
                  <circle cx="2" cy="2" fill="#0F0F0F" r="2" />
                </pattern>
                <rect fill="url(#dots-hero)" height="100" width="100" x="0" y="0" />
              </svg>
            </div>

            <h1 className="font-display text-[72px] lg:text-[84px] leading-[0.9] text-[#0F0F0F] text-shadow-cyan uppercase">
              CRACK<br />THE<br />CODE.
            </h1>

            <p className="font-body text-lg font-bold max-w-lg bg-white p-6 border-[3px] border-[#0F0F0F] shadow-solid-sm relative">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-br" />
              Join the fiercest algorithmic competitive programming community at Pharos University. Eat, sleep, code, repeat.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="btn-solid flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid h-20 w-full max-w-[320px] bg-[#7B2CBF] text-white text-2xl font-display uppercase tracking-widest relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-3">
                  JOIN THE SQUAD
                  <svg className="w-7 h-7 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-[#FF0055] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
              </button>
            </div>
          </div>

          {/* Right: Vector Hero Art */}
          <div className="w-full lg:w-1/2 flex justify-center relative hero-art-container">
            <div className="relative w-full max-w-[560px] aspect-square bg-[#00E5FF] border-[3px] border-[#0F0F0F] shadow-solid">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />
              <div className="absolute inset-0 p-6 flex items-center justify-center">
                <div className="w-full h-full bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm relative flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Abstract vector illustration of a laptop with algorithms exploding from the screen, neobrutalist style"
                    className="w-full h-full object-cover contrast-125 saturate-150"
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-ExpiRWbOncgumQTQe1QA1XdHvRaWzZ.png"
                    style={{ mixBlendMode: 'luminosity', opacity: 0.85 }}
                  />
                  {/* Overlays */}
                  <div className="absolute top-8 left-8 w-14 h-14 border-[3px] border-[#0F0F0F] bg-[#FFD500]" style={{ animation: 'bounce 3s infinite' }} />
                  <div className="absolute bottom-16 right-8 w-20 h-20 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-display text-[#FF0055] pointer-events-none" style={{ mixBlendMode: 'multiply', opacity: 0.7 }}>
                    {'</>'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="w-full max-w-[1440px] px-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-[150px] bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid relative flex flex-col items-center justify-center p-6 group hover:-translate-y-2 transition-transform duration-200">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-br" />
              <span className="font-display text-5xl text-[#0F0F0F] group-hover:text-[#7B2CBF] transition-colors">450+</span>
              <span className="font-body font-bold text-sm uppercase tracking-wide mt-2 bg-white px-3 py-1 border-[2px] border-[#0F0F0F]">Members</span>
            </div>
            <div className="h-[150px] bg-[#00E5FF] border-[3px] border-[#0F0F0F] shadow-solid relative flex flex-col items-center justify-center p-6 group hover:-translate-y-2 transition-transform duration-200">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="font-display text-5xl text-[#0F0F0F] group-hover:text-[#FF0055] transition-colors">10K+</span>
              <span className="font-body font-bold text-sm uppercase tracking-wide mt-2 bg-white px-3 py-1 border-[2px] border-[#0F0F0F]">Problems Solved</span>
            </div>
            <div className="h-[150px] bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid relative flex flex-col items-center justify-center p-6 group hover:-translate-y-2 transition-transform duration-200">
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-br" />
              <span className="font-display text-5xl text-white group-hover:text-[#FFD500] transition-colors">24</span>
              <span className="font-body font-bold text-sm uppercase tracking-wide mt-2 bg-white px-3 py-1 border-[2px] border-[#0F0F0F]">Contests Hosted</span>
            </div>
          </div>
        </section>
      </main>

      <Marquee />
    </div>
  )
}
