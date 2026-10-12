import { FaqItemData } from "@/data/faq"

export type FaqLanguageMode = "both" | "ar" | "en"

export function FaqCard({
  item,
  lang,
  isOpen,
  onToggle,
}: {
  item: FaqItemData
  lang: FaqLanguageMode
  isOpen: boolean
  onToggle: () => void
}) {
  const showAr = lang === "ar" || lang === "both"
  const showEn = lang === "en" || lang === "both"

  return (
    <div
      className={`border-[3px] border-[#0F0F0F] transition-all duration-200 shadow-[6px_6px_0px_#0F0F0F] hover:shadow-[8px_8px_0px_#0F0F0F] ${
        isOpen ? "bg-white" : "bg-white hover:bg-[#FFFDF8]"
      }`}
    >
      {/* Accordion Trigger */}
      <button
        onClick={onToggle}
        className="w-full text-left p-6 md:p-7 flex items-start justify-between gap-4 cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex-1 space-y-2">
          {/* Badge & Number */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="bg-[#0F0F0F] text-[#FFF4E0] px-2 py-0.5 font-black">
              Q{item.number.toString().padStart(2, "0")}
            </span>
            <span
              className="px-2 py-0.5 border border-[#0F0F0F] font-bold uppercase text-[11px]"
              style={{ backgroundColor: item.badgeColor || "#00E5FF", color: "#0F0F0F" }}
            >
              {lang === "ar" ? item.badge.ar : item.badge.en}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-1 pt-1">
            {showAr && (
              <h3
                dir="rtl"
                className="text-xl md:text-2xl font-black text-[#0F0F0F] tracking-tight leading-snug"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                {item.question.ar}
              </h3>
            )}
            {showEn && (
              <h3
                className={`text-lg md:text-xl font-black uppercase text-[#0F0F0F] tracking-tight leading-snug ${
                  showAr ? "text-gray-700 text-base md:text-lg font-mono pt-1" : ""
                }`}
                style={{ fontFamily: showAr ? "Space Grotesk, sans-serif" : "Fredoka One, sans-serif" }}
              >
                {item.question.en}
              </h3>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <div
          className={`w-9 h-9 border-2 border-[#0F0F0F] flex items-center justify-center shrink-0 transition-transform duration-200 shadow-[2px_2px_0px_#0F0F0F] ${
            isOpen ? "rotate-180 bg-[#FFD500]" : "bg-[#00E5FF]"
          }`}
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t-[3px] border-[#0F0F0F] p-6 md:p-8 bg-[#FFF4E0]/40 space-y-6">
          {/* Arabic Answer */}
          {showAr && (
            <div dir="rtl" className="text-right space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7B2CBF] uppercase tracking-wider">
                <span className="w-2 h-2 bg-[#7B2CBF] inline-block" />
                <span>الإجابة الرسمية باللغة العربية</span>
              </div>
              <p className="text-base md:text-lg font-bold text-[#0F0F0F] leading-relaxed">
                {item.answer.ar.intro}
              </p>

              {item.answer.ar.points && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {item.answer.ar.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-[#0F0F0F] bg-white p-3.5 shadow-[3px_3px_0px_#0F0F0F]"
                    >
                      <span className="block font-black text-[#FF0055] text-sm mb-1">
                        ▫️ {pt.label}:
                      </span>
                      <p className="text-sm font-semibold text-gray-800 leading-normal">{pt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider between languages if both are displayed */}
          {showAr && showEn && (
            <div className="border-t-2 border-dashed border-[#0F0F0F]/30 my-4" />
          )}

          {/* English Answer */}
          {showEn && (
            <div className="text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF0055] uppercase tracking-wider">
                <span className="w-2 h-2 bg-[#FF0055] inline-block" />
                <span>Official English Response</span>
              </div>
              <p className="text-base md:text-lg font-bold text-[#0F0F0F] leading-relaxed" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {item.answer.en.intro}
              </p>

              {item.answer.en.points && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {item.answer.en.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-[#0F0F0F] bg-white p-3.5 shadow-[3px_3px_0px_#0F0F0F]"
                    >
                      <span className="block font-black text-[#7B2CBF] text-xs font-mono uppercase tracking-wide mb-1">
                        ▫️ {pt.label}:
                      </span>
                      <p className="text-sm font-bold text-gray-800 leading-normal" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        {pt.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Links if any (e.g., Q9) */}
          {item.links && (
            <div className="pt-4 border-t-2 border-[#0F0F0F]/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.links.map((link, idx) => {
                const isExternal = link.url.startsWith("http");
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="p-3 border-2 border-[#0F0F0F] bg-white font-mono text-xs font-black uppercase flex items-center justify-between gap-2 shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FFD500] hover:-translate-y-0.5 transition-all"
                  >
                    <span>{lang === "ar" ? link.label.ar : link.label.en}</span>
                    <span className="text-sm font-bold">↗</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
