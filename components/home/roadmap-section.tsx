const roadmapChapters = [
  {
    num: "01",
    color: "#7B2CBF",
    textColor: "white",
    title: "Programming",
    highlight: "Fundamentals",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "The bedrock of every competitive programmer. Master the syntax, the math, and the basic logic.",
    icon: (
      <svg className="w-10 h-10 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    items: ["C++ / Java Essentials", "Complexity Analysis — O(N log N)", "I/O Optimizations", "Combinations & Permutations"],
  },
  {
    num: "02",
    color: "#00E5FF",
    textColor: "#0F0F0F",
    title: "Data Structures",
    highlight: "& STL",
    highlightBg: "#00E5FF",
    highlightText: "#0F0F0F",
    desc: "Efficiency starts with organization. Use the right tools to store and access data lightning fast.",
    icon: (
      <svg className="w-10 h-10 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
    ),
    items: ["Vectors, Deques, Sets, Maps", "Priority Queues & Stack", "Segment Trees & BITs", "Disjoint Set Union (DSU)"],
  },
  {
    num: "03",
    color: "#FF0055",
    textColor: "white",
    title: "Bit",
    highlight: "Manipulation",
    highlightBg: "#FF0055",
    highlightText: "white",
    desc: "Master the lowest level of computation. Bitmasks allow for elegant solutions and huge optimizations.",
    icon: (
      <svg className="w-10 h-10 text-[#FF0055]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
    ),
    items: ["Bitwise AND / OR / XOR", "Bitmask DP", "Prefix XOR & Range Queries", "Power of 2 tricks"],
  },
  {
    num: "04",
    color: "#0F0F0F",
    textColor: "white",
    title: "Graph",
    highlight: "Theory",
    highlightBg: "#7B2CBF",
    highlightText: "white",
    desc: "Nodes, edges, and paths. The language of relationships and networks.",
    icon: (
      <svg className="w-10 h-10 text-[#7B2CBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    ),
    items: ["DFS, BFS, Floodfill", "Dijkstra & Bellman-Ford", "LCA & Tree DP", "Max Flow / Min Cut"],
  },
  {
    num: "05",
    color: "#FFD500",
    textColor: "#0F0F0F",
    title: "The DP",
    highlight: "Engine",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "Dynamic Programming: Trading memory for time. Breaking big problems into solvable sub-problems.",
    icon: (
      <svg className="w-10 h-10 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
    ),
    items: ["Knapsack & LIS & LCS", "Bitmask DP", "Digit DP", "Convex Hull Trick"],
  },
  {
    num: "06",
    color: "#0F0F0F",
    textColor: "white",
    title: "FINAL BOSS:",
    highlight: "Geometry & Strings",
    highlightBg: "#FFD500",
    highlightText: "#0F0F0F",
    desc: "The final barrier between a Master and a Grandmaster. Computational geometry, Suffix Automatons, and complex Number Theory.",
    icon: (
      <svg className="w-10 h-10 text-[#FFD500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
      </svg>
    ),
    items: ["Convex Hull Algorithms", "KMP / Z-Algorithm", "Suffix Trees & Arrays", "Aho-Corasick Automaton"],
  },
]

interface RoadmapSectionProps {
  onOpenModal: () => void
}

export function RoadmapSection({ onOpenModal }: RoadmapSectionProps) {
  return (
    <section className="w-full bg-white border-y-[3px] border-[#0F0F0F]" id="roadmap">
      <div className="max-w-[1440px] mx-auto px-10 py-24">
        {/* Section header */}
        <div className="mb-20 relative">
          <span className="vector-node vector-node-tl" />
          <h2 className="font-display text-[64px] lg:text-[80px] leading-none text-[#0F0F0F] uppercase">
            ICPC <span className="text-[#7B2CBF]">ROADMAP.</span>
          </h2>
          <p className="font-body text-lg mt-4 max-w-xl border-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-4 shadow-solid-sm relative">
            <span className="vector-node vector-node-br" />
            Level up through 6 chapters. From programming basics to ICPC finals preparation.
          </p>
        </div>

        {/* Chapter vertical timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-[3px] bg-[#0F0F0F] hidden lg:block" />

          <div className="flex flex-col gap-20">
            {roadmapChapters.map((ch, i) => (
              <div key={ch.num} className="relative flex flex-col lg:flex-row gap-10 items-start">
                {/* Timeline dot */}
                <div
                  className="hidden lg:flex absolute left-0 top-0 w-[46px] h-[46px] items-center justify-center border-[3px] border-[#0F0F0F] shrink-0 font-display text-lg z-10"
                  style={{ backgroundColor: ch.color, color: ch.textColor }}
                >
                  {ch.num}
                </div>

                {/* Chapter label + description */}
                <div className="lg:ml-16 lg:w-1/3 flex flex-col gap-4">
                  <span
                    className="inline-block font-body font-bold text-xs px-3 py-1 border-[2px] border-[#0F0F0F] shadow-neo w-fit"
                    style={{ backgroundColor: ch.color, color: ch.textColor }}
                  >
                    CHAPTER {ch.num}
                  </span>
                  <h3 className="font-display text-4xl leading-tight text-[#0F0F0F]">
                    {ch.title}{" "}
                    <span className="px-2" style={{ backgroundColor: ch.highlightBg, color: ch.highlightText }}>
                      {ch.highlight}
                    </span>
                  </h3>
                  <p className="font-body text-sm text-[#0F0F0F]/70 leading-relaxed">{ch.desc}</p>
                  <div
                    className="w-20 h-20 border-[3px] border-[#0F0F0F] flex items-center justify-center shadow-neo"
                    style={{ backgroundColor: ch.color + "22", transform: `rotate(${i % 2 === 0 ? 6 : -6}deg)` }}
                  >
                    {ch.icon}
                  </div>
                </div>

                {/* Topic cards */}
                <div className="lg:w-2/3 w-full grid grid-cols-2 gap-4">
                  {ch.items.map((item, j) => (
                    <div
                      key={item}
                      className="border-[3px] border-[#0F0F0F] p-4 relative overflow-hidden shadow-neo hover:-translate-y-1 transition-transform duration-150"
                      style={{ backgroundColor: j % 2 === 0 ? "#FFF4E0" : "white" }}
                    >
                      <div className="stipple-pattern absolute inset-0 pointer-events-none opacity-10" style={{ color: ch.color }} />
                      <div className="relative z-10 flex items-center gap-3">
                        <span className="w-3 h-3 border border-[#0F0F0F] shrink-0" style={{ backgroundColor: ch.color }} />
                        <span className="font-body font-bold text-xs uppercase tracking-tight text-[#0F0F0F]">{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Milestone banner */}
          <div className="relative py-20 mt-20">
            <div className="absolute inset-0 bg-[#FFD500] border-y-[8px] border-[#0F0F0F]" style={{ transform: "rotate(-1deg) scaleX(1.1)" }} />
            <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
              <h3 className="font-display text-5xl text-[#0F0F0F] mb-4 uppercase">MILESTONE: THE ASCENT</h3>
              <p className="font-body font-bold text-lg text-[#0F0F0F] mb-8 italic">&ldquo;You have mastered the tools. Now, you must master the logic.&rdquo;</p>
              <button
                onClick={onOpenModal}
                className="btn-solid bg-[#0F0F0F] text-white px-12 py-5 font-display text-xl uppercase italic tracking-tighter shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-[3px] border-[#0F0F0F]"
              >
                Join to Unlock All Chapters
              </button>
            </div>
            <div className="absolute top-8 right-10 w-16 h-16 bg-white border-[3px] border-[#0F0F0F] -rotate-12 shadow-neo hidden md:block" />
            <div className="absolute bottom-8 left-10 w-12 h-12 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] rotate-45 shadow-neo hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  )
}
