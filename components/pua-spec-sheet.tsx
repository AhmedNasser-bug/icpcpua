"use client"

import { useState } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { Marquee } from "@/components/pua-marquee"
import { RoleData } from "@/data/recruitment/roles"
import { SpecSheetHeader } from "@/components/spec-sheet/spec-sheet-header"
import { SpecHeroSection } from "@/components/spec-sheet/spec-hero-section"
import { SpecMissionSection } from "@/components/spec-sheet/spec-mission-section"
import { SpecContractSection } from "@/components/spec-sheet/spec-contract-section"
import { SpecHandbookSection } from "@/components/spec-sheet/spec-handbook-section"
import { SpecFaqSection } from "@/components/spec-sheet/spec-faq-section"
import { SpecBlueprintSection } from "@/components/spec-sheet/spec-blueprint-section"
import type { SpecLanguage } from "@/components/spec-sheet/types"

export function PuaSpecSheet({ data, roleKey }: { data: RoleData; roleKey: string }) {
  const [lang, setLang] = useState<SpecLanguage>("en")

  return (
    <div
      id="top"
      className={`min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] ${
        lang === "ar" ? "dir-rtl text-right font-sans" : "dir-ltr text-left font-sans"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <PuaNavbar />

      <SpecSheetHeader
        data={data}
        lang={lang}
        onToggleLang={() => setLang(lang === "en" ? "ar" : "en")}
      />

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10 md:py-16 relative overflow-x-hidden">
        {/* Background Dot Matrix */}
        <div className="absolute inset-0 bg-[radial-gradient(#0F0F0F_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <SpecHeroSection data={data} />
        <SpecMissionSection data={data} lang={lang} />
        <SpecContractSection data={data} lang={lang} />
        <SpecHandbookSection data={data} lang={lang} />
        <SpecFaqSection data={data} lang={lang} />
        <SpecBlueprintSection data={data} lang={lang} roleKey={roleKey} />
      </main>

      <Marquee />
      <Footer />
    </div>
  )
}
