import Link from "next/link"
import { Trophy } from "lucide-react"

interface ScoutLeaderboardEntry {
  rank: number
  name: string
  points: number
}

export function ScoutLeaderboard({ entries }: { entries: ScoutLeaderboardEntry[] }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
      {/* Left: Leaderboard */}
      <div className="lg:col-span-8 bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#FFD500] relative">
        <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]" />
        <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]" />
        <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]" />
        <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]" />

        <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#FFD500]" />
            <h3
              className="font-display text-2xl md:text-3xl font-black uppercase text-white tracking-tight"
            >
              POINTS LEADERBOARD
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-[#00E5FF]">TOP SQUAD SCOUTS</span>
        </div>

        <div className="space-y-3 font-mono">
          {entries.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-700 shadow-[2px_2px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center gap-4">
                <span className="font-black text-lg text-[#FFD500]">0{item.rank}</span>
                <span className="font-bold text-sm uppercase text-zinc-100">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00E5FF] text-[#0F0F0F] font-black text-xs px-2.5 py-1 border border-black shadow-[1px_1px_0px_#FFF4E0]">
                  {item.points} PTS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Directive / Anti-Fraud Notice */}
      <div className="lg:col-span-4 bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#0F0F0F] space-y-4">
        <div className="inline-block bg-[#0F0F0F] text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest">
          SYSTEM DIRECTIVE
        </div>

        <h4
          className="font-display text-xl font-black uppercase text-[#0F0F0F]"
        >
          VERIFICATION RULES
        </h4>

        <p className="font-mono text-xs text-gray-700 leading-relaxed font-bold">
          Points are credited automatically when a new student completes the official ICPC PUA intake form with your referral code. Duplicate IDs and self-referrals are automatically filtered.
        </p>

        <Link
          href="/join"
          className="block w-full text-center bg-[#7B2CBF] text-white border-[2px] border-[#0F0F0F] py-3 px-4 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all"
        >
          OPEN CADET INTAKE PORTAL →
        </Link>
      </div>
    </section>
  )
}
