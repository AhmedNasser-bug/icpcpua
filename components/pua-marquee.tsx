export function Marquee() {
  const items = [
    { text: "NEXT BOOTCAMP REGISTRATION OPEN", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#00E5FF]" },
    { text: "TOP 10 REGIONALS", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#FF0055]" },
    { text: "EAT SLEEP CODE REPEAT", color: "text-[#FFD500]" },
    { text: "///", color: "text-white" },
    { text: "O(N LOG N) OR BUST", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#00E5FF]" },
    { text: "CRACK THE CODE.", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#FF0055]" },
    { text: "NEXT BOOTCAMP REGISTRATION OPEN", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#00E5FF]" },
    { text: "TOP 10 REGIONALS", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#FF0055]" },
    { text: "EAT SLEEP CODE REPEAT", color: "text-[#FFD500]" },
    { text: "///", color: "text-white" },
    { text: "O(N LOG N) OR BUST", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#00E5FF]" },
    { text: "CRACK THE CODE.", color: "text-[#FFD500]" },
    { text: "///", color: "text-[#FF0055]" },
  ]

  return (
    <div className="w-full bg-[#0F0F0F] border-t-[3px] border-[#0F0F0F] py-4 marquee-container relative z-20">
      <div className="marquee-content font-display text-2xl uppercase tracking-widest">
        {items.map((item, i) => (
          <span key={i} className={item.color}>{item.text}</span>
        ))}
      </div>
    </div>
  )
}
