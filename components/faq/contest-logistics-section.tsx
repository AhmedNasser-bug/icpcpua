"use client"

import { useState } from "react"
import { CONTEST_LOGISTICS_FAQ } from "@/data/faq"

export function ContestLogisticsSection() {
  const [showLogistics, setShowLogistics] = useState(false)

  return (
    <section className="mb-16 border-[3px] border-[#0F0F0F] bg-[#0F0F0F] text-white p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-white/20 pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-black uppercase text-[#00E5FF] tracking-widest block mb-1">
            {"// ADVANCED COMPETITIVE RULES"}
          </span>
          <h2
            className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight"
          >
            ECPC Qualification &amp; Official Contest Logistics
          </h2>
        </div>
        <button
          onClick={() => setShowLogistics((prev) => !prev)}
          className="px-4 py-2 border-2 border-white bg-white text-black font-mono text-xs font-black uppercase hover:bg-[#FFD500] shadow-[3px_3px_0px_#00E5FF] transition-all self-start sm:self-auto"
        >
          {showLogistics ? "HIDE CONTEST RULES ▲" : "VIEW CONTEST RULES ▼"}
        </button>
      </div>

      {showLogistics && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTEST_LOGISTICS_FAQ.map((c) => (
              <div
                key={c.id}
                className="border-2 border-white/40 bg-zinc-900 p-5 space-y-3"
              >
                <span className="font-mono text-[10px] font-black uppercase bg-[#7B2CBF] px-2 py-0.5 text-white inline-block">
                  {c.badge}
                </span>
                <h4 className="font-bold text-base text-[#FFF4E0]">{c.qEn}</h4>
                <p className="text-xs font-mono text-gray-300 leading-relaxed">{c.aEn}</p>
                <div className="border-t border-white/10 pt-2 text-right" dir="rtl">
                  <p className="text-xs font-bold text-gray-400">{c.aAr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
