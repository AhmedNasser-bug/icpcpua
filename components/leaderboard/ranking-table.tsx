import { CheckCircle2, ExternalLink, QrCode, RefreshCw, TriangleAlert } from "lucide-react"
import type { LeaderboardUser } from "./types"

function ratingLabel(rating: number | null): string {
  return rating === null ? "Unrated" : String(rating)
}

function solvedLabel(solved: number | null): string {
  return solved === null ? "—" : String(solved)
}

export function LeaderboardRankingTable({
  coders,
  loading,
  expandedKey,
  onToggleRow,
  skipTop = 0,
  viewerId,
}: {
  coders: LeaderboardUser[]
  loading: boolean
  expandedKey: string | null
  onToggleRow: (key: string) => void
  skipTop?: number
  viewerId?: string | null
}) {
  const rest = coders.slice(skipTop)

  return (
    <div className="border-[3px] border-[#0F0F0F] shadow-solid bg-white relative">
      <span className="vector-node vector-node-tl" />
      <span className="vector-node vector-node-tr" />
      <span className="vector-node vector-node-bl" />
      <span className="vector-node vector-node-br" />

      <div className="border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs font-bold uppercase">
        <span className="text-[#0F0F0F]">Cadet Ranking Matrix</span>
        <span className="text-[#7B2CBF]">Ranked by internal points • CF stats synchronized</span>
      </div>

      <div className="w-full overflow-x-auto">
        {loading && coders.length === 0 ? (
          <div className="p-12 text-center font-mono text-sm uppercase" role="status">
            Loading official standing records...
          </div>
        ) : rest.length === 0 ? (
          <div className="p-8 text-center font-mono text-sm text-neutral-600">
            {coders.length === 0
              ? "No cadets match this filter yet."
              : "All qualifying cadets on this page are shown on the podium."}
          </div>
        ) : (
          rest.map((coder, index) => {
            const rowKey = coder.universityId || `${coder.handle}-${coder.rank}-${index}`
            const isExpanded = expandedKey === rowKey
            const highlighted =
              coder.isViewer || Boolean(viewerId && coder.universityId === viewerId)

            return (
              <div
                key={rowKey}
                className={`${index % 2 !== 0 ? "stipple-bg" : ""} ${
                  highlighted ? "border-y-[3px] border-[#7B2CBF]" : ""
                }`}
              >
                <button
                  className={`rank-row w-full min-w-[640px] border-b-[2px] border-[#0F0F0F] last:border-b-0 flex items-center gap-4 px-6 py-0 h-16 text-left transition-colors cursor-pointer ${
                    highlighted ? "bg-[#FFD500]/50 hover:bg-[#FFD500]/70" : "bg-white/80 hover:bg-neutral-50"
                  }`}
                  onClick={() => onToggleRow(rowKey)}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle details for ${coder.fullName || coder.handle}, rank ${coder.rank}`}
                >
                  <span className="font-display text-2xl text-[#0F0F0F] w-10 flex-shrink-0">
                    #{coder.rank}
                  </span>

                  <div
                    className="w-10 h-10 border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] flex items-center justify-center font-display text-sm flex-shrink-0"
                    style={{ backgroundColor: coder.color || "#00E5FF" }}
                  >
                    {coder.initials.slice(0, 2)}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-body font-bold text-sm text-[#0F0F0F] truncate">
                      {coder.fullName || coder.handle}
                      {highlighted && (
                        <span className="ml-2 font-mono text-[9px] uppercase bg-[#7B2CBF] text-white border border-[#0F0F0F] px-1.5 py-0.5">
                          You
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-600 truncate">
                      {coder.handle} {coder.track ? `• [${coder.track.toUpperCase()}]` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-body text-xs font-bold bg-[#FFD500] border-[2px] border-[#0F0F0F] px-2.5 py-1 shadow-[2px_2px_0px_#0F0F0F]">
                      {coder.pointsTotal} PTS
                    </span>
                    <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                      CF: {ratingLabel(coder.rating)}
                    </span>
                    <span className="font-body text-xs font-bold bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-1">
                      Solved: {solvedLabel(coder.solved)}
                    </span>
                    <svg
                      className={`w-4 h-4 text-[#0F0F0F] transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-b-[2px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-4 animate-slide-in min-w-[640px]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                          <CheckCircle2 className="w-4 h-4 text-[#7B2CBF]" />
                          <span>Sessions Attended: {coder.attendedSessionsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                          <QrCode className="w-4 h-4 text-[#FF0055]" />
                          <span>Campus QR Scans: {coder.qrScansCount || 0}</span>
                        </div>
                        <span className="font-mono text-xs font-bold bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5">
                          Max CF: {ratingLabel(coder.maxRating)}
                        </span>
                        {coder.codeforcesHandle && coder.codeforcesUrl && (
                          <a
                            href={coder.codeforcesUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold underline text-[#7B2CBF] hover:text-[#FF0055]"
                          >
                            @{coder.codeforcesHandle}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {coder.syncStatus === "failed" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase bg-[#FF0055] text-white border border-[#0F0F0F] px-2 py-0.5">
                            <TriangleAlert className="w-3 h-3" />
                            Last sync failed • showing last valid data
                          </span>
                        ) : coder.stale ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase bg-[#FFD500] border border-[#0F0F0F] px-2 py-0.5">
                            <TriangleAlert className="w-3 h-3" />
                            Stale • last synced {new Date(coder.lastSyncedAt!).toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase bg-white border border-[#0F0F0F] px-2 py-0.5">
                            <RefreshCw className="w-3 h-3" />
                            {coder.lastSyncedAt
                              ? `Synced ${new Date(coder.lastSyncedAt).toLocaleString()}`
                              : "Not synchronized yet"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
