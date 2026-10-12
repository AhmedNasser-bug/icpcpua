"use client"

import { useState, useEffect } from "react"
import { Trophy, Flame, RefreshCw } from "lucide-react"
import type { LeaderboardUser } from "@/components/leaderboard/types"
import { LeaderboardPodium } from "@/components/leaderboard/podium"
import { LeaderboardRankingTable } from "@/components/leaderboard/ranking-table"

export default function LeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<"all" | "level_1" | "level_2">("all")
  const [coders, setCoders] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<string>("")

  const fetchLeaderboard = (track: "all" | "level_1" | "level_2") => {
    fetch(`/api/leaderboard?track=${track}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.leaderboard)) {
          setCoders(data.leaderboard)
        }
      })
      .catch((err) => {
        console.error("Failed to load leaderboard data:", err)
      })
      .finally(() => {
        setLoading(false)
        setLastRefreshed(new Date().toLocaleTimeString())
      })
  }

  useEffect(() => {
    fetchLeaderboard(selectedTrack)
  }, [selectedTrack])

  const handleSelectTrack = (track: "all" | "level_1" | "level_2") => {
    if (track === selectedTrack) return
    setLoading(true)
    setSelectedTrack(track)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchLeaderboard(selectedTrack)
  }

  const top3 = coders.slice(0, 3)

  return (
    <div className="flex-grow flex flex-col bg-[#FFFDF9]">
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
                onClick={() => handleSelectTrack("all")}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "all"
                    ? "bg-[#7B2CBF] text-white shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                All Cadets
              </button>
              <button
                onClick={() => handleSelectTrack("level_1")}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "level_1"
                    ? "bg-[#00E5FF] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                Level 1 (Fundamentals)
              </button>
              <button
                onClick={() => handleSelectTrack("level_2")}
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

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="font-mono text-[10px] text-neutral-600 uppercase">
                Synced: {lastRefreshed}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase hover:bg-neutral-100 shadow-[2px_2px_0px_#0F0F0F] active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7B2CBF]" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Podium Display (Top 3) */}
        <LeaderboardPodium entries={top3} />

        {/* Full Ranking Table */}
        <LeaderboardRankingTable
          coders={coders}
          loading={loading}
          expandedRank={expandedRow}
          onToggleRank={(rank) => setExpandedRow(expandedRow === rank ? null : rank)}
        />

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
    </div>
  )
}
