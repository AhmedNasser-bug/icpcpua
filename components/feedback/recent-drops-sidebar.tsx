"use client"

import { useState } from "react"
import { FeedbackDrop, FeedbackDropCard } from "./drop-card"

export function RecentDropsSidebar({ drops }: { drops: FeedbackDrop[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("ALL")

  const filteredDrops = activeFilter === "ALL"
    ? drops
    : drops.filter((d) => d.category === activeFilter)

  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-4 shadow-[6px_6px_0px_#0F0F0F] flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl uppercase text-[#0F0F0F]">
            RECENT DROPS
          </h2>
          <p className="font-body text-xs font-bold text-[#0F0F0F]/70 uppercase">
            LIVE COMMUNITY TRANSMISSIONS
          </p>
        </div>
        <span className="bg-[#0F0F0F] text-[#FFD500] font-body text-xs font-bold px-2 py-1">
          {drops.length} BYTES
        </span>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "BUG_REPORT", "SUGGESTION", "SHOUTOUT"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`font-body text-xs font-bold px-2.5 py-1 border-2 border-[#0F0F0F] transition-all cursor-pointer ${
              activeFilter === f
                ? "bg-[#7B2CBF] text-white shadow-[2px_2px_0px_#0F0F0F]"
                : "bg-white text-[#0F0F0F] hover:bg-[#FFF4E0]"
            }`}
          >
            #{f}
          </button>
        ))}
      </div>

      {/* Drops List */}
      <div className="space-y-4">
        {filteredDrops.map((drop) => (
          <FeedbackDropCard key={drop.id} drop={drop} />
        ))}
      </div>

      <div className="bg-[#FFF4E0] border-[2px] border-dashed border-[#0F0F0F] p-4 text-center">
        <p className="font-body text-xs font-bold text-zinc-600 uppercase">
          {"// AUTOMATED CLEANUP CYCLE RUNS EVERY 24H"}
        </p>
      </div>
    </aside>
  )
}
