import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full bg-[#0F0F0F] border-t-[6px] border-[#FF0055] py-12 px-6 md:px-10 mt-auto z-10 shrink-0">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-10 w-full">
        {/* ── FEEDBACK PERSUASION BUCKET BANNER ── */}
        <div className="relative bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#00E5FF] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />

          <div className="flex flex-col gap-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="bg-[#7B2CBF] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-wider border-2 border-[#0F0F0F]">
                // OPEN_SIGNAL
              </span>
              <span className="font-body text-xs font-bold text-[#0F0F0F] uppercase tracking-widest">
                COMMUNITY DIRECTIVE
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-[#0F0F0F] uppercase tracking-tight">
              SPOTTED A BUG? GOT SYSTEM OPTIMIZATIONS?
            </h3>
            <p className="font-body text-xs md:text-sm text-[#0F0F0F] max-w-2xl font-bold">
              We build in public and iterate relentlessly. Your brain bytes fuel the next release—drop critique, bug alerts, or feature requests into the bucket.
            </p>
          </div>

          <Link
            href="/feedback"
            className="btn-solid inline-flex items-center justify-center gap-3 bg-[#7B2CBF] text-white font-display text-lg md:text-xl uppercase tracking-wider px-8 py-4 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] hover:bg-[#FF0055] hover:text-white transition-all shrink-0 active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <span>DUMP YOUR FEEDBACK</span>
            <span className="text-2xl">🪣</span>
          </Link>
        </div>

        {/* ── FOOTER SITEMAP COLUMNS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4 border-b border-zinc-800 text-white font-body">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link href="/" className="font-display text-3xl md:text-4xl text-white italic hover:text-[#00E5FF] transition-colors inline-block">
              PUA ICPC
            </Link>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">
              Pharos University Official Competitive Programming Community. Training algorithmists, qualifying for ECPC, and dominating tech rounds.
            </p>
            <div className="inline-block bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-[11px] font-mono text-[#00E5FF]">
              STATUS: 2026-2027 ACTIVE_SEASON
            </div>
          </div>

          {/* Navigation Col */}
          <div className="space-y-2">
            <span className="font-display text-sm text-[#FFD500] uppercase tracking-wider block mb-2">
              CORE DIRECTORY
            </span>
            <ul className="space-y-1.5 text-xs font-bold text-zinc-300">
              <li>
                <Link href="/" className="hover:text-[#00E5FF] transition-colors">Home Base</Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#00E5FF] transition-colors">Events & Training Schedule</Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-[#00E5FF] transition-colors">Live Leaderboard</Link>
              </li>
              <li>
                <Link href="/hall-of-fame" className="hover:text-[#00E5FF] transition-colors">Hall of Fame (Legends)</Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#00E5FF] transition-colors">Training Armory & Resources</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#00E5FF] transition-colors">Knowledge Base & FAQ</Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-[#00E5FF] transition-colors">Cadet Testimonials</Link>
              </li>
            </ul>
          </div>

          {/* Initiatives Col */}
          <div className="space-y-2">
            <span className="font-display text-sm text-[#00E5FF] uppercase tracking-wider block mb-2">
              OPPORTUNITIES & CORPS
            </span>
            <ul className="space-y-1.5 text-xs font-bold text-zinc-300">
              <li>
                <Link href="/recruitment" className="hover:text-[#FFD500] transition-colors">
                  Work With Us (Recruitment)
                </Link>
              </li>
              <li>
                <Link href="/specs/instructor" className="hover:text-[#FFD500] transition-colors">
                  Instructor Blueprint
                </Link>
              </li>
              <li>
                <Link href="/specs/technical" className="hover:text-[#FFD500] transition-colors">
                  Technical Lead Blueprint
                </Link>
              </li>
              <li>
                <Link href="/specs/ops-pr" className="hover:text-[#FFD500] transition-colors">
                  Ops & PR Blueprint
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="hover:text-[#FFD500] transition-colors flex items-center gap-1.5">
                  <span>Referral Bounties</span>
                  <span className="text-[10px] bg-[#FF0055] text-white px-1 py-0.2 border border-[#0F0F0F]">BOUNTY</span>
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#FFD500] transition-colors">
                  Cadet Registration (+10 PTS)
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Outbound Col */}
          <div className="space-y-2">
            <span className="font-display text-sm text-[#FF0055] uppercase tracking-wider block mb-2">
              COMMUNITY PLATFORMS
            </span>
            <ul className="space-y-1.5 text-xs font-bold text-zinc-300">
              <li>
                <a href="https://codeforces.com" target="_blank" rel="noreferrer" className="hover:text-[#00E5FF] transition-colors">
                  Codeforces Group & Gyms
                </a>
              </li>
              <li>
                <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-[#00E5FF] transition-colors">
                  Discord Headquarters
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#00E5FF] transition-colors">
                  Open Source GitHub
                </a>
              </li>
              <li>
                <a href="https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn" target="_blank" rel="noreferrer" className="hover:text-[#00E5FF] transition-colors">
                  Official WhatsApp Dispatch
                </a>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-[#FFD500] transition-colors flex items-center gap-1.5">
                  <span>Feedback Bucket</span>
                  <span className="text-[10px] bg-[#7B2CBF] text-white px-1 py-0.2 border border-[#00E5FF]">ACTIVE</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── FOOTER BOTTOM ROW ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full text-zinc-500 font-body text-xs font-bold">
          <p className="uppercase tracking-wider text-center md:text-left">
            &copy; 2026 PUA ICPC COMMUNITY. NO SOFT CODE ALLOWED. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="text-[#00E5FF]">// PHAROS UNIVERSITY IN ALEXANDRIA</span>
            <a href="#" className="hover:text-white transition-colors underline decoration-2">
              BACK TO TOP ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
