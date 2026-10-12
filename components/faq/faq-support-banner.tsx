import { OFFICIAL_COMMUNITY_LINKS } from "@/data/faq"

export function FaqSupportBanner() {
  return (
    <section className="border-[3px] border-[#0F0F0F] bg-white p-8 md:p-12 shadow-[10px_10px_0px_#0F0F0F] relative overflow-hidden">
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]" />

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <span className="inline-block bg-[#FFD500] text-[#0F0F0F] px-3 py-1 font-mono text-xs font-black uppercase border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
          💬 24/7 COMMUNITY SUPPORT // إحنا معاك خطوة بخطوة
        </span>

        <div className="space-y-3">
          <h2
            dir="rtl"
            className="font-cairo text-2xl md:text-3xl font-black text-[#0F0F0F] leading-snug"
          >
            لسه عندك أي سؤال تاني في بالك؟ متترددش تبعتلنا على جروب الواتساب أو ديسكورد وإحنا معاك خطوة بخطوة!
          </h2>

          <p
            className="font-grotesk text-base md:text-lg font-bold text-gray-600"
          >
            Still have questions? Feel free to reach out anytime on our WhatsApp group or Discord server—we&apos;re here to help you every step of the way!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href={OFFICIAL_COMMUNITY_LINKS.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 bg-[#25D366] text-black border-[3px] border-[#0F0F0F] font-black uppercase text-sm shadow-[4px_4px_0px_#0F0F0F] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F0F0F] transition-all flex items-center gap-2"
          >
            <span>JOIN WHATSAPP GROUP</span>
            <span className="text-base">↗</span>
          </a>

          <a
            href={OFFICIAL_COMMUNITY_LINKS.discord}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 bg-[#5865F2] text-white border-[3px] border-[#0F0F0F] font-black uppercase text-sm shadow-[4px_4px_0px_#0F0F0F] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F0F0F] transition-all flex items-center gap-2"
          >
            <span>JOIN DISCORD SERVER</span>
            <span className="text-base">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
