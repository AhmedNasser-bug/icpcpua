export function ValuePropsSection() {
  return (
    <section className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-16">
          <h2 className="font-display text-5xl text-white uppercase italic tracking-tighter">Why Join Us?</h2>
          <span className="font-body font-bold text-[#9D4EDD] border-b-[3px] border-[#9D4EDD] text-sm pb-1">01 // PERKS</span>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Crack Technical Interviews",
              desc: "Master the algorithms that unlock doors at FAANG and top-tier tech firms. Our curriculum is built for high-stakes assessments.",
              borderClass: "border-[#7B2CBF]",
              bgClass: "bg-zinc-900",
              icon: (
                <svg className="w-12 h-12 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              ),
            },
            {
              title: "Premium Mentorship",
              desc: "Get 1-on-1 coaching from seasoned problem solvers. Weekly code reviews and strategic debugging sessions.",
              borderClass: "border-white",
              bgClass: "bg-zinc-900",
              icon: (
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              ),
            },
            {
              title: "Real Stakes & Rewards",
              desc: "Compete in offline contests, win prizes, and earn prestigious recommendations from department heads.",
              borderClass: "border-[#0F0F0F]",
              bgClass: "bg-[#7B2CBF]",
              icon: (
                <svg className="w-12 h-12 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              ),
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`p-8 border-[3px] relative overflow-hidden hover:-translate-y-2 transition-transform duration-200 vector-node ${card.borderClass} ${card.bgClass}`}
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="font-display text-2xl text-white mb-3">{card.title}</h3>
              <p className="font-body text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
