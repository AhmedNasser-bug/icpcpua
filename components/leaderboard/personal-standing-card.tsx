import { Radio, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { ViewerStanding } from "./types"

function freshness(standing: ViewerStanding): {
  label: string
  tone: string
} {
  if (standing.syncStatus === "failed") {
    return { label: "Sync needs attention", tone: "bg-[#FF0055] text-white" }
  }
  if (standing.stale) {
    return { label: "Data stale", tone: "bg-[#FFD500] text-[#0F0F0F]" }
  }
  if (!standing.codeforcesLinked) {
    return { label: "No Codeforces linked", tone: "bg-[#E0E0E0] text-[#0F0F0F]" }
  }
  if (!standing.lastSyncedAt) {
    return { label: "Not synced yet", tone: "bg-[#FFD500] text-[#0F0F0F]" }
  }
  return { label: "Data synchronized", tone: "bg-[#00E5FF] text-[#0F0F0F]" }
}

export function PersonalStandingCard({
  viewer,
  trackLabel,
  onPage,
  loading,
}: {
  viewer: ViewerStanding | null
  trackLabel: string
  onPage: boolean
  loading: boolean
}) {
  if (loading && !viewer) {
    return (
      <div className="border-[3px] border-[#0F0F0F] bg-white p-4 shadow-solid-sm font-mono text-xs uppercase">
        Locating your standing...
      </div>
    )
  }

  if (!viewer) {
    return (
      <div className="border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-4 shadow-solid-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-[#7B2CBF]" />
          <div>
            <p className="font-display text-sm uppercase text-[#0F0F0F]">Your rank is one sign-in away</p>
            <p className="font-mono text-[11px] text-neutral-700">
              Sign in to highlight your row and keep your position visible on every page.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="bg-[#7B2CBF] text-white border-[2px] border-[#0F0F0F] px-4 py-2 font-display text-xs uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FF0055]"
        >
          Open cadet profile
        </Link>
      </div>
    )
  }

  const status = freshness(viewer)

  if (!viewer.eligible) {
    return (
      <div className="border-[3px] border-[#0F0F0F] bg-white p-4 shadow-solid-sm">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-[#FF0055]" />
          <div>
            <p className="font-display text-sm uppercase text-[#0F0F0F]">
              No {trackLabel} rank for this account
            </p>
            <p className="font-mono text-[11px] text-neutral-700">
              {viewer.reason === "inactive"
                ? "This trainee is not active, so they are excluded from the leaderboard."
                : `This trainee belongs to another track and is not ranked in ${trackLabel}.`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-[3px] border-[#0F0F0F] p-4 shadow-solid-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        onPage ? "bg-[#FFD500]" : "bg-[#00E5FF]"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 border-[3px] border-[#0F0F0F] bg-white flex items-center justify-center font-display text-lg shrink-0">
          #{viewer.rank}
        </div>
        <div className="min-w-0">
          <p className="font-display text-base uppercase text-[#0F0F0F] truncate">
            {viewer.fullName} <span className="text-[#7B2CBF]">{"// your "}{trackLabel} rank</span>
          </p>
          <p className="font-mono text-[11px] text-[#0F0F0F]">
            {viewer.pointsTotal} PTS • {viewer.total ? `of ${viewer.total} cadets` : "unranked total"}
            {onPage ? " • row highlighted below" : " • outside this page"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className={`font-mono text-[10px] font-bold uppercase border-[2px] border-[#0F0F0F] px-2 py-1 ${status.tone}`}>
          {status.label}
        </span>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase bg-white border-[2px] border-[#0F0F0F] px-2 py-1 hover:bg-[#FFF4E0]"
        >
          <RefreshCw className="w-3 h-3" />
          Manage sync
        </Link>
      </div>
    </div>
  )
}
