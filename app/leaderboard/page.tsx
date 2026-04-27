"use client"

import { useState } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

interface Submission {
  name: string
  result: "AC" | "WA"
  difficulty: string
}

interface Coder {
  rank: number
  handle: string
  rating: number
  solved: number
  initials: string
  color: string
  submissions: Submission[]
}

const CODERS: Coder[] = [
  {
    rank: 1,
    handle: "@algo_queen",
    rating: 2100,
    solved: 540,
    initials: "AQ",
    color: "#FFD500",
    submissions: [
      { name: "1700A - Optimal Path", result: "AC", difficulty: "CF" },
      { name: "Two Sum", result: "AC", difficulty: "LC" },
      { name: "1850C - Weight of Sy...", result: "AC", difficulty: "CF" },
      { name: "Segment Tree Pro", result: "WA", difficulty: "CF" },
      { name: "Knapsack DP", result: "AC", difficulty: "Lc" },
    ],
  },
  {
    rank: 2,
    handle: "@byte_me",
    rating: 1850,
    solved: 487,
    initials: "BM",
    color: "#E0E0E0",
    submissions: [
      { name: "BFS Maze", result: "AC", difficulty: "CF" },
      { name: "LCA in O(log n)", result: "AC", difficulty: "CF" },
      { name: "Max Flow Min Cut", result: "WA", difficulty: "CF" },
      { name: "1400B - Round 700", result: "AC", difficulty: "CF" },
      { name: "String Hashing", result: "AC", difficulty: "CF" },
    ],
  },
  {
    rank: 3,
    handle: "@dp_master",
    rating: 1795,
    solved: 412,
    initials: "DM",
    color: "#FF0055",
    submissions: [
      { name: "DP on Trees", result: "AC", difficulty: "CF" },
      { name: "Bitmask DP", result: "AC", difficulty: "CF" },
      { name: "Topological Sort", result: "WA", difficulty: "CF" },
      { name: "Convex Hull", result: "AC", difficulty: "CF" },
      { name: "Heavy-Light Decomp", result: "AC", difficulty: "CF" },
    ],
  },
  {
    rank: 4,
    handle: "@graph_guy",
    rating: 1650,
    solved: 450,
    initials: "GG",
    color: "#00E5FF",
    submissions: [
      { name: "Dijkstra Shortest", result: "AC", difficulty: "CF" },
      { name: "Floyd-Warshall", result: "AC", difficulty: "CF" },
      { name: "1600C - Round 885", result: "WA", difficulty: "CF" },
      { name: "MST Kruskal", result: "AC", difficulty: "CF" },
      { name: "Network Flow", result: "AC", difficulty: "CF" },
    ],
  },
  {
    rank: 5,
    handle: "@tree_hugger",
    rating: 1680,
    solved: 412,
    initials: "TH",
    color: "#7B2CBF",
    submissions: [
      { name: "Segment Tree", result: "AC", difficulty: "CF" },
      { name: "Fenwick Tree BIT", result: "AC", difficulty: "CF" },
      { name: "Euler Tour Trees", result: "WA", difficulty: "CF" },
      { name: "Treap Rope", result: "AC", difficulty: "CF" },
      { name: "Persistent ST", result: "AC", difficulty: "CF" },
    ],
  },
  {
    rank: 6,
    handle: "@coder_xyz",
    rating: 1580,
    solved: 390,
    initials: "C",
    color: "#00E5FF",
    submissions: [
      { name: "1700A - Optimal Path", result: "AC", difficulty: "CF" },
      { name: "Two Sum", result: "WA", difficulty: "LC" },
      { name: "1850C - Weight of Sy...", result: "AC", difficulty: "CF" },
    ],
  },
  {
    rank: 7,
    handle: "@prime_sieve",
    rating: 1490,
    solved: 361,
    initials: "PS",
    color: "#FFD500",
    submissions: [
      { name: "Sieve Eratosthenes", result: "AC", difficulty: "CF" },
      { name: "Miller-Rabin", result: "AC", difficulty: "CF" },
      { name: "Pollard Rho", result: "WA", difficulty: "CF" },
    ],
  },
  {
    rank: 8,
    handle: "@segment_lord",
    rating: 1430,
    solved: 322,
    initials: "SL",
    color: "#FF0055",
    submissions: [
      { name: "Lazy Propagation", result: "AC", difficulty: "CF" },
      { name: "Range Queries", result: "AC", difficulty: "CF" },
      { name: "2D Segment Tree", result: "WA", difficulty: "CF" },
    ],
  },
]

const PODIUM_COLORS = ["#FFD500", "#E0E0E0", "#FF0055"]
const PODIUM_HEIGHTS = ["h-40", "h-28", "h-24"]

function CrownIcon() {
  return (
    <svg className="w-10 h-10 text-[#FFD500]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 19h20l-2-8-4 4-4-6-4 6-4-4z" />
    </svg>
  )
}

export default function LeaderboardPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const top3 = CODERS.slice(0, 3)
  const rest = CODERS.slice(3)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main className="flex-grow w-full max-w-[1000px] mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 relative">
          <span className="vector-node vector-node-tl" style={{ top: -6, left: -6 }} />
          <span className="vector-node vector-node-tr" style={{ top: -6, right: -6 }} />
          <h1 className="font-display text-[48px] md:text-[64px] lg:text-[80px] uppercase text-[#0F0F0F] text-shadow-cyan leading-none">
            LEADERBOARD
          </h1>
          <p className="inline-block font-body text-sm font-bold uppercase mt-2 bg-[#FFD500] px-6 py-2 border-[3px] border-[#0F0F0F] shadow-solid-sm">
            CLAIM YOUR SPOT AMONG THE TOP SOLVERS.
          </p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-6 mb-12 relative px-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-2xl text-[#0F0F0F]"
              style={{ backgroundColor: top3[1].color }}
            >
              {top3[1].initials}
            </div>
            <span className="font-body text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5">
              {top3[1].handle}
            </span>
            <div
              className={`w-28 ${PODIUM_HEIGHTS[1]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
              style={{ backgroundColor: PODIUM_COLORS[1] }}
            >
              <span className="font-display text-4xl text-[#0F0F0F]">2</span>
              <span className="font-body text-xs font-bold">{top3[1].rating}</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center gap-2 relative">
            <CrownIcon />
            <div
              className="w-24 h-24 border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center font-display text-3xl text-[#0F0F0F]"
              style={{ backgroundColor: top3[0].color }}
            >
              {top3[0].initials}
            </div>
            <span className="font-body text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5">
              {top3[0].handle}
            </span>
            <div
              className={`w-32 ${PODIUM_HEIGHTS[0]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
              style={{ backgroundColor: PODIUM_COLORS[0] }}
            >
              <span className="font-display text-5xl text-[#0F0F0F]">1</span>
              <span className="font-body text-xs font-bold">{top3[0].rating}</span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-2xl text-white"
              style={{ backgroundColor: top3[2].color }}
            >
              {top3[2].initials}
            </div>
            <span className="font-body text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5">
              {top3[2].handle}
            </span>
            <div
              className={`w-28 ${PODIUM_HEIGHTS[2]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
              style={{ backgroundColor: PODIUM_COLORS[2] }}
            >
              <span className="font-display text-4xl text-white">3</span>
              <span className="font-body text-xs font-bold text-white">{top3[2].rating}</span>
            </div>
          </div>
        </div>

        {/* Rank Table */}
        <div className="border-[3px] border-[#0F0F0F] shadow-solid relative">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />

          <div className="w-full overflow-x-auto">
          {rest.map((coder, i) => (
            <div key={coder.rank} className={i % 2 !== 0 ? "stipple-bg" : ""}>
              <button
                className="rank-row w-full min-w-[500px] border-b-[3px] border-[#0F0F0F] last:border-b-0 flex items-center gap-4 px-6 py-0 h-16 bg-white/80 hover:bg-white text-left"
                onClick={() => setExpandedRow(expandedRow === coder.rank ? null : coder.rank)} aria-expanded={expandedRow === coder.rank}
              >
                {/* Rank number */}
                <span className="font-display text-2xl text-[#0F0F0F] w-8 flex-shrink-0">{coder.rank}</span>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-sm flex-shrink-0"
                  style={{ backgroundColor: coder.color }}
                >
                  {coder.initials.slice(0, 1)}
                </div>

                {/* Handle */}
                <span className="font-body font-bold text-base text-[#0F0F0F] flex-1">{coder.handle}</span>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                    R: {coder.rating}
                  </span>
                  <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                    S: {coder.solved}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#0F0F0F] transition-transform ${expandedRow === coder.rank ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded: recent submissions */}
              {expandedRow === coder.rank && (
                <div className="border-b-[3px] border-[#0F0F0F] bg-[#00E5FF] px-6 py-4 animate-slide-in min-w-[500px]">
                  <p className="font-body text-[10px] font-bold uppercase text-[#0F0F0F] mb-3 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    RECENT SUBMISSIONS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {coder.submissions.map((sub, si) => (
                      <span
                        key={si}
                        className={`font-body text-[10px] font-bold px-3 py-1 border-[2px] border-[#0F0F0F] ${sub.result === "AC" ? "bg-white" : "bg-[#FF0055] text-white"}`}
                      >
                        {sub.result === "AC" ? "✓" : "✗"} {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-8">
          <button className="btn-solid font-body font-bold uppercase text-sm border-[3px] border-[#0F0F0F] shadow-solid bg-[#FFF4E0] px-8 py-3 hover:bg-[#7B2CBF] hover:text-white transition-colors flex items-center gap-2">
            LOAD MORE
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </main>

      <Marquee />
    </div>
  )
}
