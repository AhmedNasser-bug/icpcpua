export function HeroSection() {
  return (
    <section className="w-full bg-[#FFF4E0] border-b-[3px] border-[#0F0F0F] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg height="100%" width="100%">
          <pattern id="dots-join" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="#0F0F0F" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots-join)" />
        </svg>
      </div>
      <div className="max-w-[1440px] mx-auto px-10 py-24 relative z-10">
        <div className="inline-block bg-[#7B2CBF] text-white px-4 py-1 font-body font-bold uppercase tracking-widest text-sm border-[2px] border-[#0F0F0F] mb-6">
          Applications Open — 2026 Season
        </div>
        <h1
          className="font-display text-4xl md:text-6xl lg:text-8xl leading-[0.9] uppercase text-[#0F0F0F] mb-8 [text-shadow:4px_4px_0_#00E5FF]"
        >
          ENGINEER<br />YOUR <span className="text-[#7B2CBF]">LOGIC.</span><br />COMPETE<br />WITH THE BEST.
        </h1>
        <p className="font-body text-xl font-bold max-w-xl bg-white p-6 border-[3px] border-[#0F0F0F] shadow-solid relative">
          <span className="vector-node vector-node-tl" />
          <span className="vector-node vector-node-br" />
          PUA&apos;s premier competitive programming community. We train beginners into masters and qualify teams for the ACPC and ECPC.
        </p>
      </div>
    </section>
  )
}
