export function CommitmentSection() {
  return (
    <section className="w-full bg-zinc-50 border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="font-display text-6xl leading-tight mb-8 text-[#0F0F0F] uppercase">
              QUALITY OVER<br /><span className="text-[#7B2CBF]">QUANTITY.</span>
            </h2>
            <div className="flex flex-col gap-6">
              {[
                { num: "01", colorClass: "bg-[#0F0F0F]", title: "Professional Environment", desc: "We operate like a high-performance sports team. Punctuality and discipline are non-negotiable." },
                { num: "02", colorClass: "bg-[#7B2CBF]", title: "Strict Code of Conduct", desc: "Collaboration is key, but integrity is paramount. Plagiarism results in immediate expulsion." },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <div className={`text-white p-3 font-display text-xl shrink-0 border-[2px] border-[#0F0F0F] ${item.colorClass}`}>
                    {item.num}
                  </div>
                  <div>
                    <h4 className="font-display text-xl mb-1 uppercase">{item.title}</h4>
                    <p className="font-body font-bold text-sm text-zinc-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border-[3px] border-[#0F0F0F] p-8 shadow-solid relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg height="100%" width="100%"><pattern id="dots-commit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#000" /></pattern><rect width="100%" height="100%" fill="url(#dots-commit)" /></svg>
            </div>
            <div className="relative z-10">
              <h3 className="font-display text-3xl mb-6 text-[#0F0F0F] uppercase">THE COMMITMENT</h3>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Weekly Sessions", value: "4-6 HOURS" },
                  { label: "Independent Upsolving", value: "10+ HOURS" },
                  { label: "Mock Contests", value: "EVERY FRIDAY" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between border-b-[2px] border-[#0F0F0F] pb-3">
                    <span className="font-body font-bold text-sm">{row.label}</span>
                    <span className="font-display text-[#7B2CBF]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-yellow-100 border-[2px] border-yellow-600 font-body italic font-bold text-sm">
                &quot;If you aren&apos;t ready to sweat over a Segment Tree for 3 hours, this isn&apos;t for you.&quot;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
