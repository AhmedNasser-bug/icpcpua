import Link from "next/link"
import { Globe } from "lucide-react"
import { RoleData } from "@/data/recruitment/roles"
import type { SpecLanguage } from "./types"

export function SpecSheetHeader({
  data,
  lang,
  onToggleLang,
}: {
  data: RoleData
  lang: SpecLanguage
  onToggleLang: () => void
}) {
  return (
    <div className="w-full bg-[#FFF4E0] border-b-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] sticky top-[60px] lg:top-[65px] z-40">
      <header className="flex justify-between items-center w-full px-4 sm:px-6 py-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 border-2 border-[#0F0F0F] inline-block"
            style={{ backgroundColor: data.themeColor }}
          />
          <h1 className="uppercase font-display tracking-tight text-xl md:text-2xl text-[#0F0F0F]">
            {data.roleId}
          </h1>
          <span
            className="hidden sm:inline-block px-2 py-0.5 font-body text-xs font-bold uppercase border border-[#0F0F0F]"
            style={{ backgroundColor: data.themeColor, color: data.themeText }}
          >
            {data.levelBadge}
          </span>
        </div>

        {/* Quick Anchors */}
        <div className="hidden md:flex gap-6 items-center font-body text-xs font-bold uppercase tracking-wider">
          <a href="#mission" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "MISSION & IMPACT" : "المهمة والأثر"}
          </a>
          <a href="#contract" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "SPEC CONTRACT" : "العقد والمواصفات"}
          </a>
          <a href="#handbook" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "HANDBOOK" : "دليل اللجنة"}
          </a>
          <a href="#faq" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "FAQ" : "الأسئلة الشائعة"}
          </a>
          <a href="#blueprint" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "BLUEPRINT" : "المخطط"}
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="btn-solid inline-flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-[#0F0F0F] bg-white font-body text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500] cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "عربي" : "ENGLISH"}</span>
          </button>

          <Link
            href="/recruitment"
            className="hidden sm:inline-block px-3 py-1.5 border-[2px] border-[#0F0F0F] bg-[#0F0F0F] text-white font-body text-xs font-bold uppercase hover:bg-[#7B2CBF] transition-colors"
          >
            {lang === "en" ? "ALL COMMITTEES" : "كافة اللجان"}
          </Link>
        </div>
      </header>
    </div>
  )
}
