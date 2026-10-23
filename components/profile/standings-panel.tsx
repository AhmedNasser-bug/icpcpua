import { Crown, Medal, Trophy } from "lucide-react"
import type { ViewerStanding } from "@/lib/leaderboard-types"

function StandingCard({
  title,
  standing,
}: {
  title: string
  standing: ViewerStanding | null
}) {
  if (!standing) {
    return (
      <div className="border-[3px] border-[#0F0F0F] bg-white p-4 shadow-solid-sm">
        <p className="font-mono text-xs font-bold uppercase text-[#0F0F0F]">{title}</p>
        <p className="mt-2 font-body text-sm text-neutral-600">No standing is available.</p>
      </div>
    )
  }

  if (!standing.eligible) {
    return (
      <div className="border-[3px] border-[#0F0F0F] bg-white p-4 shadow-solid-sm">
        <p className="font-mono text-xs font-bold uppercase text-[#0F0F0F]">{title}</p>
        <p className="mt-2 font-body text-sm font-bold text-[#FF0055]">
          {standing.reason === "inactive"
            ? "Not eligible: this trainee is not active."
            : `Not ranked in ${title.toLowerCase()}.`}
        </p>
      </div>
    )
  }

  return (
    <div className="relative border-[3px] border-[#0F0F0F] bg-[#FFD500] p-4 shadow-solid-sm">
      <span className="vector-node vector-node-tr" />
      <p className="font-mono text-xs font-bold uppercase text-[#0F0F0F]">{title}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-4xl leading-none text-[#0F0F0F]">#{standing.rank}</p>
          <p className="mt-1 font-mono text-[11px] uppercase text-neutral-800">
            {standing.pointsTotal} PTS
            {standing.total ? ` • of ${standing.total}` : ""}
          </p>
        </div>
        <Trophy className="h-8 w-8 text-[#7B2CBF]" />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase text-neutral-700">
        Score is the internal points ledger, not Codeforces rating.
      </p>
    </div>
  )
}

export function PersonalStandingsPanel({
  global,
  track,
  trackName,
}: {
  global: ViewerStanding | null
  track: ViewerStanding | null
  trackName: string
}) {
  return (
    <section aria-labelledby="standing-heading">
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-5 w-5 text-[#7B2CBF]" />
        <h2 id="standing-heading" className="font-display text-xl uppercase text-[#0F0F0F]">
          Your standings
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StandingCard title="Global" standing={global} />
        <StandingCard title={trackName} standing={track} />
      </div>
      <p className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase text-neutral-600">
        <Medal className="h-3.5 w-3.5" />
        Ties share the same competition rank.
      </p>
    </section>
  )
}
