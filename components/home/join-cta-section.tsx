import Link from "next/link"

interface JoinCtaSectionProps {
  onOpenModal: () => void
}

export function JoinCtaSection({ onOpenModal }: JoinCtaSectionProps) {
  return (
    <section className="w-full bg-[#7B2CBF] border-y-[3px] border-[#0F0F0F]" id="join">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-12 sm:py-24 relative">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* Decorative BG text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          <span className="font-display text-[120px] sm:text-[200px] text-white/5 uppercase leading-none">ICPC</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center gap-6 sm:gap-8">
          <span className="font-body font-bold text-xs uppercase tracking-widest bg-[#FFD500] text-[#0F0F0F] border-[2px] border-[#0F0F0F] px-4 py-1 shadow-neo">
            Season 2026 — Registration Open
          </span>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-[80px] leading-none text-white uppercase text-shadow-cyan">
            READY TO<br />CRACK THE<br />CODE?
          </h2>
          <p className="font-body text-sm sm:text-lg text-white/80 max-w-lg border-[3px] border-white/30 p-4 sm:px-6 sm:py-4">
            Don&apos;t just watch others make it to regionals. Join the squad, grind the sheets, and make your mark in the PUA ICPC Hall of Fame.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-xl mx-auto">
            <button
              onClick={onOpenModal}
              className="w-full sm:w-auto btn-solid min-h-[56px] py-3.5 px-6 sm:px-8 bg-[#FFD500] text-[#0F0F0F] text-lg sm:text-xl font-display uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid relative overflow-hidden group cursor-pointer flex items-center justify-center"
            >
              <span className="relative z-10">JOIN TRAINING SQUAD</span>
              <div className="absolute inset-0 bg-[#00E5FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
            </button>
            <Link
              href="/events"
              className="w-full sm:w-auto btn-solid min-h-[56px] py-3.5 px-6 sm:px-8 bg-transparent text-white text-lg sm:text-xl font-display uppercase tracking-wider border-[3px] border-white shadow-[6px_6px_0px_white] hover:bg-white hover:text-[#7B2CBF] transition-colors flex items-center justify-center text-center"
            >
              VIEW EVENTS &amp; SESSIONS
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
