"use client"

import { useState } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { Marquee } from "@/components/pua-marquee"
import { RoleData } from "@/data/recruitment/roles"
import {
  Terminal,
  Shield,
  Star,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Globe,
  Award,
  Sparkles,
  Zap,
  Target,
  FileCheck
} from "lucide-react"

export function PuaSpecSheet({ data }: { data: RoleData }) {
  const [lang, setLang] = useState<"en" | "ar">("en")
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx)
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] ${
        lang === "ar" ? "dir-rtl text-right font-sans" : "dir-ltr text-left font-sans"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <PuaNavbar />

      {/* ── TOP SPEC SUB-BAR ── */}
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
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
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

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10 md:py-16 relative overflow-x-hidden">
        {/* Background Dot Matrix */}
        <div className="absolute inset-0 bg-[radial-gradient(#0F0F0F_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* ── HERO SECTION ── */}
        <section className="mb-16 relative">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span
                className="inline-block px-3 py-1 border-[3px] border-[#0F0F0F] font-body text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_#0F0F0F]"
                style={{ backgroundColor: data.themeColor, color: data.themeText }}
              >
                OPERATIONAL_PROTOCOL_{data.levelBadge}
              </span>
              <span className="bg-[#0F0F0F] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F]">
                ICPC PUA 2026 // OFFICIAL SPEC
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-display uppercase tracking-tight leading-[0.9] drop-shadow-[5px_5px_0px_#0F0F0F] mb-4"
              style={{ color: data.themeColor }}
            >
              {data.roleTitle}
            </h1>

            <h2 className="font-display text-2xl md:text-3xl text-[#0F0F0F] mb-4">
              {data.arabicTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[8px_8px_0px_#0F0F0F] relative">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

              <div className="md:col-span-8">
                <span className="bg-[#FFD500] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F] inline-block mb-3">
                  CORE DIRECTIVE
                </span>
                <p className="font-body text-base md:text-lg font-bold leading-relaxed text-[#0F0F0F]">
                  &quot;{data.description}&quot;
                </p>
              </div>

              <div className="md:col-span-4 flex flex-col font-body text-xs border-t-2 md:border-t-0 md:border-l-2 md:border-r-0 border-[#0F0F0F] pt-4 md:pt-0 md:px-4 space-y-1 font-bold text-zinc-700">
                <span className="text-[#0F0F0F]">VERSION: {data.version}</span>
                <span>ISSUED: {data.issued}</span>
                <span>LOCATION: {data.location}</span>
                <span className="text-[#7B2CBF] pt-2">DOC_TYPE: INFORMATIONAL_BLUEPRINT</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. PROBLEMS SOLVED & STRATEGIC IMPACT (المشكلات المعالجة والأثر الاستراتيجي) ── */}
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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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

        {/* ── 2. THE ONE-PAGE SPEC CONTRACT (4 QUADRANTS) ── */}
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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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
              style={{ backgroundColor: data.antiGoalColor, color: "#FFFFFF" }}
            >
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

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

        {/* ── 3. COMMITTEE HANDBOOK SECTION (دليل اللجنة) ── */}
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

        {/* ── 4. COMMITTEE FAQ (الأسئلة الشائعة للجنة) ── */}
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

        {/* ── 5. INFORMATIONAL SPECIFICATION // ROLE BLUEPRINT ── */}
        <section id="blueprint" className="mb-20">
          <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[10px_10px_0px_#0F0F0F] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

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
                {[
                  { id: "instructor", title: "Instructor", ar: "التدريب", color: "#FFD500" },
                  { id: "technical", title: "Technical", ar: "الفنية", color: "#00E5FF" },
                  { id: "ops-pr", title: "Ops & PR", ar: "اللوجستيات", color: "#FF9100" },
                  { id: "hr", title: "HR & People", ar: "الموارد البشرية", color: "#7B2CBF" },
                  { id: "marketing", title: "Marketing", ar: "التسويق", color: "#00E5FF" },
                  { id: "design-dev", title: "Design & Dev", ar: "التصميم والويب", color: "#FF0055" }
                ].map((c) => (
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
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Marquee />
      <Footer />
    </div>
  )
}
