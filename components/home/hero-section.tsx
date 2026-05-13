import Image from "next/image"

interface HeroSectionProps {
  onOpenModal: () => void
}

export function HeroSection({ onOpenModal }: HeroSectionProps) {
  return (
    <section className="w-full max-w-[1440px] px-10 py-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative">
      {/* Left */}
      <div className="w-full lg:w-1/2 flex flex-col gap-8 relative">
        <div className="absolute -top-8 -left-8 opacity-20 pointer-events-none">
          <svg height="160" viewBox="0 0 100 100" width="160">
            <pattern height="10" id="dots-hero" patternUnits="userSpaceOnUse" width="10">
              <circle cx="2" cy="2" fill="#0F0F0F" r="2" />
            </pattern>
            <rect fill="url(#dots-hero)" height="100" width="100" />
          </svg>
        </div>
        <h1 className="font-display text-[72px] lg:text-[84px] leading-[0.9] text-[#0F0F0F] text-shadow-cyan uppercase">
          ICPC PUA
        </h1>
        <p className="font-body text-xl font-bold uppercase mt-4 text-[#7B2CBF]">icpc training Pharos University branch</p>
        <p className="font-body text-lg font-bold max-w-lg bg-white p-6 border-[3px] border-[#0F0F0F] shadow-solid-sm relative">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-br" />
          Join the fiercest algorithmic competitive programming community at Pharos University. Eat, sleep, code, repeat.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenModal}
            className="btn-solid flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid h-20 w-full max-w-[320px] bg-[#7B2CBF] text-white text-2xl font-display uppercase tracking-widest relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-3">
              JOIN THE SQUAD
              <svg className="w-7 h-7 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-[#FF0055] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
          </button>
        </div>
      </div>

      {/* Right: hero art */}
      <div className="w-full lg:w-1/2 flex justify-center relative hero-art-container">
        <div className="relative w-full max-w-[560px] aspect-square bg-[#00E5FF] border-[3px] border-[#0F0F0F] shadow-solid">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-tr" />
          <span className="vector-node vector-node-bl" />
          <span className="vector-node vector-node-br" />
          <div className="absolute inset-0 p-6 flex items-center justify-center">
            <div className="w-full h-full bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm relative flex items-center justify-center overflow-hidden">
              <Image
                alt="Abstract vector illustration of a laptop with algorithms exploding from the screen"
                className="w-full h-full object-cover contrast-125 saturate-150"
                src="/cracked-laptop.jpg"
                fill
                style={{ mixBlendMode: "luminosity", opacity: 0.85 }}
              />
              <div className="absolute top-8 left-8 w-14 h-14 border-[3px] border-[#0F0F0F] bg-[#FFD500]" style={{ animation: "bounce 3s infinite" }} />
              <div className="absolute bottom-16 right-8 w-20 h-20 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] rounded-full" style={{ animation: "pulse 2s infinite" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-display text-[#FF0055] pointer-events-none select-none" style={{ mixBlendMode: "multiply", opacity: 0.7 }}>
                {'</>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
