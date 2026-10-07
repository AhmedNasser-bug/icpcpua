"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"
import { Footer } from "@/components/footer"
import { Trophy, Flame, Sparkles, QrCode, RefreshCw, CheckCircle2 } from "lucide-react"

interface LeaderboardUser {
  rank: number
  handle: string
  fullName?: string
  rating: number
  solved: number
  pointsTotal: number
  track?: string
  initials: string
  color: string
  attendedSessionsCount?: number
  qrScansCount?: number
  submissions?: Array<{ name: string; result: "AC" | "WA"; difficulty: string }>
}

const PODIUM_COLORS = ["#FFD500", "#E0E0E0", "#FF0055"]
const PODIUM_HEIGHTS = ["h-44", "h-32", "h-28"]

function CrownIcon() {
  return (
    <svg className="w-10 h-10 text-[#FFD500] drop-shadow-[2px_2px_0px_#0F0F0F]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 19h20l-2-8-4 4-4-6-4 6-4-4z" />
    </svg>
  )
}

export default function LeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<"all" | "level_1" | "level_2">("all")
  const [coders, setCoders] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<string>("")

  const fetchLeaderboard = async (track: "all" | "level_1" | "level_2") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?track=${track}&limit=50`)
      const data = await res.json()
      if (data.success && Array.isArray(data.leaderboard)) {
        setCoders(data.leaderboard)
      }
    } catch (err) {
      console.error("Failed to load leaderboard data:", err)
    } finally {
      setLoading(false)
      setLastRefreshed(new Date().toLocaleTimeString())
    }
  }

  useEffect(() => {
    fetchLeaderboard(selectedTrack)
  }, [selectedTrack])

  const top3 = coders.slice(0, 3)
  const rest = coders.slice(3)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#FFFDF9]">
      <PuaNavbar />

      <main className="flex-grow w-full max-w-[1060px] mx-auto px-4 sm:px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 relative">
          <span className="vector-node vector-node-tl" style={{ top: -6, left: -6 }} />
          <span className="vector-node vector-node-tr" style={{ top: -6, right: -6 }} />
          
          <div className="inline-flex items-center gap-2 bg-[#7B2CBF] text-white px-3 py-1 border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] font-mono text-xs font-bold uppercase mb-2">
            <Trophy className="w-4 h-4 text-[#FFD500]" />
            <span>SEASON 2026 // LIVE RANKINGS</span>
          </div>

          <h1 className="font-display text-[44px] md:text-[64px] lg:text-[76px] uppercase text-[#0F0F0F] text-shadow-cyan leading-none">
            LEADERBOARD
          </h1>
          <p className="inline-block font-body text-xs sm:text-sm font-bold uppercase mt-2 bg-[#FFD500] px-6 py-2 border-[3px] border-[#0F0F0F] shadow-solid-sm">
            CLAIM YOUR SPOT AMONG PUA&apos;S ELITE PROBLEM SOLVERS.
          </p>
        </div>

        {/* Filter Controls & Track Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-3 shadow-solid-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase text-[#0F0F0F]">Track Filter:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSelectedTrack("all")}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "all"
                    ? "bg-[#7B2CBF] text-white shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                All Cadets
              </button>
              <button
                onClick={() => setSelectedTrack("level_1")}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "level_1"
                    ? "bg-[#00E5FF] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                Level 1 (Fundamentals)
              </button>
              <button
                onClick={() => setSelectedTrack("level_2")}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "level_2"
                    ? "bg-[#FF0055] text-white shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                Level 2 (Advanced)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {lastRefreshed && (
              <span className="hidden sm:inline font-mono text-[10px] text-neutral-600 uppercase">
                Synced: {lastRefreshed}
              </span>
            )}
            <Link
              href="/claim"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD500] hover:bg-[#ecc500] border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0F0F0F]" />
              <span>Claim Code</span>
            </Link>
            <button
              onClick={() => fetchLeaderboard(selectedTrack)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase hover:bg-neutral-100 shadow-[2px_2px_0px_#0F0F0F] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7B2CBF]" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Podium Display (Top 3) */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 sm:gap-6 mb-12 relative px-2 sm:px-4">
            {/* 2nd place */}
            {top3[1] && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 sm:w-20 h-16 sm:h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-xl sm:text-2xl text-[#0F0F0F]"
                  style={{ backgroundColor: top3[1].color || "#E0E0E0" }}
                >
                  {top3[1].initials}
                </div>
                <span className="font-body text-[9px] sm:text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5 truncate max-w-[110px]">
                  {top3[1].handle}
                </span>
                <div
                  className={`w-24 sm:w-28 ${PODIUM_HEIGHTS[1]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
                  style={{ backgroundColor: PODIUM_COLORS[1] }}
                >
                  <span className="font-display text-3xl sm:text-4xl text-[#0F0F0F]">2</span>
                  <span className="font-body text-xs font-bold">{top3[1].pointsTotal} PTS</span>
                  <span className="font-mono text-[9px] text-neutral-700">R: {top3[1].rating}</span>
                </div>
              </div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <div className="flex flex-col items-center gap-2 relative">
                <CrownIcon />
                <div
                  className="w-20 sm:w-24 h-20 sm:h-24 border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center font-display text-2xl sm:text-3xl text-[#0F0F0F]"
                  style={{ backgroundColor: top3[0].color || "#FFD500" }}
                >
                  {top3[0].initials}
                </div>
                <span className="font-body text-[10px] sm:text-xs font-bold uppercase text-[#0F0F0F] bg-[#00E5FF] border-[2px] border-[#0F0F0F] px-2.5 py-0.5 truncate max-w-[130px]">
                  {top3[0].handle}
                </span>
                <div
                  className={`w-28 sm:w-32 ${PODIUM_HEIGHTS[0]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
                  style={{ backgroundColor: PODIUM_COLORS[0] }}
                >
                  <span className="font-display text-4xl sm:text-5xl text-[#0F0F0F]">1</span>
                  <span className="font-body text-sm font-bold">{top3[0].pointsTotal} PTS</span>
                  <span className="font-mono text-[10px] text-neutral-800 font-bold">R: {top3[0].rating} // S: {top3[0].solved}</span>
                </div>
              </div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 sm:w-20 h-16 sm:h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-xl sm:text-2xl text-white"
                  style={{ backgroundColor: top3[2].color || "#FF0055" }}
                >
                  {top3[2].initials}
                </div>
                <span className="font-body text-[9px] sm:text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5 truncate max-w-[110px]">
                  {top3[2].handle}
                </span>
                <div
                  className={`w-24 sm:w-28 ${PODIUM_HEIGHTS[2]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
                  style={{ backgroundColor: PODIUM_COLORS[2] }}
                >
                  <span className="font-display text-3xl sm:text-4xl text-white">3</span>
                  <span className="font-body text-xs font-bold text-white">{top3[2].pointsTotal} PTS</span>
                  <span className="font-mono text-[9px] text-neutral-100">R: {top3[2].rating}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Ranking Table */}
        <div className="border-[3px] border-[#0F0F0F] shadow-solid bg-white relative">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />

          {/* Table Header Bar */}
          <div className="border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-3 flex items-center justify-between font-mono text-xs font-bold uppercase">
            <span className="text-[#0F0F0F]">Cadet Ranking Matrix</span>
            <span className="text-[#7B2CBF]">Score = Points (Solves + Attendance + QR)</span>
          </div>

          <div className="w-full overflow-x-auto">
            {loading && coders.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm uppercase">
                Loading official standing records...
              </div>
            ) : rest.length === 0 && top3.length <= 3 ? (
              <div className="p-8 text-center font-mono text-sm text-neutral-600">
                All top cadets are displayed on the podium. More standings will populate as cadets register!
              </div>
            ) : (
              rest.map((coder, i) => (
                <div key={coder.rank} className={i % 2 !== 0 ? "stipple-bg" : ""}>
                  <button
                    className="rank-row w-full min-w-[580px] border-b-[2px] border-[#0F0F0F] last:border-b-0 flex items-center gap-4 px-6 py-0 h-16 bg-white/80 hover:bg-neutral-50 text-left transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === coder.rank ? null : coder.rank)}
                    aria-expanded={expandedRow === coder.rank}
                  >
                    {/* Rank number */}
                    <span className="font-display text-2xl text-[#0F0F0F] w-8 flex-shrink-0">
                      #{coder.rank}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] flex items-center justify-center font-display text-sm flex-shrink-0"
                      style={{ backgroundColor: coder.color || "#00E5FF" }}
                    >
                      {coder.initials.slice(0, 2)}
                    </div>

                    {/* Name & Handle */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-body font-bold text-sm text-[#0F0F0F] truncate">
                        {coder.fullName || coder.handle}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-600 truncate">
                        {coder.handle} {coder.track ? `• [${coder.track.toUpperCase()}]` : ""}
                      </span>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-body text-xs font-bold bg-[#FFD500] border-[2px] border-[#0F0F0F] px-2.5 py-1 shadow-[2px_2px_0px_#0F0F0F]">
                        {coder.pointsTotal} PTS
                      </span>
                      <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                        CF: {coder.rating}
                      </span>
                      <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                        Solved: {coder.solved}
                      </span>
                      <svg
                        className={`w-4 h-4 text-[#0F0F0F] transition-transform ${
                          expandedRow === coder.rank ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded: Breakdown Details */}
                  {expandedRow === coder.rank && (
                    <div className="border-b-[2px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-4 animate-slide-in min-w-[580px]">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                            <CheckCircle2 className="w-4 h-4 text-[#7B2CBF]" />
                            <span>Sessions Attended: {coder.attendedSessionsCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                            <QrCode className="w-4 h-4 text-[#FF0055]" />
                            <span>Campus QR Scans: {coder.qrScansCount || 0}</span>
                          </div>
                        </div>

                        <span className="font-mono text-[10px] uppercase bg-white border border-[#0F0F0F] px-2 py-0.5">
                          Verified Trainee Record
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Banner at bottom */}
        <div className="mt-8 p-4 bg-[#00E5FF] border-[3px] border-[#0F0F0F] shadow-solid-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-[#0F0F0F] shrink-0" />
            <p className="font-body text-xs font-bold text-[#0F0F0F]">
              Points are earned through registration (+10), attending weekly training gyms, upsolving problems, and scanning on-campus challenge QR codes.
            </p>
          </div>
          <a
            href="/join"
            className="shrink-0 bg-[#FFD500] text-[#0F0F0F] border-[2px] border-[#0F0F0F] px-4 py-2 font-display text-xs uppercase tracking-wider shadow-[2px_2px_0px_#0F0F0F] hover:bg-white transition-colors"
          >
            JOIN TO COMPETE &rarr;
          </a>
        </div>
      </main>

      <Marquee />
      <Footer />
    </div>
  )
}
