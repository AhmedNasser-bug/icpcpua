import { Send } from "lucide-react"
import type { FeedbackCategory } from "./drop-card"

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "SUGGESTION", label: "💡 SUGGESTION // FEATURE & IMPROVEMENT IDEA" },
  { value: "BUG_REPORT", label: "🐛 BUG_REPORT // PLATFORM GLITCH OR EDGE CASE" },
  { value: "SHOUTOUT", label: "💜 SHOUTOUT // KUDOS TO COMMUNITY / DEV SQUAD" },
  { value: "OTHER_NULL", label: "⚡ OTHER_NULL // GENERAL BYTES & RAMBLINGS" },
]

export function FeedbackDispatchForm({
  category,
  message,
  errorMsg,
  onCategoryChange,
  onMessageChange,
  onSubmit,
}: {
  category: FeedbackCategory
  message: string
  errorMsg: string
  onCategoryChange: (category: FeedbackCategory) => void
  onMessageChange: (message: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="border-b-[3px] border-[#0F0F0F] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F]">
            SUBMIT DISPATCH
          </h2>
          <p className="font-body text-xs font-bold text-zinc-500 uppercase tracking-wider">
            FAST & FRICTIONLESS // TWO FIELDS ONLY
          </p>
        </div>
        <span className="font-body text-xs font-bold bg-[#FFF4E0] border-2 border-[#0F0F0F] px-2 py-1 w-fit">
          ANONYMOUS BY DEFAULT
        </span>
      </div>

      {errorMsg && (
        <div className="bg-[#FF0055] text-white p-3 border-[2px] border-[#0F0F0F] font-body text-xs font-bold shadow-[4px_4px_0px_#0F0F0F]">
          [ERR] {errorMsg}
        </div>
      )}

      {/* ── SIMPLIFIED 2 FIELDS ── */}
      <div className="space-y-6">
        {/* FIELD 1: CATEGORY_ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-display text-xl uppercase tracking-wider text-[#0F0F0F] flex items-center gap-2">
              <span className="w-3 h-3 bg-[#7B2CBF] border border-[#0F0F0F] inline-block" />
              <span>1. CATEGORY_</span>
            </label>
            <span className="font-body text-xs font-bold text-zinc-500">REQUIRED</span>
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as FeedbackCategory)}
              className="w-full border-[3px] border-[#0F0F0F] bg-white p-4 font-body font-bold text-sm md:text-base text-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] focus:outline-none focus:bg-[#FFF4E0] focus:border-[#7B2CBF] cursor-pointer appearance-none"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-[#FFD500] border-2 border-[#0F0F0F] px-2 py-0.5 font-display text-xs">
              SELECT ▼
            </div>
          </div>
        </div>

        {/* FIELD 2: MESSAGE_CONTENT_ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-display text-xl uppercase tracking-wider text-[#0F0F0F] flex items-center gap-2">
              <span className="w-3 h-3 bg-[#00E5FF] border border-[#0F0F0F] inline-block" />
              <span>2. MESSAGE_CONTENT_</span>
            </label>
            <span className="font-body text-xs font-bold text-zinc-500">REQUIRED</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={6}
            required
            className="w-full border-[3px] border-[#0F0F0F] bg-white p-4 font-body text-sm md:text-base text-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] focus:outline-none focus:bg-[#FFF4E0] focus:border-[#7B2CBF] resize-none"
            placeholder="TYPE_YOUR_THOUGHTS_HERE... (BE BRUTAL, BE CONSTRUCTIVE. FEEL FREE TO APPEND YOUR @HANDLE IF YOU'D LIKE CREDIT)"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        className="btn-solid w-full bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-5 px-6 font-display text-2xl md:text-3xl uppercase tracking-wider shadow-[8px_8px_0px_#0F0F0F] hover:bg-[#FF0055] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4 cursor-pointer"
      >
        <Send className="w-7 h-7" />
        <span>DUMP FEEDBACK</span>
      </button>
    </form>
  )
}
