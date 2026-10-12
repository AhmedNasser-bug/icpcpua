import type { LeaderboardUser } from "./types"

const PODIUM_COLORS = ["#FFD500", "#E0E0E0", "#FF0055"]
const PODIUM_HEIGHTS = ["h-44", "h-32", "h-28"]

function CrownIcon() {
  return (
    <svg className="w-10 h-10 text-[#FFD500] drop-shadow-[2px_2px_0px_#0F0F0F]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 19h20l-2-8-4 4-4-6-4 6-4-4z" />
    </svg>
  )
}

export function LeaderboardPodium({ entries }: { entries: LeaderboardUser[] }) {
  if (entries.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-4 sm:gap-6 mb-12 relative px-2 sm:px-4">
      {/* 2nd place */}
      {entries[1] && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 sm:w-20 h-16 sm:h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-xl sm:text-2xl text-[#0F0F0F]"
            style={{ backgroundColor: entries[1].color || "#E0E0E0" }}
          >
            {entries[1].initials}
          </div>
          <span className="font-body text-[9px] sm:text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5 truncate max-w-[110px]">
            {entries[1].handle}
          </span>
          <div
            className={`w-24 sm:w-28 ${PODIUM_HEIGHTS[1]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
            style={{ backgroundColor: PODIUM_COLORS[1] }}
          >
            <span className="font-display text-3xl sm:text-4xl text-[#0F0F0F]">2</span>
            <span className="font-body text-xs font-bold">{entries[1].pointsTotal} PTS</span>
            <span className="font-mono text-[9px] text-neutral-700">R: {entries[1].rating}</span>
          </div>
        </div>
      )}

      {/* 1st place */}
      {entries[0] && (
        <div className="flex flex-col items-center gap-2 relative">
          <CrownIcon />
          <div
            className="w-20 sm:w-24 h-20 sm:h-24 border-[3px] border-[#0F0F0F] shadow-solid flex items-center justify-center font-display text-2xl sm:text-3xl text-[#0F0F0F]"
            style={{ backgroundColor: entries[0].color || "#FFD500" }}
          >
            {entries[0].initials}
          </div>
          <span className="font-body text-[10px] sm:text-xs font-bold uppercase text-[#0F0F0F] bg-[#00E5FF] border-[2px] border-[#0F0F0F] px-2.5 py-0.5 truncate max-w-[130px]">
            {entries[0].handle}
          </span>
          <div
            className={`w-28 sm:w-32 ${PODIUM_HEIGHTS[0]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
            style={{ backgroundColor: PODIUM_COLORS[0] }}
          >
            <span className="font-display text-4xl sm:text-5xl text-[#0F0F0F]">1</span>
            <span className="font-body text-sm font-bold">{entries[0].pointsTotal} PTS</span>
            <span className="font-mono text-[10px] text-neutral-800 font-bold">R: {entries[0].rating} {"// S: "}{entries[0].solved}</span>
          </div>
        </div>
      )}

      {/* 3rd place */}
      {entries[2] && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 sm:w-20 h-16 sm:h-20 border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center font-display text-xl sm:text-2xl text-white"
            style={{ backgroundColor: entries[2].color || "#FF0055" }}
          >
            {entries[2].initials}
          </div>
          <span className="font-body text-[9px] sm:text-[10px] font-bold uppercase text-[#0F0F0F] bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5 truncate max-w-[110px]">
            {entries[2].handle}
          </span>
          <div
            className={`w-24 sm:w-28 ${PODIUM_HEIGHTS[2]} border-[3px] border-[#0F0F0F] shadow-solid flex flex-col items-center justify-center gap-1`}
            style={{ backgroundColor: PODIUM_COLORS[2] }}
          >
            <span className="font-display text-3xl sm:text-4xl text-white">3</span>
            <span className="font-body text-xs font-bold text-white">{entries[2].pointsTotal} PTS</span>
            <span className="font-mono text-[9px] text-neutral-100">R: {entries[2].rating}</span>
          </div>
        </div>
      )}
    </div>
  )
}
