import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { VectorNodes } from "@/components/vector-nodes"
import { RoleData, rolesData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

const COMMITTEE_NAV_OVERRIDES: Record<string, { title: string; ar: string; color: string }> = {
  instructor: { title: "Instructor", ar: "التدريب", color: "#FFD500" },
  technical: { title: "Technical", ar: "الفنية", color: "#00E5FF" },
  "ops-pr": { title: "Ops & PR", ar: "اللوجستيات", color: "#FF9100" },
  hr: { title: "HR & People", ar: "الموارد البشرية", color: "#7B2CBF" },
  marketing: { title: "Marketing", ar: "التسويق", color: "#00E5FF" },
  "design-dev": { title: "Design & Dev", ar: "التصميم والويب", color: "#FF0055" },
}

export function SpecBlueprintSection({ data, lang }: { data: RoleData; lang: SpecLanguage }) {
  return (
    <section id="blueprint" className="mb-20">
      <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[10px_10px_0px_#0F0F0F] relative">
        <VectorNodes />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b-2 border-[#0F0F0F]">
          <div>
            <span
              className="px-2.5 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F] inline-block mb-3"
              style={{ backgroundColor: data.themeColor, color: data.themeText }}
            >
              INFORMATIONAL SPECIFICATION // ARCHITECTURAL BLUEPRINT
            </span>
            <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] leading-tight">
              {lang === "en" ? "OFFICIAL ROLE STANDARDS & COMPLIANCE" : "المعايير التشغيلية الرسمية للجنة"}
            </h3>
            <p className="font-body text-xs md:text-sm text-zinc-700 mt-2 font-bold max-w-2xl leading-relaxed">
              {lang === "en"
                ? "This specification serves as the formal operational reference manual for ICPC Pharos University. It establishes clear accountability, deliverables, anti-goals, and pedagogical metrics for the entire 2026-2027 season."
                : "تعتبر هذه الوثيقة الدليل المرجعي والتشغيلي الرسمي المعتمد لمجتمع ICPC بجامعة فاروس لموسم 2026-2027، وتحدد معايير الأداء والمسؤوليات غير القابلة للتفاوض."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruitment"
              className="btn-solid inline-flex items-center gap-2 bg-[#0F0F0F] text-white font-display text-base uppercase px-6 py-3 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#7B2CBF] hover:bg-[#7B2CBF] hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <span>{lang === "en" ? "EXPLORE ALL COMMITTEES" : "استعراض كافة اللجان"}</span>
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Link>
            <a
              href="#"
              className="btn-solid inline-flex items-center gap-2 bg-white text-[#0F0F0F] font-display text-base uppercase px-6 py-3 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FFD500] hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <span>{lang === "en" ? "TOP OF SPEC" : "أعلى الصفحة"}</span>
            </a>
          </div>
        </div>

        {/* Other Committees Quick Navigator */}
        <div className="mt-8">
          <span className="font-body text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-4">
            {lang === "en" ? "JUMP TO OTHER COMMITTEE SPECIFICATIONS:" : "الانتقال إلى مواصفات اللجان الأخرى:"}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(rolesData).map((roleId) => {
              const c = { id: roleId, ...COMMITTEE_NAV_OVERRIDES[roleId] }
              return (
                <Link
                  key={c.id}
                  href={`/specs/${c.id}`}
                  className={`p-3 border-2 border-[#0F0F0F] font-body text-xs font-bold uppercase flex flex-col justify-between shadow-[3px_3px_0px_#0F0F0F] transition-transform hover:-translate-y-0.5 ${
                    c.id === data.roleId.toLowerCase() || data.roleTitle.toLowerCase().includes(c.id)
                      ? "ring-2 ring-[#7B2CBF] bg-[#FFF4E0]"
                      : "bg-white hover:bg-[#FFF4E0]"
                  }`}
                >
                  <span className="w-2.5 h-2.5 border border-[#0F0F0F] mb-2 block" style={{ backgroundColor: c.color }} />
                  <span className="font-display text-sm">{c.title}</span>
                  <span className="text-zinc-600 text-[11px]">{c.ar}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
