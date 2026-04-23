"use client"

import { useState } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"

/* ─── FAQ Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border-[3px] border-[#0F0F0F] transition-colors ${open ? "bg-[#7B2CBF]" : "bg-white"}`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className={`font-display text-xl uppercase tracking-wide ${open ? "text-white" : "text-[#0F0F0F]"}`}>{q}</span>
        <svg
          className={`w-6 h-6 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#FFD500]" : "text-[#0F0F0F]"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="font-body text-sm text-white px-6 pb-6 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

/* ─── Track Card ─── */
function TrackCard({
  level, title, subtitle, items, bgClass, textClass, accentClass,
}: {
  level: string; title: string; subtitle: string; items: string[];
  bgClass: string; textClass: string; accentClass: string;
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch border-[3px] border-[#0F0F0F] shadow-solid">
      <div
        className={`md:w-1/3 p-8 flex flex-col justify-between border-b-[3px] md:border-b-0 md:border-r-[3px] border-dashed border-[#0F0F0F] ${bgClass}`}
      >
        <div>
          <span className={`font-display text-2xl ${accentClass}`}>{level}</span>
          <h3 className={`font-display text-4xl mt-2 uppercase ${textClass}`}>{title}</h3>
        </div>
        <p className={`font-body text-sm mt-4 italic ${textClass} opacity-80`}>{subtitle}</p>
      </div>
      <div className="md:w-2/3 p-8 flex flex-col justify-center gap-4 bg-[#FFF4E0]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 font-body text-sm font-bold">
              <span className="w-3 h-3 bg-[#7B2CBF] border border-[#0F0F0F] shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main className="flex-grow flex flex-col w-full">

        {/* ── HERO ─── */}
        <section className="w-full bg-[#FFF4E0] border-b-[3px] border-[#0F0F0F] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg height="100%" width="100%">
              <pattern id="dots-join" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#0F0F0F" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dots-join)" />
            </svg>
          </div>
          <div className="max-w-[1440px] mx-auto px-10 py-24 relative z-10">
            <div className="inline-block bg-[#7B2CBF] text-white px-4 py-1 font-body font-bold uppercase tracking-widest text-sm border-[2px] border-[#0F0F0F] mb-6">
              Applications Open — 2026 Season
            </div>
            <h1
              className="font-display text-[72px] lg:text-[96px] leading-[0.9] uppercase text-[#0F0F0F] mb-8 [text-shadow:4px_4px_0_#00E5FF]"
            >
              ENGINEER<br />YOUR <span className="text-[#7B2CBF]">LOGIC.</span><br />COMPETE<br />WITH THE BEST.
            </h1>
            <p className="font-body text-xl font-bold max-w-xl bg-white p-6 border-[3px] border-[#0F0F0F] shadow-solid relative">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-br" />
              PUA&apos;s premier competitive programming community. We train beginners into masters and qualify teams for the ACPC and ECPC.
            </p>
          </div>
        </section>

        {/* ── VALUE PROPS ─── */}
        <section className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-16">
              <h2 className="font-display text-5xl text-white uppercase italic tracking-tighter">Why Join Us?</h2>
              <span className="font-body font-bold text-[#9D4EDD] border-b-[3px] border-[#9D4EDD] text-sm pb-1">01 // PERKS</span>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Crack Technical Interviews",
                  desc: "Master the algorithms that unlock doors at FAANG and top-tier tech firms. Our curriculum is built for high-stakes assessments.",
                  borderClass: "border-[#7B2CBF]",
                  bgClass: "bg-zinc-900",
                  icon: (
                    <svg className="w-12 h-12 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  ),
                },
                {
                  title: "Premium Mentorship",
                  desc: "Get 1-on-1 coaching from seasoned problem solvers. Weekly code reviews and strategic debugging sessions.",
                  borderClass: "border-white",
                  bgClass: "bg-zinc-900",
                  icon: (
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  ),
                },
                {
                  title: "Real Stakes & Rewards",
                  desc: "Compete in offline contests, win prizes, and earn prestigious recommendations from department heads.",
                  borderClass: "border-[#0F0F0F]",
                  bgClass: "bg-[#7B2CBF]",
                  icon: (
                    <svg className="w-12 h-12 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  ),
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className={`p-8 border-[3px] relative overflow-hidden hover:-translate-y-2 transition-transform duration-200 vector-node ${card.borderClass} ${card.bgClass}`}
                >
                  <div className="mb-4">{card.icon}</div>
                  <h3 className="font-display text-2xl text-white mb-3">{card.title}</h3>
                  <p className="font-body text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRACKS ─── */}
        <section className="w-full bg-white border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            <h2 className="font-display text-6xl text-center text-[#0F0F0F] uppercase tracking-tighter mb-20">THE TRACKS</h2>
            <div className="flex flex-col gap-12">
              <TrackCard
                level="LEVEL 01"
                title="FUNDAMENTALS"
                subtitle="Perfect for beginners and first-year enthusiasts."
                bgClass="bg-[#FFF4E0]"
                textClass="text-[#0F0F0F]"
                accentClass="text-[#7B2CBF]"
                items={[
                  "Basic Math & Logic",
                  "STL Collections",
                  "Assiut Problem Sheets",
                  "Weekly Mock Contests",
                ]}
              />
              <TrackCard
                level="LEVEL 02"
                title="ADVANCED"
                subtitle="ECPC/ACPC oriented training for veteran coders."
                bgClass="bg-[#7B2CBF]"
                textClass="text-white"
                accentClass="text-[#FFD500]"
                items={[
                  "Graph Algorithms & Flow",
                  "Advanced DP Optimization",
                  "GUC Specialized Curriculum",
                  "Team Strategy & Comms",
                ]}
              />
              {/* OC card */}
              <div className="bg-[#0F0F0F] text-white p-12 border-[3px] border-[#7B2CBF] shadow-solid text-center">
                <h3 className="font-display text-4xl mb-4 uppercase tracking-widest">Organizing Committee</h3>
                <p className="font-body font-bold max-w-2xl mx-auto mb-8 text-zinc-400">
                  Join the engine room. We are recruiting for{" "}
                  <span className="text-white underline decoration-[#7B2CBF] decoration-4">Dev</span>,{" "}
                  <span className="text-white underline decoration-[#7B2CBF] decoration-4">Design</span>, and{" "}
                  <span className="text-white underline decoration-[#7B2CBF] decoration-4">Ops</span>{" "}
                  teams. Gain company-level experience managing large-scale events.
                </p>
                <a href="#apply" className="inline-block bg-white text-[#0F0F0F] px-8 py-3 font-display text-lg uppercase border-[3px] border-white hover:bg-[#7B2CBF] hover:text-white transition-colors">
                  Apply for OC
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMMITMENT ─── */}
        <section className="w-full bg-zinc-50 border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <h2 className="font-display text-6xl leading-tight mb-8 text-[#0F0F0F] uppercase">
                  QUALITY OVER<br /><span className="text-[#7B2CBF]">QUANTITY.</span>
                </h2>
                <div className="flex flex-col gap-6">
                  {[
                    { num: "01", colorClass: "bg-[#0F0F0F]", title: "Professional Environment", desc: "We operate like a high-performance sports team. Punctuality and discipline are non-negotiable." },
                    { num: "02", colorClass: "bg-[#7B2CBF]", title: "Strict Code of Conduct", desc: "Collaboration is key, but integrity is paramount. Plagiarism results in immediate expulsion." },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-4">
                      <div className={`text-white p-3 font-display text-xl shrink-0 border-[2px] border-[#0F0F0F] ${item.colorClass}`}>
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-display text-xl mb-1 uppercase">{item.title}</h4>
                        <p className="font-body font-bold text-sm text-zinc-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border-[3px] border-[#0F0F0F] p-8 shadow-solid relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg height="100%" width="100%"><pattern id="dots-commit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#000" /></pattern><rect width="100%" height="100%" fill="url(#dots-commit)" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-3xl mb-6 text-[#0F0F0F] uppercase">THE COMMITMENT</h3>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: "Weekly Sessions", value: "4-6 HOURS" },
                      { label: "Independent Upsolving", value: "10+ HOURS" },
                      { label: "Mock Contests", value: "EVERY FRIDAY" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between border-b-[2px] border-[#0F0F0F] pb-3">
                        <span className="font-body font-bold text-sm">{row.label}</span>
                        <span className="font-display text-[#7B2CBF]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-yellow-100 border-[2px] border-yellow-600 font-body italic font-bold text-sm">
                    &quot;If you aren&apos;t ready to sweat over a Segment Tree for 3 hours, this isn&apos;t for you.&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MILESTONES ─── */}
        <section className="w-full border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            <div className="flex flex-wrap items-center justify-center gap-16 md:gap-32 mb-20">
              {[
                { val: "1", label: "ACPC Qualified" },
                { val: "3", label: "ECPC Qualified" },
                { val: "500+", label: "Problems Solved" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-7xl text-[#0F0F0F]">{stat.val}</div>
                  <div className="font-body font-bold text-[#7B2CBF] uppercase tracking-widest text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg className="w-40 h-40" fill="#0F0F0F" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="font-display text-3xl text-white mb-4 uppercase">OUR CURRICULUM ANCHORS</h3>
              <p className="font-body text-xl font-bold text-white max-w-2xl">
                We leverage the world-class training resources from{" "}
                <span className="bg-[#0F0F0F] px-2">GUC</span> and{" "}
                <span className="bg-[#0F0F0F] px-2">Assiut University</span>, refined for the PUA ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ─── */}
        <section className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            <h2 className="font-display text-5xl text-white text-center uppercase italic tracking-tighter mb-16">
              FREQUENTLY ASKED LOGIC
            </h2>
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              <FaqItem
                q="Do I need prior experience?"
                a="No. Level 1 is specifically designed for absolute beginners. We only ask for strong logic and a willingness to learn."
              />
              <FaqItem
                q="When do sessions start?"
                a="The 2026 Season kicks off in February. Onboarding and preliminary assessment tests begin late January."
              />
              <FaqItem
                q="Is it online or offline?"
                a="Hybrid. Lectures are recorded, but mock contests and specialized training are held on-campus for maximum focus."
              />
              <FaqItem
                q="What language should I know?"
                a="C++ is the standard for competitive programming. We'll teach you the essentials if you're just starting out."
              />
            </div>
          </div>
        </section>

        {/* ── APPLICATION FORM ─── */}
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

        {/* ── FOOTER ─── */}
        <Footer />

      </main>
    </div>
  )
}
