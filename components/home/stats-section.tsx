export function StatsSection() {
  return (
    <section className="w-full max-w-[1440px] px-10 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { value: "450+", label: "Members", bg: "#FFD500", text: "#0F0F0F", hoverText: "#7B2CBF", nodes: ["tl", "br"] },
          { value: "10K+", label: "Problems Solved", bg: "#00E5FF", text: "#0F0F0F", hoverText: "#FF0055", nodes: ["tl", "tr"] },
          { value: "24",   label: "Contests Hosted", bg: "#7B2CBF", text: "white",  hoverText: "#FFD500", nodes: ["tr", "br"] },
        ].map((s) => (
          <div
            key={s.label}
            className="h-[150px] border-[3px] border-[#0F0F0F] shadow-solid relative flex flex-col items-center justify-center p-6 group hover:-translate-y-2 transition-transform duration-200"
            style={{ backgroundColor: s.bg }}
          >
            {s.nodes.includes("tl") && <span className="vector-node vector-node-tl" />}
            {s.nodes.includes("tr") && <span className="vector-node vector-node-tr" />}
            {s.nodes.includes("bl") && <span className="vector-node vector-node-bl" />}
            {s.nodes.includes("br") && <span className="vector-node vector-node-br" />}
            <span className="font-display text-5xl transition-colors" style={{ color: s.text }}>{s.value}</span>
            <span className="font-body font-bold text-sm uppercase tracking-wide mt-2 bg-white px-3 py-1 border-[2px] border-[#0F0F0F]">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
