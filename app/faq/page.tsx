"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PuaNavbar } from "@/components/pua-navbar";
import { Marquee } from "@/components/pua-marquee";
import { Footer } from "@/components/footer";
import {
  CORE_FAQ_ITEMS,
  CONTEST_LOGISTICS_FAQ,
  OFFICIAL_COMMUNITY_LINKS,
  FaqItemData,
} from "@/data/faq";

type LanguageMode = "both" | "ar" | "en";

function FaqCard({
  item,
  lang,
  isOpen,
  onToggle,
}: {
  item: FaqItemData;
  lang: LanguageMode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const showAr = lang === "ar" || lang === "both";
  const showEn = lang === "en" || lang === "both";

  return (
    <div
      className={`border-[3px] border-[#0F0F0F] transition-all duration-200 shadow-[6px_6px_0px_#0F0F0F] hover:shadow-[8px_8px_0px_#0F0F0F] ${
        isOpen ? "bg-white" : "bg-white hover:bg-[#FFFDF8]"
      }`}
    >
      {/* Accordion Trigger */}
      <button
        onClick={onToggle}
        className="w-full text-left p-6 md:p-7 flex items-start justify-between gap-4 cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex-1 space-y-2">
          {/* Badge & Number */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="bg-[#0F0F0F] text-[#FFF4E0] px-2 py-0.5 font-black">
              Q{item.number.toString().padStart(2, "0")}
            </span>
            <span
              className="px-2 py-0.5 border border-[#0F0F0F] font-bold uppercase text-[11px]"
              style={{ backgroundColor: item.badgeColor || "#00E5FF", color: "#0F0F0F" }}
            >
              {lang === "ar" ? item.badge.ar : item.badge.en}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-1 pt-1">
            {showAr && (
              <h3
                dir="rtl"
                className="text-xl md:text-2xl font-black text-[#0F0F0F] tracking-tight leading-snug"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                {item.question.ar}
              </h3>
            )}
            {showEn && (
              <h3
                className={`text-lg md:text-xl font-black uppercase text-[#0F0F0F] tracking-tight leading-snug ${
                  showAr ? "text-gray-700 text-base md:text-lg font-mono pt-1" : ""
                }`}
                style={{ fontFamily: showAr ? "Space Grotesk, sans-serif" : "Fredoka One, sans-serif" }}
              >
                {item.question.en}
              </h3>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <div
          className={`w-9 h-9 border-2 border-[#0F0F0F] flex items-center justify-center shrink-0 transition-transform duration-200 shadow-[2px_2px_0px_#0F0F0F] ${
            isOpen ? "rotate-180 bg-[#FFD500]" : "bg-[#00E5FF]"
          }`}
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t-[3px] border-[#0F0F0F] p-6 md:p-8 bg-[#FFF4E0]/40 space-y-6">
          {/* Arabic Answer */}
          {showAr && (
            <div dir="rtl" className="text-right space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7B2CBF] uppercase tracking-wider">
                <span className="w-2 h-2 bg-[#7B2CBF] inline-block" />
                <span>الإجابة الرسمية باللغة العربية</span>
              </div>
              <p className="text-base md:text-lg font-bold text-[#0F0F0F] leading-relaxed">
                {item.answer.ar.intro}
              </p>

              {item.answer.ar.points && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {item.answer.ar.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-[#0F0F0F] bg-white p-3.5 shadow-[3px_3px_0px_#0F0F0F]"
                    >
                      <span className="block font-black text-[#FF0055] text-sm mb-1">
                        ▫️ {pt.label}:
                      </span>
                      <p className="text-sm font-semibold text-gray-800 leading-normal">{pt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider between languages if both are displayed */}
          {showAr && showEn && (
            <div className="border-t-2 border-dashed border-[#0F0F0F]/30 my-4" />
          )}

          {/* English Answer */}
          {showEn && (
            <div className="text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF0055] uppercase tracking-wider">
                <span className="w-2 h-2 bg-[#FF0055] inline-block" />
                <span>Official English Response</span>
              </div>
              <p className="text-base md:text-lg font-bold text-[#0F0F0F] leading-relaxed" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {item.answer.en.intro}
              </p>

              {item.answer.en.points && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {item.answer.en.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-[#0F0F0F] bg-white p-3.5 shadow-[3px_3px_0px_#0F0F0F]"
                    >
                      <span className="block font-black text-[#7B2CBF] text-xs font-mono uppercase tracking-wide mb-1">
                        ▫️ {pt.label}:
                      </span>
                      <p className="text-sm font-bold text-gray-800 leading-normal" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        {pt.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Links if any (e.g., Q9) */}
          {item.links && (
            <div className="pt-4 border-t-2 border-[#0F0F0F]/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.links.map((link, idx) => {
                const isExternal = link.url.startsWith("http");
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="p-3 border-2 border-[#0F0F0F] bg-white font-mono text-xs font-black uppercase flex items-center justify-between gap-2 shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FFD500] hover:-translate-y-0.5 transition-all"
                  >
                    <span>{lang === "ar" ? link.label.ar : link.label.en}</span>
                    <span className="text-sm font-bold">↗</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>(["eligibility", "beginners"]);
  const [showLogistics, setShowLogistics] = useState(false);

  // Toggle individual question accordion
  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Expand / Collapse all
  const expandAll = () => setOpenIds(CORE_FAQ_ITEMS.map((item) => item.id));
  const collapseAll = () => setOpenIds([]);

  // Search filter
  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return CORE_FAQ_ITEMS;
    const q = searchQuery.toLowerCase().trim();
    return CORE_FAQ_ITEMS.filter((item) => {
      const matchAr =
        item.question.ar.toLowerCase().includes(q) ||
        item.answer.ar.intro.toLowerCase().includes(q) ||
        item.answer.ar.points?.some((p) => p.text.toLowerCase().includes(q) || p.label.toLowerCase().includes(q));
      const matchEn =
        item.question.en.toLowerCase().includes(q) ||
        item.answer.en.intro.toLowerCase().includes(q) ||
        item.answer.en.points?.some((p) => p.text.toLowerCase().includes(q) || p.label.toLowerCase().includes(q));
      return matchAr || matchEn;
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] flex flex-col justify-between">
      {/* Unified Site Navbar */}
      <PuaNavbar />

      {/* Quick Context Sub-Bar */}
      <div className="w-full bg-white border-b-[3px] border-[#0F0F0F] px-6 py-2.5 shadow-[4px_4px_0px_#0F0F0F]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF0055] inline-block animate-pulse" />
            <span className="text-[#0F0F0F]">KNOWLEDGE_BASE // FAQ & RULES 2026</span>
          </div>
          <div className="hidden sm:flex gap-6 items-center">
            <Link href="/join" className="hover:text-[#7B2CBF]">HOW TO JOIN</Link>
            <Link href="/recruitment" className="hover:text-[#7B2CBF]">RECRUITMENT</Link>
            <Link href="/referrals" className="hover:text-[#7B2CBF]">BOUNTIES</Link>
          </div>
          <a
            href={OFFICIAL_COMMUNITY_LINKS.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="bg-[#25D366] text-black px-3 py-1 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500] font-black"
          >
            WHATSAPP HUB ↗
          </a>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 relative">
        {/* ── HERO BANNER ─── */}
        <section className="mb-14">
          <div className="inline-block bg-[#0F0F0F] text-[#FFF4E0] px-3 py-1 font-mono text-xs uppercase mb-6 tracking-widest border border-[#0F0F0F]">
            // SYSTEM FAQ // COMMUNITY GUIDELINES
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
            <div className="max-w-3xl">
              <h1
                className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.88] tracking-tighter mb-6 text-[#0F0F0F]"
                style={{ fontFamily: "Fredoka One, sans-serif" }}
              >
                FREQUENTLY <br />
                <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">
                  ASKED QUESTIONS.
                </span>
              </h1>
              <p
                dir="rtl"
                className="text-lg md:text-2xl font-bold text-gray-900 border-r-[4px] border-[#0F0F0F] pr-4 leading-relaxed mb-3"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                جمعنالكم إجابات شاملة ومباشرة لكل الأسئلة اللي بتدور في بالكم بخصوص المجتمع، التدريب، والاستفادة العملية.
              </p>
              <p
                className="text-sm md:text-base font-bold text-gray-600 border-l-[3px] border-[#0F0F0F] pl-3"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Comprehensive and direct answers regarding eligibility, zero-prerequisite onboarding, GUC curriculum, career ROI, and official competition logistics.
              </p>
            </div>

            {/* Quick Stats Panel */}
            <div className="border-[3px] border-[#0F0F0F] bg-white p-5 shadow-[6px_6px_0px_#0F0F0F] font-mono text-xs space-y-3 min-w-[280px]">
              <div className="flex justify-between border-b-2 border-[#0F0F0F] pb-2">
                <span>INTAKE COST</span>
                <span className="font-black text-[#25D366]">100% FREE</span>
              </div>
              <div className="flex justify-between border-b-2 border-[#0F0F0F] pb-2">
                <span>CURRICULUM</span>
                <span className="font-bold">GUC TIER 1 &amp; 2</span>
              </div>
              <div className="flex justify-between">
                <span>TEAM PREREQ</span>
                <span className="font-bold text-[#FF0055]">INDIVIDUAL FIRST</span>
              </div>
            </div>
          </div>

          {/* Quick Channels Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <a
              href={OFFICIAL_COMMUNITY_LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="p-4 border-[3px] border-[#0F0F0F] bg-[#25D366]/15 hover:bg-[#25D366]/30 transition-all shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-gray-600 block">OFFICIAL ANNOUNCEMENTS</span>
                <span className="font-black uppercase text-base text-[#0F0F0F]">WhatsApp Group</span>
              </div>
              <span className="text-xl font-black">↗</span>
            </a>

            <a
              href={OFFICIAL_COMMUNITY_LINKS.discord}
              target="_blank"
              rel="noreferrer"
              className="p-4 border-[3px] border-[#0F0F0F] bg-[#5865F2]/15 hover:bg-[#5865F2]/30 transition-all shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-gray-600 block">VOICE &amp; UPSOLVING</span>
                <span className="font-black uppercase text-base text-[#0F0F0F]">Discord Server</span>
              </div>
              <span className="text-xl font-black">↗</span>
            </a>

            <Link
              href="/recruitment"
              className="p-4 border-[3px] border-[#0F0F0F] bg-[#FFD500]/20 hover:bg-[#FFD500]/40 transition-all shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-gray-600 block">JOIN CORE TEAM</span>
                <span className="font-black uppercase text-base text-[#0F0F0F]">Recruitment Hub</span>
              </div>
              <span className="text-xl font-black">→</span>
            </Link>

            <Link
              href="/referrals"
              className="p-4 border-[3px] border-[#0F0F0F] bg-[#FF0055]/15 hover:bg-[#FF0055]/30 transition-all shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-gray-600 block">INVITE PEERS</span>
                <span className="font-black uppercase text-base text-[#0F0F0F]">Referral Bounties</span>
              </div>
              <span className="text-xl font-black">→</span>
            </Link>
          </div>
        </section>

        {/* ── TOOLBAR: LANGUAGE FILTER & SEARCH ─── */}
        <section className="mb-8 border-[3px] border-[#0F0F0F] bg-white p-4 md:p-6 shadow-[8px_8px_0px_#0F0F0F] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase text-gray-600 hidden sm:inline-block mr-1">
              LANGUAGE:
            </span>
            <button
              onClick={() => setLanguage("both")}
              className={`px-3 py-2 border-2 border-[#0F0F0F] font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] transition-all ${
                language === "both" ? "bg-[#0F0F0F] text-[#FFF4E0]" : "bg-white hover:bg-gray-100"
              }`}
            >
              🌐 BOTH / كلاهما
            </button>
            <button
              onClick={() => setLanguage("ar")}
              className={`px-3 py-2 border-2 border-[#0F0F0F] font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] transition-all ${
                language === "ar" ? "bg-[#7B2CBF] text-white" : "bg-white hover:bg-gray-100"
              }`}
            >
              🇪🇬 بالعربي
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-2 border-2 border-[#0F0F0F] font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] transition-all ${
                language === "en" ? "bg-[#00E5FF] text-black" : "bg-white hover:bg-gray-100"
              }`}
            >
              🇬🇧 ENGLISH
            </button>
          </div>

          {/* Search Bar & Accordion Quick Controls */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. beginner, free, GUC, لغات البرمجة)..."
                className="w-full bg-[#FFF4E0]/40 border-2 border-[#0F0F0F] px-4 py-2 font-mono text-xs text-[#0F0F0F] placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00E5FF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={expandAll}
                title="Expand all questions"
                className="px-2.5 py-2 border-2 border-[#0F0F0F] bg-white text-[11px] font-mono font-bold hover:bg-[#FFD500] shadow-[2px_2px_0px_#0F0F0F]"
              >
                EXPAND
              </button>
              <button
                onClick={collapseAll}
                title="Collapse all questions"
                className="px-2.5 py-2 border-2 border-[#0F0F0F] bg-white text-[11px] font-mono font-bold hover:bg-gray-100 shadow-[2px_2px_0px_#0F0F0F]"
              >
                COLLAPSE
              </button>
            </div>
          </div>
        </section>

        {/* ── FAQ LIST ─── */}
        <section className="space-y-4 mb-16">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item) => (
              <FaqCard
                key={item.id}
                item={item}
                lang={language}
                isOpen={openIds.includes(item.id)}
                onToggle={() => toggleItem(item.id)}
              />
            ))
          ) : (
            <div className="border-[3px] border-[#0F0F0F] bg-white p-12 text-center shadow-[6px_6px_0px_#0F0F0F]">
              <p className="font-mono text-sm uppercase font-bold text-gray-500 mb-2">
                NO MATCHING QUESTIONS FOUND FOR: &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-[#FF0055] text-white border-2 border-[#0F0F0F] font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#0F0F0F]"
              >
                RESET SEARCH
              </button>
            </div>
          )}
        </section>

        {/* ── CONTEST LOGISTICS & OFFICIAL ECPC RULES (COLLAPSIBLE) ─── */}
        <section className="mb-16 border-[3px] border-[#0F0F0F] bg-[#0F0F0F] text-white p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-white/20 pb-4 mb-6">
            <div>
              <span className="text-xs font-mono font-black uppercase text-[#00E5FF] tracking-widest block mb-1">
                // ADVANCED COMPETITIVE RULES
              </span>
              <h2
                className="text-2xl md:text-3xl font-black uppercase tracking-tight"
                style={{ fontFamily: "Fredoka One, sans-serif" }}
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

        {/* ── STILL HAVE QUESTIONS BANNER ─── */}
        <section className="border-[3px] border-[#0F0F0F] bg-white p-8 md:p-12 shadow-[10px_10px_0px_#0F0F0F] relative overflow-hidden">
          <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]" />
          <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]" />
          <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]" />
          <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]" />

          <div className="max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-block bg-[#FFD500] text-[#0F0F0F] px-3 py-1 font-mono text-xs font-black uppercase border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
              💬 24/7 COMMUNITY SUPPORT // إحنا معاك خطوة بخطوة
            </span>

            <div className="space-y-3">
              <h2
                dir="rtl"
                className="text-2xl md:text-3xl font-black text-[#0F0F0F] leading-snug"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                لسه عندك أي سؤال تاني في بالك؟ متترددش تبعتلنا على جروب الواتساب أو ديسكورد وإحنا معاك خطوة بخطوة!
              </h2>

              <p
                className="text-base md:text-lg font-bold text-gray-600"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Still have questions? Feel free to reach out anytime on our WhatsApp group or Discord server—we&apos;re here to help you every step of the way!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href={OFFICIAL_COMMUNITY_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-[#25D366] text-black border-[3px] border-[#0F0F0F] font-black uppercase text-sm shadow-[4px_4px_0px_#0F0F0F] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F0F0F] transition-all flex items-center gap-2"
              >
                <span>JOIN WHATSAPP GROUP</span>
                <span className="text-base">↗</span>
              </a>

              <a
                href={OFFICIAL_COMMUNITY_LINKS.discord}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-[#5865F2] text-white border-[3px] border-[#0F0F0F] font-black uppercase text-sm shadow-[4px_4px_0px_#0F0F0F] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F0F0F] transition-all flex items-center gap-2"
              >
                <span>JOIN DISCORD SERVER</span>
                <span className="text-base">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Unified Marquee & Footer */}
      <Marquee />
      <Footer />
    </div>
  );
}
