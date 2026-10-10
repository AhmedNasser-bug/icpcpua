export function MilestonesSection() {
  return (
    <section className="w-full border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        <div className="flex flex-wrap items-center justify-center gap-16 md:gap-32 mb-20">
          {[
            { val: "1", label: "ACPC Qualified" },
            { val: "3", label: "ECPC Qualified" },
            { val: "500+", label: "Problems Solved" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-7xl text-[#0F0F0F]">{stat.val}</div>
              <div className="font-body font-bold text-[#7B2CBF] uppercase tracking-widest text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-solid p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-40 h-40" fill="#0F0F0F" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 className="font-display text-3xl text-white mb-4 uppercase">OUR CURRICULUM ANCHORS</h3>
          <p className="font-body text-xl font-bold text-white max-w-2xl">
            We leverage the world-class training resources from{" "}
            <span className="bg-[#0F0F0F] px-2">GUC</span> and{" "}
            <span className="bg-[#0F0F0F] px-2">Assiut University</span>, refined for the PUA ecosystem.
          </p>
        </div>
      </div>
    </section>
  )
}
