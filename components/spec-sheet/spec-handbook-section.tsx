import { BookOpen } from "lucide-react"
import { RoleData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

export function SpecHandbookSection({ data, lang }: { data: RoleData; lang: SpecLanguage }) {
  return (
    <section id="handbook" className="mb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
        <div>
          <span className="bg-[#FF0055] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
            SECTION 03
          </span>
          <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] mt-1">
            {lang === "en" ? "COMMITTEE OPERATIONAL HANDBOOK" : "دليل التشغيل وإجراءات اللجنة"}
          </h3>
        </div>
        <p className="font-body text-xs font-bold text-zinc-600 uppercase">
          VISION • ROLES DISTRIBUTION • AUDITS • DOS & DON&apos;TS
        </p>
      </div>

      <div className="space-y-8">
        {/* Vision & Direction */}
        <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
          <span className="bg-[#FFD500] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F] inline-block mb-3">
            {lang === "en" ? "DIRECTION & STRATEGIC VISION" : "الرؤية والتوجه الاستراتيجي"}
          </span>
          <p className="font-body text-base md:text-lg font-bold leading-relaxed text-[#0F0F0F]">
            {lang === "en" ? data.handbook.vision.en : data.handbook.vision.ar}
          </p>
        </div>

        {/* Roles & Team Distribution */}
        <div>
          <h4 className="font-display text-2xl uppercase mb-4 text-[#0F0F0F] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7B2CBF]" />
            <span>{lang === "en" ? "Roles & Distribution" : "الأدوار وتوزيع المهام داخل اللجنة"}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.handbook.rolesDistribution.map((role, idx) => (
              <div
                key={idx}
                className="bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#0F0F0F] flex flex-col justify-between"
              >
                <div>
                  <span className="font-display text-sm text-[#7B2CBF] block mb-1">
                    ROLE_0{idx + 1}
                  </span>
                  <h5 className="font-display text-lg uppercase text-[#0F0F0F] mb-3 leading-tight">
                    {lang === "en" ? role.title.en : role.title.ar}
                  </h5>
                  <p className="font-body text-xs md:text-sm text-zinc-700 leading-relaxed font-bold">
                    {lang === "en" ? role.desc.en : role.desc.ar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Audits & Core Responsibilities */}
        <div className="bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#7B2CBF]">
          <span className="bg-[#7B2CBF] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F] inline-block mb-3">
            {lang === "en" ? "WEEKLY AUDITS & CORE PROTOCOLS" : "التدقيق الأسبوعي والمسؤوليات الأساسية"}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {data.handbook.responsibilities.map((resp, idx) => (
              <div key={idx} className="bg-white border-2 border-[#0F0F0F] p-5">
                <span className="font-display text-xs text-[#FF0055] block mb-1">
                  PROTOCOL 0{idx + 1}
                </span>
                <h5 className="font-display text-base uppercase text-[#0F0F0F] mb-2 leading-tight">
                  {lang === "en" ? resp.title.en : resp.title.ar}
                </h5>
                <p className="font-body text-xs text-zinc-600 leading-relaxed font-bold">
                  {lang === "en" ? resp.desc.en : resp.desc.ar}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Avoid vs Preferable Matrices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Avoid */}
          <div className="bg-white border-[3px] border-[#FF0055] p-6 shadow-[6px_6px_0px_#FF0055]">
            <h5 className="font-display text-xl uppercase mb-4 text-[#FF0055] flex items-center gap-2">
              <span className="w-3 h-3 bg-[#FF0055] inline-block" />
              <span>{lang === "en" ? "WHAT TO AVOID" : "ما يجب تجنبه تماماً"}</span>
            </h5>
            <ul className="space-y-3 font-body text-xs md:text-sm font-bold text-zinc-800">
              {data.handbook.dosAndDonts.avoid.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 border-b border-zinc-200 pb-2">
                  <span className="text-[#FF0055]">✕</span>
                  <span>{lang === "en" ? item.en : item.ar}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prefer */}
          <div className="bg-white border-[3px] border-[#25D366] p-6 shadow-[6px_6px_0px_#25D366]">
            <h5 className="font-display text-xl uppercase mb-4 text-[#0F0F0F] flex items-center gap-2">
              <span className="w-3 h-3 bg-[#25D366] inline-block" />
              <span>{lang === "en" ? "PREFERABLE PRACTICES" : "الممارسات المفضلة والمستحبة"}</span>
            </h5>
            <ul className="space-y-3 font-body text-xs md:text-sm font-bold text-zinc-800">
              {data.handbook.dosAndDonts.prefer.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 border-b border-zinc-200 pb-2">
                  <span className="text-[#25D366]">✓</span>
                  <span>{lang === "en" ? item.en : item.ar}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
