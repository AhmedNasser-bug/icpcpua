import { AlertTriangle, Shield, Star, Target } from "lucide-react"
import { VectorNodes } from "@/components/vector-nodes"
import { RoleData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

export function SpecContractSection({ data, lang }: { data: RoleData; lang: SpecLanguage }) {
  return (
    <section id="contract" className="mb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
        <div>
          <span className="bg-[#7B2CBF] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
            SECTION 02
          </span>
          <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] mt-1">
            {lang === "en" ? "THE ROLE CONTRACT & AUDIT MATRIX" : "عقد ومصفوفة تدقيق الدور"}
          </h3>
        </div>
        <p className="font-body text-xs font-bold text-zinc-600 uppercase">
          SELLING POINTS • OWNS • METRICS • ANTI-GOALS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body">
        {/* Quadrant 1: Selling Points */}
        <div className="relative bg-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
          <VectorNodes />

          <h4 className="font-display text-2xl uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2 flex items-center gap-3">
            <Star className="w-6 h-6" style={{ color: data.themeColor }} />
            <span>{lang === "en" ? "Selling Points" : "نقاط القوة والمزايا"}</span>
          </h4>
          <ul className="space-y-4">
            {data.sellingPoints.map((point, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="font-display text-xl text-[#0F0F0F]">0{idx + 1}</span>
                <p className="font-body font-bold text-sm text-zinc-800 border-l-[3px] border-[#0F0F0F] pl-3 leading-snug">
                  {point}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Quadrant 2: Owns */}
        <div
          className="relative border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]"
          style={{ backgroundColor: data.themeColor, color: data.themeText }}
        >
          <VectorNodes />

          <h4 className="font-display text-2xl uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2 flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span>{lang === "en" ? "Owns & Deliverables" : "المسؤوليات والملكيات"}</span>
          </h4>
          <ul className="space-y-3 font-bold text-sm">
            {data.owns.map((item, idx) => (
              <li key={idx} className="border-b border-[#0F0F0F]/30 pb-2">
                &gt; {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Quadrant 3: Metrics */}
        <div className="relative bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
          <VectorNodes />

          <h4 className="font-display text-2xl uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2 flex items-center gap-3">
            <Target className="w-6 h-6 text-[#7B2CBF]" />
            <span>{lang === "en" ? "Quantitative Metrics" : "المقاييس الرقمية"}</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.metrics.map((metric, idx) => (
              <div key={idx} className="bg-white border-2 border-[#0F0F0F] p-3 flex flex-col justify-between">
                <span className="font-display text-3xl font-black text-[#7B2CBF]">
                  {metric.value}
                </span>
                <span className="font-body text-[11px] font-bold uppercase tracking-wider text-zinc-600 mt-1 border-t border-[#0F0F0F]/20 pt-1">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 4: Anti-Goals */}
        <div
          className="relative border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]"
          style={{ backgroundColor: data.antiGoalColor || "#FF0055", color: "#FFFFFF" }}
        >
          <VectorNodes />

          <h4 className="font-display text-2xl uppercase mb-6 border-b-[3px] border-white pb-2 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span>{lang === "en" ? "Anti-Goals & Red Lines" : "المحظورات والخطوط الحمراء"}</span>
          </h4>
          <ul className="space-y-3 font-bold text-sm">
            {data.antiGoals.map((antiGoal, idx) => (
              <li key={idx} className="flex items-start gap-2 border-b border-white/20 pb-2">
                <span className="text-[#FFD500] font-black">✕</span>
                <span>{antiGoal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
