import { CheckCircle2, QrCode } from "lucide-react"
import type { LeaderboardUser } from "./types"

export function LeaderboardRankingTable({
  coders,
  loading,
  expandedRank,
  onToggleRank,
}: {
  coders: LeaderboardUser[]
  loading: boolean
  expandedRank: number | null
  onToggleRank: (rank: number) => void
}) {
  const rest = coders.slice(3)

  return (
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
        ) : rest.length === 0 && coders.slice(0, 3).length <= 3 ? (
          <div className="p-8 text-center font-mono text-sm text-neutral-600">
            All top cadets are displayed on the podium. More standings will populate as cadets register!
          </div>
        ) : (
          rest.map((coder, i) => (
            <div key={coder.rank} className={i % 2 !== 0 ? "stipple-bg" : ""}>
              <button
                className="rank-row w-full min-w-[580px] border-b-[2px] border-[#0F0F0F] last:border-b-0 flex items-center gap-4 px-6 py-0 h-16 bg-white/80 hover:bg-neutral-50 text-left transition-colors cursor-pointer"
                onClick={() => onToggleRank(coder.rank)}
                aria-expanded={expandedRank === coder.rank}
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
                      expandedRank === coder.rank ? "rotate-180" : ""
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
              {expandedRank === coder.rank && (
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
  )
}
