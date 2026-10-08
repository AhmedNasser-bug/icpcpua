"use client"

import Image from "next/image"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { PuaLogo } from "@/components/pua-logo"
import {
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  Trophy,
  Zap,
  CheckCircle2,
  Flame,
  ArrowRight,
  QrCode as QrIcon,
} from "lucide-react"

export default function FlyerPage() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      {/* Navbar hidden when printing */}
      <div className="print:hidden">
        <PuaNavbar />
      </div>

      {/* Control Bar (hidden during printing) */}
      <div className="print:hidden bg-[#0F0F0F] text-white border-b-4 border-[#0F0F0F] py-2.5 sm:py-3.5 px-3 sm:px-4 sticky top-[60px] sm:top-[68px] z-40 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase text-[#FFD500]">
            <Sparkles className="w-4 h-4 text-[#FFD500] shrink-0" />
            <span className="truncate">BOOTH FLYER &amp; SCANNER</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[44px] bg-[#FFD500] hover:bg-[#e6c000] text-[#0F0F0F] font-mono font-bold text-xs uppercase px-3 py-2 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT (A4)</span>
            </button>

            <a
              href="/qr_campus_challenge_10pts.png"
              download="icpcpua_qr_10pts.png"
              className="min-h-[44px] bg-[#00E5FF] hover:bg-[#00cae0] text-[#0F0F0F] font-mono font-bold text-xs uppercase px-3 py-2 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>QR PNG</span>
            </a>

            <Link
              href="/claim?code=CAMPUS_BOOTH_DAY1&points=10"
              target="_blank"
              className="min-h-[44px] bg-white hover:bg-neutral-100 text-[#0F0F0F] font-mono font-bold text-xs uppercase px-3 py-2 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>TEST CLAIM</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Flyer Display Area */}
      <main className="flex-grow flex items-center justify-center p-3 sm:p-6 lg:p-10 print:p-0">
        {/* Printable Poster Canvas */}
        <div
          id="printable-flyer"
          className="w-full max-w-[794px] bg-[#FFF4E0] border-4 sm:border-8 border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] sm:shadow-[12px_12px_0px_#0F0F0F] print:shadow-none print:border-4 print:max-w-none print:w-full print:m-0 relative overflow-hidden"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
          {/* Decorative Corner Vector Nodes */}
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />

          {/* Top Header Marquee Bar */}
          <div className="bg-[#7B2CBF] text-white border-b-4 border-[#0F0F0F] px-3 sm:px-4 py-2 flex items-center justify-between font-mono text-[11px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FFD500] rounded-full animate-pulse shrink-0" />
              <span className="truncate">PHAROS UNIVERSITY IN ALEXANDRIA</span>
            </div>
            <span className="hidden sm:inline bg-[#FF0055] text-white px-2 py-0.5 border border-[#0F0F0F] shrink-0">
              SEASON 2026 OFFICIAL
            </span>
          </div>

          <div className="p-4 sm:p-8 lg:p-10 space-y-5 sm:space-y-6">
            {/* Logo and Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-[#0F0F0F] pb-4 sm:pb-5">
              <div className="flex items-center gap-3">
                <PuaLogo size={46} className="shadow-[4px_4px_0px_#0F0F0F] shrink-0" />
                <div>
                  <h1 className="text-2xl sm:text-4xl font-display uppercase tracking-wider text-[#0F0F0F] leading-none">
                    ICPC PUA
                  </h1>
                  <p className="font-mono text-[10px] sm:text-sm font-bold text-[#7B2CBF] tracking-wider uppercase mt-1">
                    ALGORITHMIC TRAINING COMMUNITY
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="inline-block bg-[#FFD500] border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] px-2.5 py-0.5 text-xs font-bold uppercase text-[#0F0F0F]">
                  LIMITED CAMPUS BONUS
                </span>
                <p className="text-[10px] sm:text-[11px] font-bold text-neutral-600 mt-0.5">BOOTH CHALLENGE // DAY 1</p>
              </div>
            </div>

            {/* Explosive Hero Catchphrase */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#FF0055] text-white border-3 border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] print:shadow-none px-3.5 sm:px-4 py-1 font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                <Flame className="w-4 h-4 fill-white" />
                <span>BOOST YOUR SQUAD STANDING</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display uppercase text-[#0F0F0F] leading-[0.95] tracking-tight">
                CRACK THE CODE.
                <br />
                <span className="text-[#7B2CBF] underline decoration-4 decoration-[#FFD500]">
                  EARN +10 POINTS!
                </span>
              </h2>

              <p className="font-mono text-xs sm:text-sm text-neutral-800 max-w-lg mx-auto font-medium">
                Scan the code below with your smartphone camera to claim your instant onboarding points on the live campus leaderboard.
              </p>
            </div>

            {/* Central High-Contrast QR Code Arena */}
            <div className="max-w-sm mx-auto bg-white border-4 border-[#0F0F0F] p-6 shadow-[8px_8px_0px_#0F0F0F] text-center relative">
              {/* Corner Targets */}
              <div className="absolute top-2 left-2 text-[#0F0F0F] font-mono text-xs font-bold">[ + ]</div>
              <div className="absolute top-2 right-2 text-[#0F0F0F] font-mono text-xs font-bold">[ + ]</div>
              <div className="absolute bottom-2 left-2 text-[#0F0F0F] font-mono text-xs font-bold">[ + ]</div>
              <div className="absolute bottom-2 right-2 text-[#0F0F0F] font-mono text-xs font-bold">[ + ]</div>

              {/* QR Image */}
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto border-3 border-[#0F0F0F] bg-white p-2">
                <Image
                  src="/qr_campus_challenge_10pts.png"
                  alt="ICPC PUA +10 Points Challenge QR Code"
                  fill
                  sizes="(max-width: 640px) 208px, 240px"
                  className="object-contain p-1"
                  priority
                />
              </div>

              <div className="mt-4 bg-[#FFD500] border-2 border-[#0F0F0F] py-2 px-3 shadow-[2px_2px_0px_#0F0F0F]">
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-black uppercase text-[#0F0F0F]">
                  <Zap className="w-4 h-4 fill-[#0F0F0F]" />
                  <span>POINT VALUE: +10 XP</span>
                </div>
                <div className="font-mono text-[10px] text-[#0F0F0F]/80 uppercase mt-0.5">
                  URL: icpcpua.org/claim
                </div>
              </div>
            </div>

            {/* 3 Simple Execution Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white border-3 border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                <div className="w-7 h-7 bg-[#00E5FF] border-2 border-[#0F0F0F] font-display text-sm font-bold flex items-center justify-center mb-2">
                  1
                </div>
                <h3 className="font-mono font-bold text-xs uppercase text-[#0F0F0F]">SCAN CODE</h3>
                <p className="font-mono text-[11px] text-neutral-600 mt-1">
                  Aim phone camera at the QR code above to open the claim portal.
                </p>
              </div>

              <div className="bg-white border-3 border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                <div className="w-7 h-7 bg-[#FFD500] border-2 border-[#0F0F0F] font-display text-sm font-bold flex items-center justify-center mb-2">
                  2
                </div>
                <h3 className="font-mono font-bold text-xs uppercase text-[#0F0F0F]">ENTER UNI ID</h3>
                <p className="font-mono text-[11px] text-neutral-600 mt-1">
                  Type your registered student ID to link points to your profile.
                </p>
              </div>

              <div className="bg-white border-3 border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                <div className="w-7 h-7 bg-[#FF0055] text-white border-2 border-[#0F0F0F] font-display text-sm font-bold flex items-center justify-center mb-2">
                  3
                </div>
                <h3 className="font-mono font-bold text-xs uppercase text-[#0F0F0F]">CLIMB RANKS</h3>
                <p className="font-mono text-[11px] text-neutral-600 mt-1">
                  Instantly receive +10 PTS and unlock your leaderboard standing!
                </p>
              </div>
            </div>

            {/* Why Join ICPC PUA Feature Strip */}
            <div className="bg-[#0F0F0F] text-white p-4 border-3 border-[#0F0F0F] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
                <span className="font-bold">100% Free Training</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFD500]" />
                <span className="font-bold">Level 1 (Beginners) &amp; Level 2 (Advanced)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF0055]" />
                <span className="font-bold">Path to ECPC &amp; Tech Careers</span>
              </div>
            </div>

            {/* Poster Footer */}
            <div className="border-t-3 border-dashed border-[#0F0F0F] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs font-bold text-[#0F0F0F]">
              <div className="flex items-center gap-2">
                <span>🌐 WEBSITE: icpcpua.org</span>
                <span>•</span>
                <span>💬 TELEGRAM: @icpcpua</span>
              </div>
              <div className="bg-white border-2 border-[#0F0F0F] px-2 py-0.5 text-[11px]">
                FACULTY OF COMPUTER SCIENCE &amp; ARTIFICIAL INTELLIGENCE
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer hidden when printing */}
      <div className="print:hidden">
        <Footer />
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .skip-link {
            display: none !important;
          }
          #printable-flyer {
            border: 4px solid #0f0f0f !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
