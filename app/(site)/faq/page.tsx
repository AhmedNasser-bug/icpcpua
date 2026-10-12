"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CORE_FAQ_ITEMS,
  OFFICIAL_COMMUNITY_LINKS,
} from "@/data/faq";
import { FaqCard, type FaqLanguageMode } from "@/components/faq/faq-card";
import { ContestLogisticsSection } from "@/components/faq/contest-logistics-section";
import { FaqSupportBanner } from "@/components/faq/faq-support-banner";

export default function FAQPage() {
  const [language, setLanguage] = useState<FaqLanguageMode>("both");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>(["eligibility", "beginners"]);

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
    <div className="bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F]">

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
            {"// SYSTEM FAQ // COMMUNITY GUIDELINES"}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
            <div className="max-w-3xl">
              <h1
                className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.88] tracking-tighter mb-6 text-[#0F0F0F]"
              >
                FREQUENTLY <br />
                <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">
                  ASKED QUESTIONS.
                </span>
              </h1>
              <p
                dir="rtl"
                className="font-cairo text-lg md:text-2xl font-bold text-gray-900 border-r-[4px] border-[#0F0F0F] pr-4 leading-relaxed mb-3"
              >
                جمعنالكم إجابات شاملة ومباشرة لكل الأسئلة اللي بتدور في بالكم بخصوص المجتمع، التدريب، والاستفادة العملية.
              </p>
              <p
                className="font-grotesk text-sm md:text-base font-bold text-gray-600 border-l-[3px] border-[#0F0F0F] pl-3"
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
        <ContestLogisticsSection />

        {/* ── STILL HAVE QUESTIONS BANNER ─── */}
        <FaqSupportBanner />
      </main>
    </div>
  );
}
