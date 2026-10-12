import { Bug, Heart, HelpCircle, Lightbulb, MessageSquare } from "lucide-react"

export type FeedbackCategory = "SUGGESTION" | "BUG_REPORT" | "SHOUTOUT" | "OTHER_NULL"

export interface FeedbackDrop {
  id: string
  category: FeedbackCategory
  time: string
  message: string
  handle: string
  avatarBg?: string
}

export const CATEGORY_STYLES: Record<
  FeedbackCategory,
  { badgeBg: string; badgeText: string; avatarBg: string; borderShadow: string; icon: typeof Bug }
> = {
  SUGGESTION: {
    badgeBg: "bg-[#FFD500]",
    badgeText: "text-[#0F0F0F]",
    avatarBg: "bg-[#FFD500]",
    borderShadow: "shadow-[6px_6px_0px_#0F0F0F]",
    icon: Lightbulb,
  },
  BUG_REPORT: {
    badgeBg: "bg-[#0F0F0F]",
    badgeText: "text-[#00E5FF]",
    avatarBg: "bg-[#7B2CBF]",
    borderShadow: "shadow-[6px_6px_0px_#00E5FF]",
    icon: Bug,
  },
  SHOUTOUT: {
    badgeBg: "bg-[#7B2CBF]",
    badgeText: "text-white",
    avatarBg: "bg-[#00E5FF]",
    borderShadow: "shadow-[6px_6px_0px_#7B2CBF]",
    icon: Heart,
  },
  OTHER_NULL: {
    badgeBg: "bg-zinc-700",
    badgeText: "text-white",
    avatarBg: "bg-zinc-800",
    borderShadow: "shadow-[6px_6px_0px_#0F0F0F]",
    icon: HelpCircle,
  },
}

export function FeedbackDropCard({ drop }: { drop: FeedbackDrop }) {
  const style = CATEGORY_STYLES[drop.category]
  const IconComponent = style?.icon || MessageSquare

  return (
    <div
      className={`bg-white border-[3px] border-[#0F0F0F] p-5 ${style.borderShadow} relative group hover:-rotate-1 transition-transform`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`${style.badgeBg} ${style.badgeText} px-2 py-1 font-body text-xs font-bold border border-[#0F0F0F] flex items-center gap-1.5`}>
          <IconComponent className="w-3.5 h-3.5" />
          #{drop.category}
        </span>
        <span className="font-body text-xs text-zinc-500 font-bold">
          {drop.time}
        </span>
      </div>

      <p className="font-body text-sm leading-relaxed mb-4 text-[#0F0F0F]">
        &quot;{drop.message}&quot;
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-zinc-200">
        <div className={`w-5 h-5 rounded-full ${drop.avatarBg || style.avatarBg} border-2 border-[#0F0F0F] shrink-0`} />
        <span className="text-xs font-bold font-body text-[#0F0F0F]">
          {drop.handle}
        </span>
      </div>
    </div>
  )
}
