"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Trophy, Flame, RefreshCw } from "lucide-react"
import type {
  LeaderboardSource,
  LeaderboardTrack,
  LeaderboardUser,
  ViewerStanding,
} from "@/components/leaderboard/types"
import { LeaderboardPodium } from "@/components/leaderboard/podium"
import { LeaderboardRankingTable } from "@/components/leaderboard/ranking-table"
import { LeaderboardPagination } from "@/components/leaderboard/pagination"
import { PersonalStandingCard } from "@/components/leaderboard/personal-standing-card"

const PAGE_SIZE = 50

const TRACK_LABELS: Record<LeaderboardTrack, string> = {
  all: "global",
  level_1: "Level 1",
  level_2: "Level 2",
}

export default function LeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<LeaderboardTrack>("all")
  const [page, setPage] = useState(1)
  const [coders, setCoders] = useState<LeaderboardUser[]>([])
  const [viewer, setViewer] = useState<ViewerStanding | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [source, setSource] = useState<LeaderboardSource>("firestore")
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const requestId = useRef(0)

  const fetchLeaderboard = useCallback(async (track: LeaderboardTrack, targetPage: number) => {
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest

    try {
      const response = await fetch(
        `/api/leaderboard?track=${track}&page=${targetPage}&limit=${PAGE_SIZE}`,
        { credentials: "same-origin" }
      )
      const data = await response.json()

      if (!response.ok || !data.success || !Array.isArray(data.leaderboard)) {
        throw new Error(data.error || "Failed to load leaderboard data.")
      }

      if (currentRequest !== requestId.current) return

      setCoders(data.leaderboard)
      setViewer(data.viewer ?? null)
      setTotal(typeof data.total === "number" ? data.total : data.leaderboard.length)
      setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 0)
      setSource(data.source ?? "firestore")
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (error) {
      if (currentRequest !== requestId.current) return
      console.error("Failed to load leaderboard data:", error)
      setErrorMsg(
        "Could not refresh the standings. If results were already loaded, the last valid leaderboard is still shown."
      )
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [])

  // Fetching after hydration is the only way to read the server-authoritative
  // ranking; the state updates land after the request settles.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchLeaderboard(selectedTrack, page)
  }, [fetchLeaderboard, selectedTrack, page])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSelectTrack = (track: LeaderboardTrack) => {
    if (track === selectedTrack) return
    setErrorMsg(null)
    setLoading(true)
    setExpandedRow(null)
    setPage(1)
    setSelectedTrack(track)
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return
    setErrorMsg(null)
    setLoading(true)
    setExpandedRow(null)
    setPage(nextPage)
  }

  const handleRefresh = () => {
    setErrorMsg(null)
    setLoading(true)
    void fetchLeaderboard(selectedTrack, page)
  }

  const showPodium = page === 1
  const top3 = showPodium ? coders.slice(0, 3) : []
  const viewerOnPage = Boolean(
    viewer?.universityId && coders.some((coder) => coder.universityId === viewer.universityId)
  )

  return (
    <div className="flex-grow flex flex-col bg-[#FFFDF9]">
      <main className="flex-grow w-full max-w-[1060px] mx-auto px-4 sm:px-6 py-12">
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
            RANKED BY INTERNAL POINTS, ENRICHED WITH SYNCHRONIZED CODEFORCES DATA.
          </p>
        </div>

        <div className="mb-5">
          <PersonalStandingCard
            viewer={viewer}
            trackLabel={TRACK_LABELS[selectedTrack]}
            onPage={viewerOnPage}
            loading={loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-3 shadow-solid-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase text-[#0F0F0F]">Track Filter:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectTrack("all")}
                aria-pressed={selectedTrack === "all"}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "all"
                    ? "bg-[#7B2CBF] text-white shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                All Cadets
              </button>
              <button
                type="button"
                onClick={() => handleSelectTrack("level_1")}
                aria-pressed={selectedTrack === "level_1"}
                className={`px-3 py-1.5 border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase transition-all ${
                  selectedTrack === "level_1"
                    ? "bg-[#00E5FF] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]"
                    : "bg-white text-[#0F0F0F] hover:bg-neutral-100"
                }`}
              >
                Level 1 (Fundamentals)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTrack("level_2")}
                aria-pressed={selectedTrack === "level_2"}
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
                Loaded: {lastRefreshed}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-[#0F0F0F] font-mono text-xs font-bold uppercase hover:bg-neutral-100 shadow-[2px_2px_0px_#0F0F0F] active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7B2CBF]" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border-[3px] border-[#FF0055] bg-red-100 p-4 font-mono text-xs text-[#FF0055]"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {(source === "local_cache" || source === "seed_defaults") && (
          <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#E0E0E0] p-3 font-mono text-[11px] uppercase">
            Demo standings: connect Firebase credentials to rank real cadet records. These
            sample rows are not synchronized Codeforces accounts.
          </div>
        )}

        {showPodium && <LeaderboardPodium entries={top3} />}

        <LeaderboardRankingTable
          coders={coders}
          loading={loading}
          expandedKey={expandedRow}
          onToggleRow={(key) => setExpandedRow(expandedRow === key ? null : key)}
          skipTop={showPodium ? 3 : 0}
          viewerId={viewer?.universityId}
        />

        <LeaderboardPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={handlePageChange}
          disabled={loading}
        />

        <div className="mt-8 p-4 bg-[#00E5FF] border-[3px] border-[#0F0F0F] shadow-solid-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-[#0F0F0F] shrink-0" />
            <p className="font-body text-xs font-bold text-[#0F0F0F]">
              Positions use the existing internal points ledger (registration, attended sessions,
              upsolves, coach bonuses and QR scans). Codeforces ratings and solved counts are
              synchronized for display and never replace your platform score.
            </p>
          </div>
          <a
            href="/profile"
            className="shrink-0 bg-[#FFD500] text-[#0F0F0F] border-[2px] border-[#0F0F0F] px-4 py-2 font-display text-xs uppercase tracking-wider shadow-[2px_2px_0px_#0F0F0F] hover:bg-white transition-colors"
          >
            LINK CODEFORCES &rarr;
          </a>
        </div>
      </main>
    </div>
  )
}
