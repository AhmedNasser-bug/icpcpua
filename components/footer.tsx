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
            className="btn-solid inline-flex items-center justify-center gap-3 bg-[#7B2CBF] text-white font-display text-lg md:text-xl uppercase tracking-wider px-8 py-4 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] hover:bg-[#FF0055] hover:text-white transition-all shrink-0 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <span>DUMP YOUR FEEDBACK</span>
            <span className="text-2xl">🪣</span>
          </Link>
        </div>

        {/* ── FOOTER BOTTOM ROW ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 w-full border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="font-display text-4xl text-white italic hover:text-[#00E5FF] transition-colors">
              PUA ICPC
            </Link>
            <p className="font-body text-xs text-zinc-400 uppercase tracking-widest text-center md:text-left">
              &copy; 2026 PUA ICPC COMMUNITY. NO LOGIC, NO GLORY.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 items-center">
            <Link
              href="/feedback"
              className="font-body font-bold text-[#00E5FF] hover:text-[#FFD500] hover:underline decoration-4 transition-colors text-sm uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Feedback Bucket</span>
              <span className="text-xs bg-[#7B2CBF] text-white px-1.5 py-0.5 border border-[#00E5FF]">NEW</span>
            </Link>

            <Link
              href="/referrals"
              className="font-body font-bold text-[#FFD500] hover:text-[#00E5FF] hover:underline decoration-4 transition-colors text-sm uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Referral Rewards</span>
              <span className="text-xs bg-[#FF0055] text-white px-1.5 py-0.5 border border-[#0F0F0F]">BOUNTY</span>
            </Link>

            {[
              { label: "Discord", href: "https://discord.gg" },
              { label: "GitHub", href: "https://github.com" },
              { label: "Codeforces", href: "https://codeforces.com" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-body font-bold text-zinc-400 hover:text-[#FF0055] hover:underline decoration-4 transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
