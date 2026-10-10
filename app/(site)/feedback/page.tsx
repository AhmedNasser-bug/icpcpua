"use client"

import { useState } from "react"
import { 
  Terminal, 
  Bug, 
  Lightbulb, 
  Heart, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Layers,
  Flame,
  MessageSquare
} from "lucide-react"

type Category = "SUGGESTION" | "BUG_REPORT" | "SHOUTOUT" | "OTHER_NULL"

interface DropItem {
  id: string
  category: Category
  time: string
  message: string
  handle: string
  badgeBg: string
  badgeText: string
  avatarBg: string
  borderColor: string
}

const INITIAL_DROPS: DropItem[] = [
  {
    id: "drop-1",
    category: "BUG_REPORT",
    time: "2m_AGO",
    message: "The leaderboard doesn't update in real-time on mobile Safari. Needs a fix ASAP for the upcoming contest!",
    handle: "USER_01",
    badgeBg: "bg-[#0F0F0F]",
    badgeText: "text-[#00E5FF]",
    avatarBg: "bg-[#7B2CBF]",
    borderColor: "shadow-[6px_6px_0px_#00E5FF]",
  },
  {
    id: "drop-2",
    category: "SHOUTOUT",
    time: "1h_AGO",
    message: "Shoutout to the dev team for the new dark mode and neo-brutalist theme. Late-night practice is so much cleaner now.",
    handle: "DARK_MODE_LOVER",
    badgeBg: "bg-[#7B2CBF]",
    badgeText: "text-white",
    avatarBg: "bg-[#00E5FF]",
    borderColor: "shadow-[6px_6px_0px_#7B2CBF]",
  },
  {
    id: "drop-3",
    category: "SUGGESTION",
    time: "3h_AGO",
    message: "Can we add a 'Duel' mode where we can challenge specific people to a speed-coding round in C++?",
    handle: "COMP_GENIUS",
    badgeBg: "bg-[#FFD500]",
    badgeText: "text-[#0F0F0F]",
    avatarBg: "bg-[#0F0F0F]",
    borderColor: "shadow-[6px_6px_0px_#0F0F0F]",
  },
]

const CATEGORY_STYLES: Record<Category, { badgeBg: string; badgeText: string; avatarBg: string; borderShadow: string; icon: typeof Bug }> = {
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

export default function FeedbackBucketPage() {
  // Simplified strictly to two fields: category & message
  const [category, setCategory] = useState<Category>("SUGGESTION")
  const [message, setMessage] = useState("")
  const [drops, setDrops] = useState<DropItem[]>(INITIAL_DROPS)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("ALL")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setErrorMsg("CANNOT DUMP NULL BYTES! PLEASE WRITE YOUR FEEDBACK FIRST.")
      return
    }

    setErrorMsg("")
    const style = CATEGORY_STYLES[category]
    const newDrop: DropItem = {
      id: `drop-${Date.now()}`,
      category,
      time: "JUST_NOW",
      message: message.trim(),
      handle: "COMMUNITY_CODER",
      badgeBg: style.badgeBg,
      badgeText: style.badgeText,
      avatarBg: style.avatarBg,
      borderColor: style.borderShadow,
    }

    setDrops([newDrop, ...drops])
    setIsSubmitted(true)
  }

  const handleReset = () => {
    setMessage("")
    setIsSubmitted(false)
    setErrorMsg("")
  }

  const filteredDrops = activeFilter === "ALL" 
    ? drops 
    : drops.filter((d) => d.category === activeFilter)

  return (
    <div className="flex-grow flex flex-col bg-[#FFF4E0] text-[#0F0F0F]">


      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex-1 w-full">
        {/* ── HERO SECTION ── */}
        <header className="mb-14 relative">
          <div className="absolute -top-10 -left-6 opacity-10 select-none pointer-events-none">
            <span className="font-display text-[140px] md:text-[180px] leading-none text-[#7B2CBF]">
              //
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#7B2CBF] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
              COMMUNITY_SIGNAL // v2.6
            </span>
            <span className="font-body text-xs font-bold text-[#7B2CBF] uppercase tracking-wider flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              BUCKET ACTIVE
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-[#0F0F0F] uppercase tracking-tight leading-[0.9] mb-6 relative z-10 [text-shadow:4px_4px_0_#00E5FF]">
            FEEDBACK <br />
            <span className="text-[#7B2CBF] underline decoration-[#FFD500] decoration-8 underline-offset-8">
              BUCKET.
            </span>
          </h1>

          <div className="bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-4 inline-block shadow-[6px_6px_0px_#0F0F0F] max-w-3xl">
            <p className="font-body font-bold text-sm md:text-base text-[#0F0F0F] flex items-center gap-2">
              <Terminal className="w-5 h-5 shrink-0" />
              <span>// SYSTEM_MESSAGE: DROP YOUR BRAIN BYTES HERE. HELP US OPTIMIZE THE HUB.</span>
            </p>
          </div>
        </header>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ── FORM CONTAINER (8 COLS) ── */}
          <section className="lg:col-span-8 relative">
            {/* Decorative Corner Accents */}
            <div className="absolute -top-3 -left-3 z-20 bg-[#FFD500] border-2 border-[#0F0F0F] p-1.5 shadow-[2px_2px_0px_#0F0F0F]">
              <Layers className="w-5 h-5 text-[#0F0F0F]" />
            </div>
            <div className="absolute -bottom-3 -right-3 z-20 bg-[#00E5FF] border-2 border-[#0F0F0F] p-1.5 shadow-[2px_2px_0px_#0F0F0F]">
              <Sparkles className="w-5 h-5 text-[#0F0F0F]" />
            </div>

            <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[8px_8px_0px_#0F0F0F] relative overflow-hidden">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

              {/* Watermark / Background Texture */}
              <div 
                className="absolute top-0 right-0 w-40 h-40 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#7B2CBF 1.5px, transparent 1.5px)",
                  backgroundSize: "6px 6px"
                }}
              />

              {isSubmitted ? (
                <div className="py-12 px-4 flex flex-col items-center text-center gap-6 animate-slide-in">
                  <div className="w-20 h-20 bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-[#7B2CBF]" />
                  </div>
                  <div>
                    <span className="bg-[#7B2CBF] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
                      TRANSMISSION_CONFIRMED
                    </span>
                    <h3 className="font-display text-4xl md:text-5xl uppercase text-[#0F0F0F] mt-3">
                      BYTES STORED IN BUCKET!
                    </h3>
                    <p className="font-body text-sm md:text-base text-zinc-600 max-w-md mt-2">
                      Your drop was indexed into the live feedback pipeline. The ICPC core team reviews every drop to optimize the platform.
                    </p>
                  </div>

                  <button
                    onClick={handleReset}
                    className="btn-solid inline-flex items-center gap-3 bg-[#7B2CBF] text-white font-display text-lg uppercase tracking-wider px-8 py-4 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] hover:bg-[#00E5FF] hover:text-[#0F0F0F] transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>DUMP ANOTHER BYTE</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
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
                          onChange={(e) => setCategory(e.target.value as Category)}
                          className="w-full border-[3px] border-[#0F0F0F] bg-white p-4 font-body font-bold text-sm md:text-base text-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] focus:outline-none focus:bg-[#FFF4E0] focus:border-[#7B2CBF] cursor-pointer appearance-none"
                        >
                          <option value="SUGGESTION">💡 SUGGESTION // FEATURE & IMPROVEMENT IDEA</option>
                          <option value="BUG_REPORT">🐛 BUG_REPORT // PLATFORM GLITCH OR EDGE CASE</option>
                          <option value="SHOUTOUT">💜 SHOUTOUT // KUDOS TO COMMUNITY / DEV SQUAD</option>
                          <option value="OTHER_NULL">⚡ OTHER_NULL // GENERAL BYTES & RAMBLINGS</option>
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
                        onChange={(e) => setMessage(e.target.value)}
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
              )}
            </div>
          </section>

          {/* ── RECENT DROPS SIDEBAR (4 COLS) ── */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-4 shadow-[6px_6px_0px_#0F0F0F] flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl md:text-3xl uppercase text-[#0F0F0F]">
                  RECENT DROPS
                </h2>
                <p className="font-body text-xs font-bold text-[#0F0F0F]/70 uppercase">
                  LIVE COMMUNITY TRANSMISSIONS
                </p>
              </div>
              <span className="bg-[#0F0F0F] text-[#FFD500] font-body text-xs font-bold px-2 py-1">
                {drops.length} BYTES
              </span>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {["ALL", "BUG_REPORT", "SUGGESTION", "SHOUTOUT"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`font-body text-xs font-bold px-2.5 py-1 border-2 border-[#0F0F0F] transition-all cursor-pointer ${
                    activeFilter === f
                      ? "bg-[#7B2CBF] text-white shadow-[2px_2px_0px_#0F0F0F]"
                      : "bg-white text-[#0F0F0F] hover:bg-[#FFF4E0]"
                  }`}
                >
                  #{f}
                </button>
              ))}
            </div>

            {/* Drops List */}
            <div className="space-y-4">
              {filteredDrops.map((drop) => {
                const IconComponent = CATEGORY_STYLES[drop.category]?.icon || MessageSquare
                return (
                  <div
                    key={drop.id}
                    className={`bg-white border-[3px] border-[#0F0F0F] p-5 ${drop.borderColor} relative group hover:-rotate-1 transition-transform`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`${drop.badgeBg} ${drop.badgeText} px-2 py-1 font-body text-xs font-bold border border-[#0F0F0F] flex items-center gap-1.5`}>
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
                      <div className={`w-5 h-5 rounded-full ${drop.avatarBg} border-2 border-[#0F0F0F] shrink-0`} />
                      <span className="text-xs font-bold font-body text-[#0F0F0F]">
                        {drop.handle}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-[#FFF4E0] border-[2px] border-dashed border-[#0F0F0F] p-4 text-center">
              <p className="font-body text-xs font-bold text-zinc-600 uppercase">
                // AUTOMATED CLEANUP CYCLE RUNS EVERY 24H
              </p>
            </div>
          </aside>
        </div>

        {/* ── SYSTEM STATS / DECORATIVE SECTION ── */}
        <section className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0F0F0F] text-white p-6 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#7B2CBF] flex flex-col items-center justify-center text-center">
            <span className="font-display text-4xl md:text-5xl text-white">1.2K</span>
            <span className="font-body text-xs uppercase tracking-widest text-zinc-400 font-bold mt-1">
              DROPS_COLLECTED
            </span>
          </div>

          <div className="bg-[#7B2CBF] text-white p-6 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#FFD500] flex flex-col items-center justify-center text-center">
            <span className="font-display text-4xl md:text-5xl text-[#FFD500]">98%</span>
            <span className="font-body text-xs uppercase tracking-widest text-purple-200 font-bold mt-1">
              OPTIMIZED
            </span>
          </div>

          <div className="bg-[#00E5FF] text-[#0F0F0F] p-6 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] flex flex-col items-center justify-center text-center">
            <span className="font-display text-4xl md:text-5xl text-[#0F0F0F]">42</span>
            <span className="font-body text-xs uppercase tracking-widest text-[#0F0F0F] font-bold mt-1">
              BUGS_SQUASHED
            </span>
          </div>

          <div className="bg-[#FFD500] text-[#0F0F0F] p-6 border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#FF0055] flex flex-col items-center justify-center text-center">
            <span className="font-display text-4xl md:text-5xl text-[#0F0F0F]">∞</span>
            <span className="font-body text-xs uppercase tracking-widest text-[#0F0F0F] font-bold mt-1">
              CODE_STRIKES
            </span>
          </div>
        </section>
      </main>
    </div>
  )
}
