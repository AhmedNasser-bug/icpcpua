import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full bg-[#0F0F0F] border-t-[6px] border-[#FF0055] py-12 px-10 mt-auto z-10 shrink-0">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 w-full">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-display text-4xl text-white italic">PUA ICPC</span>
          <p className="font-body text-xs text-zinc-400 uppercase tracking-widest">
            &copy; 2026 PUA ICPC COMMUNITY. NO LOGIC, NO GLORY.
          </p>
        </div>
        <div className="flex gap-8">
          {["Discord", "GitHub", "Codeforces"].map((link) => (
            <a key={link} href="#" className="font-body font-bold text-zinc-400 hover:text-[#FF0055] hover:underline decoration-4 transition-colors text-sm">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
