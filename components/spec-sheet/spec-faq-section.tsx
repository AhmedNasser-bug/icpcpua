"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { RoleData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

export function SpecFaqSection({ data, lang }: { data: RoleData; lang: SpecLanguage }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx)
  }

  return (
    <section id="faq" className="mb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
        <div>
          <span className="bg-[#00E5FF] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
            SECTION 04
          </span>
          <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] mt-1">
            {lang === "en" ? "FREQUENTLY ASKED QUESTIONS" : "الأسئلة الشائعة الخاصة باللجنة"}
          </h3>
        </div>
        <p className="font-body text-xs font-bold text-zinc-600 uppercase">
          {lang === "en" ? "COMMONLY RAISED QUESTIONS" : "أبرز الاستفسارات المتكررة"}
        </p>
      </div>

      <div className="space-y-4">
        {data.handbook.faq.map((item, idx) => {
          const isOpen = activeFaq === idx
          return (
            <div
              key={idx}
              className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-display text-base md:text-lg uppercase text-[#0F0F0F] hover:bg-[#FFF4E0] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#7B2CBF] shrink-0" />
                  <span>{lang === "en" ? item.q.en : item.q.ar}</span>
                </span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isOpen ? "rotate-180 text-[#7B2CBF]" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t-2 border-[#0F0F0F] bg-white font-body text-xs md:text-sm font-bold text-zinc-700 leading-relaxed">
                  <span className="text-[#FF0055] font-display text-sm mr-1 block mb-1">ANSWER:</span>
                  {lang === "en" ? item.a.en : item.a.ar}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
