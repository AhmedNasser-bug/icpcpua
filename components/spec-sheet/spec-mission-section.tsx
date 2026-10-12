import { AlertTriangle, Zap } from "lucide-react"
import { VectorNodes } from "@/components/vector-nodes"
import { RoleData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

export function SpecMissionSection({ data, lang }: { data: RoleData; lang: SpecLanguage }) {
  return (
    <section id="mission" className="mb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
        <div>
          <span
            className="px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F] inline-block mb-1"
            style={{ backgroundColor: data.themeColor, color: data.themeText }}
          >
            SECTION 01 // STRATEGIC VALUE PROPOSITION
          </span>
          <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F]">
            {lang === "en" ? "PROBLEMS SOLVED & STRATEGIC IMPACT" : "المشكلات التي تقضي عليها اللجنة والأثر الاستراتيجي"}
          </h3>
        </div>
        <p className="font-body text-xs font-bold text-zinc-600 uppercase">
          {lang === "en" ? "OPERATIONAL PURPOSE // 2026-2027 SEASON" : "الغاية التشغيلية // موسم 2026-2027"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Problems Solved */}
        <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#FF0055] relative flex flex-col justify-between">
          <VectorNodes />

          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#0F0F0F]">
              <div className="w-10 h-10 bg-[#FF0055] text-white border-2 border-[#0F0F0F] flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display text-2xl uppercase tracking-tight text-[#0F0F0F]">
                  {lang === "en" ? "CRITICAL BOTTLENECKS ELIMINATED" : "المشكلات الجذرية التي تقضي عليها اللجنة"}
                </h4>
                <p className="font-body text-xs text-zinc-600 font-bold uppercase">
                  {lang === "en" ? "Targeted failures & systemic challenges" : "التحديات الهيكلية ونقاط الضعف المعالجة"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.problemsSolved?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFF4E0] border-2 border-[#0F0F0F] p-4.5 shadow-[4px_4px_0px_#0F0F0F] hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-display text-base font-bold px-2 py-0.5 bg-[#FF0055] text-white border border-[#0F0F0F] shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-display text-base md:text-lg uppercase text-[#0F0F0F] leading-snug">
                        {item.title[lang]}
                      </h5>
                      <p className="font-body text-xs md:text-sm text-zinc-800 leading-relaxed font-semibold">
                        {item.desc[lang]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Strategic Impact */}
        <div className="bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#00E5FF] relative flex flex-col justify-between">
          <VectorNodes />

          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-zinc-700">
              <div
                className="w-10 h-10 border-2 border-white flex items-center justify-center font-bold"
                style={{ backgroundColor: data.themeColor, color: data.themeText }}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display text-2xl uppercase tracking-tight text-white">
                  {lang === "en" ? "TRANSFORMATIVE STRATEGIC IMPACT" : "الأثر الاستراتيجي والتحول الفعلي"}
                </h4>
                <p className="font-body text-xs text-zinc-400 font-bold uppercase">
                  {lang === "en" ? "Measurable outcomes & lasting benchmarks" : "المخرجات الملموسة والنتائج التنافسية"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.impact?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900 border-2 border-zinc-700 p-4.5 shadow-[4px_4px_0px_#00E5FF] hover:border-[#00E5FF] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="font-display text-base font-bold px-2 py-0.5 border border-[#0F0F0F] shrink-0"
                      style={{ backgroundColor: data.themeColor, color: data.themeText }}
                    >
                      0{idx + 1}
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-display text-base md:text-lg uppercase text-white leading-snug">
                        {item.title[lang]}
                      </h5>
                      <p className="font-body text-xs md:text-sm text-zinc-300 leading-relaxed font-semibold">
                        {item.desc[lang]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
