"use client"

import { useState } from "react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Marquee } from "@/components/pua-marquee"
import { RoleData, universalRules } from "@/data/recruitment/roles"
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
  Send,
  UserCheck,
  Flame,
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
  const [rulesOpen, setRulesOpen] = useState(true)

  // Registration Form State
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    academicYear: "Year 2",
    subRole: data.handbook.subRoles[0] || "",
    handleOrPortfolio: "",
    motivation: "",
    agreedToRules: false,
  })
  const [registered, setRegistered] = useState(false)
  const [formError, setFormError] = useState("")

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agreedToRules) {
      setFormError(
        lang === "en"
          ? "You must accept the Universal Rules & Division of Labor to register."
          : "يجب الموافقة على القواعد العامة وتقسيم العمل الصارم لإتمام التسجيل."
      )
      return
    }
    setFormError("")
    setRegistered(true)
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] ${
        lang === "ar" ? "dir-rtl text-right font-sans" : "dir-ltr text-left font-sans"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ── TOP STICKY BAR ── */}
      <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-[#FFF4E0] border-b-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F]">
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
          <a href="#rules" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "UNIVERSAL RULES" : "القواعد العامة"}
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
          <a href="#register" className="hover:text-[#7B2CBF] hover:underline decoration-2 transition-colors">
            {lang === "en" ? "REGISTER" : "التسجيل"}
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
                <span className="text-[#7B2CBF] pt-2">STATUS: RECRUITMENT_OPEN</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. UNIVERSAL RULES SECTION (📖 القواعد العامة لمجتمع ICPC PUA) ── */}
        <section id="rules" className="mb-20">
          <div className="bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#FFD500] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD500] text-[#0F0F0F] border-2 border-white flex items-center justify-center font-display text-xl">
                  📖
                </div>
                <div>
                  <h3 className="font-display text-2xl md:text-3xl uppercase text-white tracking-tight">
                    {lang === "en" ? "UNIVERSAL ICPC PUA RULES" : "القواعد العامة لمجتمع ICPC PUA"}
                  </h3>
                  <p className="font-body text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    {lang === "en"
                      ? "MANDATORY FOR ALL COMMITTEES // ZERO COMPROMISE"
                      : "تنطبق بشكل غير قابل للتفاوض على جميع الأعضاء واللجان"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRulesOpen(!rulesOpen)}
                className="btn-solid inline-flex items-center gap-2 bg-white text-[#0F0F0F] font-body text-xs font-bold px-3 py-1.5 border-2 border-white uppercase hover:bg-[#FFD500] cursor-pointer"
              >
                <span>{rulesOpen ? (lang === "en" ? "COLLAPSE" : "إخفاء") : (lang === "en" ? "EXPAND" : "عرض")}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${rulesOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {rulesOpen && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {universalRules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="bg-zinc-900 border-2 border-zinc-700 p-4 flex flex-col justify-between hover:border-[#FFD500] transition-colors"
                  >
                    <div>
                      <span className="font-display text-sm text-[#FFD500] block mb-1">
                        0{idx + 1} // RULE
                      </span>
                      <h4 className="font-display text-base uppercase text-white mb-2 leading-tight">
                        {lang === "en" ? rule.titleEn : rule.titleAr}
                      </h4>
                      <p className="font-body text-xs text-zinc-300 leading-relaxed font-bold">
                        {lang === "en" ? rule.ruleEn : rule.ruleAr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 2. THE ONE-PAGE SPEC CONTRACT (4 QUADRANTS) ── */}
        <section id="contract" className="mb-20">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
            <div>
              <span className="bg-[#7B2CBF] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
                SECTION 01
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
                SECTION 02
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

              {/* Preferable */}
              <div className="bg-white border-[3px] border-[#25D366] p-6 shadow-[6px_6px_0px_#25D366]">
                <h5 className="font-display text-xl uppercase mb-4 text-[#0F0F0F] flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#25D366] inline-block" />
                  <span>{lang === "en" ? "WHAT IS PREFERABLE" : "ما يفضل فعله والالتزام به"}</span>
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

        {/* ── 4. COMMITTEE FAQ ACCORDION (الأسئلة الشائعة) ── */}
        <section id="faq" className="mb-20">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-[#0F0F0F] pb-3">
            <div>
              <span className="bg-[#00E5FF] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
                SECTION 03
              </span>
              <h3 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] mt-1">
                {lang === "en" ? "COMMITTEE FAQ" : "الأسئلة الشائعة للجنة"}
              </h3>
            </div>
            <p className="font-body text-xs font-bold text-zinc-600 uppercase">
              REAL-WORLD PROTOCOL SCENARIOS
            </p>
          </div>

          <div className="space-y-4">
            {data.handbook.faq.map((item, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div
                  key={idx}
                  className={`border-[3px] border-[#0F0F0F] transition-colors ${
                    isOpen ? "bg-white shadow-[6px_6px_0px_#0F0F0F]" : "bg-[#FFF4E0] shadow-[3px_3px_0px_#0F0F0F]"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4 cursor-pointer"
                  >
                    <span className="font-display text-base md:text-lg uppercase text-[#0F0F0F]">
                      Q: {lang === "en" ? item.q.en : item.q.ar}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#7B2CBF]" : "text-[#0F0F0F]"
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

        {/* ── 5. REGISTRATION PORTAL (نموذج التسجيل والانضمام للجنة) ── */}
        <section id="register" className="mb-20">
          <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-12 shadow-[10px_10px_0px_#0F0F0F] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            <div className="max-w-2xl mb-8">
              <span
                className="px-2.5 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F] inline-block mb-3"
                style={{ backgroundColor: data.themeColor, color: data.themeText }}
              >
                JOIN THE CORPS // CADET INTAKE
              </span>
              <h3 className="font-display text-4xl md:text-5xl uppercase text-[#0F0F0F] leading-tight">
                {lang === "en" ? "COMMITTEE REGISTRATION" : "استمارة التسجيل والانضمام"}
              </h3>
              <p className="font-body text-xs md:text-sm text-zinc-600 mt-2 font-bold">
                {lang === "en"
                  ? "Submit your dossier to join this committee. All recruits undergo zero-ego vetting and must commit to the division of labor."
                  : "قدم بياناتك للانضمام إلى هذه اللجنة. يخضع جميع المتقدمين لفحص العقلية الخالية من الغرور وتقسيم العمل الصارم."}
              </p>
            </div>

            {registered ? (
              <div className="bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-8 text-center space-y-4 shadow-[6px_6px_0px_#25D366] animate-slide-in">
                <div className="w-16 h-16 bg-[#25D366] text-white border-[3px] border-[#0F0F0F] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-display text-3xl uppercase text-[#0F0F0F]">
                  {lang === "en" ? "DOSSIER TRANSMITTED!" : "تم تسجيل ملفك بنجاح!"}
                </h4>
                <p className="font-body text-xs md:text-sm text-zinc-700 max-w-lg mx-auto font-bold">
                  {lang === "en"
                    ? `Candidate ${form.name} registered for [${form.subRole}]. Your dedicated HR officer will review your dossier and invite you for an interview within 48 hours.`
                    : `تم تسجيل المترشح ${form.name} للمسار [${form.subRole}]. سيقوم مسؤول الموارد البشرية بفحص ملفك والتواصل معك عبر واتساب خلال 48 ساعة.`}
                </p>
                <div className="bg-white border-2 border-[#0F0F0F] p-3 inline-block font-body text-xs font-bold">
                  DOSSIER_ID: PUA-2026-{Math.floor(1000 + Math.random() * 9000)} // STATUS: PENDING_VETTING
                </div>
                <div>
                  <button
                    onClick={() => setRegistered(false)}
                    className="btn-solid bg-[#0F0F0F] text-white font-display text-sm uppercase px-6 py-2.5 border-2 border-[#0F0F0F] hover:bg-[#7B2CBF]"
                  >
                    {lang === "en" ? "SUBMIT ANOTHER APPLICATION" : "تسجيل طلب آخر"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                {formError && (
                  <div className="bg-[#FF0055] text-white p-3 font-body text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
                    [ALERT] {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "Full Name *" : "الاسم الكامل *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed Mostafa"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF]"
                    />
                  </div>

                  {/* Student ID */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "Student ID *" : "الرقم الجامعي *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 202300481"
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF]"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "Email Address *" : "البريد الإلكتروني *"}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ahmed@pua.edu.eg"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF]"
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "WhatsApp Phone Number *" : "رقم الواتساب *"}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +20 10 1234 5678"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF]"
                    />
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "Academic Year *" : "السنة الدراسية *"}
                    </label>
                    <select
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF] cursor-pointer"
                    >
                      <option>Year 1 (Preparatory / Freshmen)</option>
                      <option>Year 2 (Sophomore)</option>
                      <option>Year 3 (Junior)</option>
                      <option>Year 4 (Senior)</option>
                    </select>
                  </div>

                  {/* Sub-Role Selector */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      {lang === "en" ? "Target Sub-Role in Committee *" : "المسار المحدد داخل اللجنة *"}
                    </label>
                    <select
                      value={form.subRole}
                      onChange={(e) => setForm({ ...form, subRole: e.target.value })}
                      className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF] cursor-pointer"
                    >
                      {data.handbook.subRoles.map((role, i) => (
                        <option key={i} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Handle / Portfolio */}
                <div className="space-y-2">
                  <label className="font-body text-xs font-bold uppercase tracking-wider block">
                    {lang === "en"
                      ? "Codeforces / GitHub / Behance / LinkedIn URL"
                      : "رابط الحساب على كودفورسيز / جيت هاب / بيهانس / لينكد إن"}
                  </label>
                  <input
                    type="text"
                    placeholder="https://codeforces.com/profile/... or https://github.com/..."
                    value={form.handleOrPortfolio}
                    onChange={(e) => setForm({ ...form, handleOrPortfolio: e.target.value })}
                    className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF]"
                  />
                </div>

                {/* Motivation */}
                <div className="space-y-2">
                  <label className="font-body text-xs font-bold uppercase tracking-wider block">
                    {lang === "en"
                      ? "Why this committee? What value will you engineer? *"
                      : "لماذا اخترت هذه اللجنة؟ وما القيمة التي ستضيفها؟ *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      lang === "en"
                        ? "Detail your technical or operational readiness. Mention any previous CP or team experience."
                        : "وضح خبرتك السابقة واستعدادك الفني والالتزام بساعات العمل الأسبوعية..."
                    }
                    value={form.motivation}
                    onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body text-sm font-bold focus:bg-white focus:outline-none focus:border-[#7B2CBF] resize-none"
                  />
                </div>

                {/* Honor Code & Agreement */}
                <div className="bg-[#FFF4E0] border-2 border-[#0F0F0F] p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="honor-check"
                    checked={form.agreedToRules}
                    onChange={(e) => setForm({ ...form, agreedToRules: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded-none border-2 border-[#0F0F0F] accent-[#7B2CBF] cursor-pointer"
                  />
                  <label htmlFor="honor-check" className="font-body text-xs font-bold text-[#0F0F0F] cursor-pointer leading-relaxed">
                    {lang === "en" ? (
                      <>
                        <strong>HONOR CODE PLEDGE:</strong> I have read and agree to the{" "}
                        <span className="text-[#7B2CBF]">Universal ICPC PUA Rules</span> (Zero Ego, Meeting Golden Rule,
                        48h Delay Notices, Conflict Protocol, and Strict Division of Labor).
                      </>
                    ) : (
                      <>
                        <strong>ميثاق الشرف والالتزام:</strong> قرأت ووافقت على{" "}
                        <span className="text-[#7B2CBF]">القواعد العامة لمجتمع ICPC PUA</span> (العقلية الخالية من الغرور،
                        قاعدة الاجتماعات، إشعارات التأخير، بروتوكول النزاعات، وتقسيم العمل الصارم دون مساومة).
                      </>
                    )}
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-solid w-full border-[3px] border-[#0F0F0F] py-5 px-6 font-display text-2xl uppercase tracking-wider shadow-[8px_8px_0px_#0F0F0F] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
                  style={{ backgroundColor: data.themeColor, color: data.themeText }}
                >
                  <Send className="w-6 h-6" />
                  <span>{lang === "en" ? "TRANSMIT CADET APPLICATION" : "إرسال ملف الترشح للجنة"}</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Marquee />
      <Footer />
    </div>
  )
}
