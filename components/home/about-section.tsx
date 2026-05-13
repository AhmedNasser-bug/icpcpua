export function AboutSection() {
  return (
    <section className="w-full max-w-[1440px] px-10 py-24" id="about">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: big text */}
        <div className="relative">
          <span className="vector-node vector-node-tl" />
          <h2 className="font-display text-[56px] leading-none text-[#0F0F0F] uppercase mb-6">
            WHO ARE<br />
            <span className="text-[#7B2CBF] text-shadow-cyan">WE?</span>
          </h2>
          <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid p-8 relative">
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <p className="font-body text-sm leading-relaxed text-[#0F0F0F]">
              PUA ICPC is the official competitive programming community of <strong>Pharos University in Alexandria</strong>. We train the next generation of algorithmic problem-solvers who represent Egypt on the world stage at ACPC and ICPC regional contests.
            </p>
            <p className="font-body text-sm leading-relaxed text-[#0F0F0F] mt-4">
              We run weekly bootcamps, mock contests, and collaborative problem-solving sessions. Whether you&apos;re a beginner or a seasoned coder, there&apos;s a place for you here.
            </p>
          </div>
        </div>

        {/* Right: feature pills */}
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Weekly Bootcamps", icon: "📅", bg: "#7B2CBF", fg: "white" },
            { label: "Mock Contests", icon: "🏆", bg: "#00E5FF", fg: "#0F0F0F" },
            { label: "Mentorship", icon: "🎓", bg: "#FFD500", fg: "#0F0F0F" },
            { label: "ICPC Prep", icon: "🚀", bg: "#FF0055", fg: "white" },
          ].map((f) => (
            <div
              key={f.label}
              className="border-[3px] border-[#0F0F0F] shadow-solid p-6 relative hover:-translate-y-2 transition-transform duration-200"
              style={{ backgroundColor: f.bg }}
            >
              <span className="vector-node vector-node-br" />
              <div className="text-4xl mb-3">{f.icon}</div>
              <p className="font-display text-xl uppercase" style={{ color: f.fg }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
