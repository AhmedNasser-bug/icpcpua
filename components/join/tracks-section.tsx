/* ─── Track Card ─── */
function TrackCard({
  level, title, subtitle, items, bgClass, textClass, accentClass,
}: {
  level: string; title: string; subtitle: string; items: string[];
  bgClass: string; textClass: string; accentClass: string;
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch border-[3px] border-[#0F0F0F] shadow-solid">
      <div
        className={`md:w-1/3 p-8 flex flex-col justify-between border-b-[3px] md:border-b-0 md:border-r-[3px] border-dashed border-[#0F0F0F] ${bgClass}`}
      >
        <div>
          <span className={`font-display text-2xl ${accentClass}`}>{level}</span>
          <h3 className={`font-display text-4xl mt-2 uppercase ${textClass}`}>{title}</h3>
        </div>
        <p className={`font-body text-sm mt-4 italic ${textClass} opacity-80`}>{subtitle}</p>
      </div>
      <div className="md:w-2/3 p-8 flex flex-col justify-center gap-4 bg-[#FFF4E0]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 font-body text-sm font-bold">
              <span className="w-3 h-3 bg-[#7B2CBF] border border-[#0F0F0F] shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TracksSection() {
  return (
    <section className="w-full bg-white border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        <h2 className="font-display text-6xl text-center text-[#0F0F0F] uppercase tracking-tighter mb-20">THE TRACKS</h2>
        <div className="flex flex-col gap-12">
          <TrackCard
            level="LEVEL 01"
            title="FUNDAMENTALS"
            subtitle="Perfect for beginners and first-year enthusiasts."
            bgClass="bg-[#FFF4E0]"
            textClass="text-[#0F0F0F]"
            accentClass="text-[#7B2CBF]"
            items={[
              "Basic Math & Logic",
              "STL Collections",
              "Assiut Problem Sheets",
              "Weekly Mock Contests",
            ]}
          />
          <TrackCard
            level="LEVEL 02"
            title="ADVANCED"
            subtitle="ECPC/ACPC oriented training for veteran coders."
            bgClass="bg-[#7B2CBF]"
            textClass="text-white"
            accentClass="text-[#FFD500]"
            items={[
              "Graph Algorithms & Flow",
              "Advanced DP Optimization",
              "GUC Specialized Curriculum",
              "Team Strategy & Comms",
            ]}
          />
          {/* OC card */}
          <div className="bg-[#0F0F0F] text-white p-12 border-[3px] border-[#7B2CBF] shadow-solid text-center">
            <h3 className="font-display text-4xl mb-4 uppercase tracking-widest">Organizing Committee</h3>
            <p className="font-body font-bold max-w-2xl mx-auto mb-8 text-zinc-400">
              Join the engine room. We are recruiting for{" "}
              <span className="text-white underline decoration-[#7B2CBF] decoration-4">Dev</span>,{" "}
              <span className="text-white underline decoration-[#7B2CBF] decoration-4">Design</span>, and{" "}
              <span className="text-white underline decoration-[#7B2CBF] decoration-4">Ops</span>{" "}
              teams. Gain company-level experience managing large-scale events.
            </p>
            <a href="#apply" className="inline-block bg-white text-[#0F0F0F] px-8 py-3 font-display text-lg uppercase border-[3px] border-white hover:bg-[#7B2CBF] hover:text-white transition-colors">
              Apply for OC
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
