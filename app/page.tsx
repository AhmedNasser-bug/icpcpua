"use client"

import { useState } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

/* ─────────────────────────────────────────────
   JOIN MODAL
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   ROADMAP CHAPTER CARD
───────────────────────────────────────────── */
const roadmapChapters = [
  {
    num: "01",
    color: "#7B2CBF",
    textColor: "white",
    title: "Programming",
    highlight: "Fundamentals",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "The bedrock of every competitive programmer. Master the syntax, the math, and the basic logic.",
    icon: (
      <svg className="w-10 h-10 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    items: ["C++ / Java Essentials", "Complexity Analysis — O(N log N)", "I/O Optimizations", "Combinations & Permutations"],
  },
  {
    num: "02",
    color: "#00E5FF",
    textColor: "#0F0F0F",
    title: "Data Structures",
    highlight: "& STL",
    highlightBg: "#00E5FF",
    highlightText: "#0F0F0F",
    desc: "Efficiency starts with organization. Use the right tools to store and access data lightning fast.",
    icon: (
      <svg className="w-10 h-10 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
    ),
    items: ["Vectors, Deques, Sets, Maps", "Priority Queues & Stack", "Segment Trees & BITs", "Disjoint Set Union (DSU)"],
  },
  {
    num: "03",
    color: "#FF0055",
    textColor: "white",
    title: "Bit",
    highlight: "Manipulation",
    highlightBg: "#FF0055",
    highlightText: "white",
    desc: "Master the lowest level of computation. Bitmasks allow for elegant solutions and huge optimizations.",
    icon: (
      <svg className="w-10 h-10 text-[#FF0055]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
    ),
    items: ["Bitwise AND / OR / XOR", "Bitmask DP", "Prefix XOR & Range Queries", "Power of 2 tricks"],
  },
  {
    num: "04",
    color: "#0F0F0F",
    textColor: "white",
    title: "Graph",
    highlight: "Theory",
    highlightBg: "#7B2CBF",
    highlightText: "white",
    desc: "Nodes, edges, and paths. The language of relationships and networks.",
    icon: (
      <svg className="w-10 h-10 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    ),
    items: ["DFS, BFS, Floodfill", "Dijkstra & Bellman-Ford", "LCA & Tree DP", "Max Flow / Min Cut"],
  },
  {
    num: "05",
    color: "#FFD500",
    textColor: "#0F0F0F",
    title: "The DP",
    highlight: "Engine",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "Dynamic Programming: Trading memory for time. Breaking big problems into solvable sub-problems.",
    icon: (
      <svg className="w-10 h-10 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
    ),
    items: ["Knapsack & LIS & LCS", "Bitmask DP", "Digit DP", "Convex Hull Trick"],
  },
  {
    num: "06",
    color: "#0F0F0F",
    textColor: "white",
    title: "FINAL BOSS:",
    highlight: "Geometry & Strings",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "The final barrier between a Master and a Grandmaster. Computational geometry, Suffix Automatons, and complex Number Theory.",
    icon: (
      <svg className="w-10 h-10 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
      </svg>
    ),
    items: ["Convex Hull Algorithms", "KMP / Z-Algorithm", "Suffix Trees & Arrays", "Aho-Corasick Automaton"],
  },
]

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      {modalOpen && <JoinModal onClose={() => setModalOpen(false)} />}

      <main className="flex-grow flex flex-col items-center w-full">

        {/* ── HERO ─────────────────────────────── */}
        <section className="w-full max-w-[1440px] px-10 py-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative">
          {/* Left */}
          <div className="w-full lg:w-1/2 flex flex-col gap-8 relative">
            <div className="absolute -top-8 -left-8 opacity-20 pointer-events-none">
              <svg height="160" viewBox="0 0 100 100" width="160">
                <pattern height="10" id="dots-hero" patternUnits="userSpaceOnUse" width="10">
                  <circle cx="2" cy="2" fill="#0F0F0F" r="2" />
                </pattern>
                <rect fill="url(#dots-hero)" height="100" width="100" />
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

          {/* Right: hero art */}
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
                    alt="Abstract vector illustration of a laptop with algorithms exploding from the screen"
                    className="w-full h-full object-cover contrast-125 saturate-150"
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-ExpiRWbOncgumQTQe1QA1XdHvRaWzZ.png"
                    style={{ mixBlendMode: "luminosity", opacity: 0.85 }}
                  />
                  <div className="absolute top-8 left-8 w-14 h-14 border-[3px] border-[#0F0F0F] bg-[#FFD500]" style={{ animation: "bounce 3s infinite" }} />
                  <div className="absolute bottom-16 right-8 w-20 h-20 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] rounded-full" style={{ animation: "pulse 2s infinite" }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-display text-[#FF0055] pointer-events-none select-none" style={{ mixBlendMode: "multiply", opacity: 0.7 }}>
                    {'</>'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BANNER ─────────────────────── */}
        <section className="w-full max-w-[1440px] px-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: "450+", label: "Members", bg: "#FFD500", text: "#0F0F0F", hoverText: "#7B2CBF", nodes: ["tl", "br"] },
              { value: "10K+", label: "Problems Solved", bg: "#00E5FF", text: "#0F0F0F", hoverText: "#FF0055", nodes: ["tl", "tr"] },
              { value: "24",   label: "Contests Hosted", bg: "#7B2CBF", text: "white",  hoverText: "#FFD500", nodes: ["tr", "br"] },
            ].map((s) => (
              <div
                key={s.label}
                className="h-[150px] border-[3px] border-[#0F0F0F] shadow-solid relative flex flex-col items-center justify-center p-6 group hover:-translate-y-2 transition-transform duration-200"
                style={{ backgroundColor: s.bg }}
              >
                {s.nodes.includes("tl") && <span className="vector-node vector-node-tl" />}
                {s.nodes.includes("tr") && <span className="vector-node vector-node-tr" />}
                {s.nodes.includes("bl") && <span className="vector-node vector-node-bl" />}
                {s.nodes.includes("br") && <span className="vector-node vector-node-br" />}
                <span className="font-display text-5xl transition-colors" style={{ color: s.text }}>{s.value}</span>
                <span className="font-body font-bold text-sm uppercase tracking-wide mt-2 bg-white px-3 py-1 border-[2px] border-[#0F0F0F]">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ROADMAP ───────────────────────────── */}
        <section className="w-full bg-white border-y-[3px] border-[#0F0F0F]" id="roadmap">
          <div className="max-w-[1440px] mx-auto px-10 py-24">
            {/* Section header */}
            <div className="mb-20 relative">
              <span className="vector-node vector-node-tl" />
              <h2 className="font-display text-[64px] lg:text-[80px] leading-none text-[#0F0F0F] uppercase">
                ICPC <span className="text-[#7B2CBF]">ROADMAP.</span>
              </h2>
              <p className="font-body text-lg mt-4 max-w-xl border-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-4 shadow-solid-sm relative">
                <span className="vector-node vector-node-br" />
                Level up through 6 chapters. From programming basics to ICPC finals preparation.
              </p>
            </div>

            {/* Chapter vertical timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-[3px] bg-[#0F0F0F] hidden lg:block" />

              <div className="flex flex-col gap-20">
                {roadmapChapters.map((ch, i) => (
                  <div key={ch.num} className="relative flex flex-col lg:flex-row gap-10 items-start">
                    {/* Timeline dot */}
                    <div
                      className="hidden lg:flex absolute left-0 top-0 w-[46px] h-[46px] items-center justify-center border-[3px] border-[#0F0F0F] shrink-0 font-display text-lg z-10"
                      style={{ backgroundColor: ch.color, color: ch.textColor }}
                    >
                      {ch.num}
                    </div>

                    {/* Chapter label + description */}
                    <div className="lg:ml-16 lg:w-1/3 flex flex-col gap-4">
                      <span
                        className="inline-block font-body font-bold text-xs px-3 py-1 border-[2px] border-[#0F0F0F] shadow-neo w-fit"
                        style={{ backgroundColor: ch.color, color: ch.textColor }}
                      >
                        CHAPTER {ch.num}
                      </span>
                      <h3 className="font-display text-4xl leading-tight text-[#0F0F0F]">
                        {ch.title}{" "}
                        <span className="px-2" style={{ backgroundColor: ch.highlightBg, color: ch.highlightText }}>
                          {ch.highlight}
                        </span>
                      </h3>
                      <p className="font-body text-sm text-[#0F0F0F]/70 leading-relaxed">{ch.desc}</p>
                      <div
                        className="w-20 h-20 border-[3px] border-[#0F0F0F] flex items-center justify-center shadow-neo"
                        style={{ backgroundColor: ch.color + "22", transform: `rotate(${i % 2 === 0 ? 6 : -6}deg)` }}
                      >
                        {ch.icon}
                      </div>
                    </div>

                    {/* Topic cards */}
                    <div className="lg:w-2/3 w-full grid grid-cols-2 gap-4">
                      {ch.items.map((item, j) => (
                        <div
                          key={item}
                          className="border-[3px] border-[#0F0F0F] p-4 relative overflow-hidden shadow-neo hover:-translate-y-1 transition-transform duration-150"
                          style={{ backgroundColor: j % 2 === 0 ? "#FFF4E0" : "white" }}
                        >
                          <div className="stipple-pattern absolute inset-0 pointer-events-none opacity-10" style={{ color: ch.color }} />
                          <div className="relative z-10 flex items-center gap-3">
                            <span className="w-3 h-3 border border-[#0F0F0F] shrink-0" style={{ backgroundColor: ch.color }} />
                            <span className="font-body font-bold text-xs uppercase tracking-tight text-[#0F0F0F]">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestone banner */}
              <div className="relative py-20 mt-20">
                <div className="absolute inset-0 bg-[#FFD500] border-y-[8px] border-[#0F0F0F]" style={{ transform: "rotate(-1deg) scaleX(1.1)" }} />
                <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
                  <h3 className="font-display text-5xl text-[#0F0F0F] mb-4 uppercase">MILESTONE: THE ASCENT</h3>
                  <p className="font-body font-bold text-lg text-[#0F0F0F] mb-8 italic">&ldquo;You have mastered the tools. Now, you must master the logic.&rdquo;</p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-solid bg-[#0F0F0F] text-white px-12 py-5 font-display text-xl uppercase italic tracking-tighter shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-[3px] border-[#0F0F0F]"
                  >
                    Join to Unlock All Chapters
                  </button>
                </div>
                <div className="absolute top-8 right-10 w-16 h-16 bg-white border-[3px] border-[#0F0F0F] -rotate-12 shadow-neo hidden md:block" />
                <div className="absolute bottom-8 left-10 w-12 h-12 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] rotate-45 shadow-neo hidden md:block" />
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT ─────────────────────────────── */}
        <section className="w-full max-w-[1440px] px-10 py-24" id="about">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: big text */}
            <div className="relative">
              <span className="vector-node vector-node-tl" />
              <h2 className="font-display text-[56px] leading-none text-[#0F0F0F] uppercase mb-6">
                WHO ARE<br />
                <span className="text-[#7B2CBF] text-shadow-cyan">WE?</span>
              </h2>
              <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid p-8 relative">
                <span className="vector-node vector-node-tr" />
                <span className="vector-node vector-node-bl" />
                <p className="font-body text-sm leading-relaxed text-[#0F0F0F]">
                  PUA ICPC is the official competitive programming community of <strong>Pharos University in Alexandria</strong>. We train the next generation of algorithmic problem-solvers who represent Egypt on the world stage at ACPC and ICPC regional contests.
                </p>
                <p className="font-body text-sm leading-relaxed text-[#0F0F0F] mt-4">
                  We run weekly bootcamps, mock contests, and collaborative problem-solving sessions. Whether you&apos;re a beginner or a seasoned coder, there&apos;s a place for you here.
                </p>
              </div>
            </div>

            {/* Right: feature pills */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Weekly Bootcamps", icon: "📅", bg: "#7B2CBF", fg: "white" },
                { label: "Mock Contests", icon: "🏆", bg: "#00E5FF", fg: "#0F0F0F" },
                { label: "Mentorship", icon: "🎓", bg: "#FFD500", fg: "#0F0F0F" },
                { label: "ICPC Prep", icon: "🚀", bg: "#FF0055", fg: "white" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="border-[3px] border-[#0F0F0F] shadow-solid p-6 relative hover:-translate-y-2 transition-transform duration-200"
                  style={{ backgroundColor: f.bg }}
                >
                  <span className="vector-node vector-node-br" />
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <p className="font-display text-xl uppercase" style={{ color: f.fg }}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── JOIN CTA ──────────────────────────── */}
        <section className="w-full bg-[#7B2CBF] border-y-[3px] border-[#0F0F0F]" id="join">
          <div className="max-w-[1440px] mx-auto px-10 py-24 relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            {/* Decorative BG text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
              <span className="font-display text-[200px] text-white/5 uppercase leading-none">ICPC</span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center gap-8">
              <span className="font-body font-bold text-xs uppercase tracking-widest bg-[#FFD500] text-[#0F0F0F] border-[2px] border-[#0F0F0F] px-4 py-1 shadow-neo">
                Season 2024 — Registration Open
              </span>
              <h2 className="font-display text-[64px] lg:text-[80px] leading-none text-white uppercase text-shadow-cyan">
                READY TO<br />CRACK THE<br />CODE?
              </h2>
              <p className="font-body text-lg text-white/80 max-w-lg border-[3px] border-white/30 px-6 py-4">
                Don&apos;t just watch others make it to regionals. Join the squad, grind the sheets, and make your mark in the PUA ICPC Hall of Fame.
              </p>
              <div className="flex flex-wrap gap-6 justify-center">
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-solid h-16 px-10 bg-[#FFD500] text-[#0F0F0F] text-2xl font-display uppercase tracking-widest border-[3px] border-[#0F0F0F] shadow-solid relative overflow-hidden group"
                >
                  <span className="relative z-10">JOIN THE SQUAD</span>
                  <div className="absolute inset-0 bg-[#00E5FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
                </button>
                <Link
                  href="/resources"
                  className="btn-solid h-16 px-10 bg-transparent text-white text-2xl font-display uppercase tracking-widest border-[3px] border-white shadow-[8px_8px_0px_white] hover:bg-white hover:text-[#7B2CBF] transition-colors"
                >
                  EXPLORE RESOURCES
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FEEDBACK BUCKET FOOTER ────────────── */}
      <footer className="w-full border-t-[8px] border-[#0F0F0F] bg-white mt-0">
        <div className="max-w-[1440px] mx-auto px-10 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Quote block */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#0F0F0F] text-white flex items-center justify-center font-display text-5xl shadow-solid shrink-0">
                !
              </div>
              <div>
                <p className="font-display text-2xl leading-none mb-2 text-[#0F0F0F]">&ldquo;Complexity is the enemy of execution.&rdquo;</p>
                <p className="font-body font-bold text-[#0F0F0F]/50 uppercase text-xs tracking-widest">Keep it simple, solve it fast.</p>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-4">
              {[
                { href: "#", label: "Codeforces", icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                ), hoverBg: "#FFD500" },
                { href: "#", label: "Discord", icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
                ), hoverBg: "#7B2CBF" },
                { href: "#", label: "Share", icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                ), hoverBg: "#00E5FF" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-14 h-14 border-[3px] border-[#0F0F0F] flex items-center justify-center shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-lg"
                  style={{ backgroundColor: "white" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = s.hoverBg }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "white" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Feedback form row */}
          <div className="mt-12 border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-8 shadow-solid relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-br" />
            <h3 className="font-display text-2xl text-[#0F0F0F] uppercase mb-4">DROP YOUR FEEDBACK</h3>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Your suggestion, bug report, or shoutout..."
                className="flex-1 border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm focus:outline-none focus:border-[#7B2CBF]"
              />
              <button
                type="submit"
                className="btn-solid bg-[#7B2CBF] text-white font-display text-base uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-8 py-3 hover:bg-[#FF0055] transition-colors whitespace-nowrap"
              >
                SEND IT
              </button>
            </form>
          </div>

          {/* Copyright bar */}
          <div className="mt-8 text-center border-[3px] border-[#0F0F0F] py-4 bg-white shadow-neo">
            <span className="font-body font-bold text-xs uppercase tracking-[0.4em] text-[#0F0F0F]">
              &copy; 2024 PUA ICPC HUB — PHAROS UNIVERSITY IN ALEXANDRIA — ALGORITHMIC EXCELLENCE
            </span>
          </div>
        </div>
      </footer>

      {/* Scrolling marquee sits just above the footer */}
      <Marquee />
    </div>
  )
}
