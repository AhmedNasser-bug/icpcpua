"use client"

import { useState } from "react"
import {
  Terminal,
  CheckCircle2,
  RotateCcw,
  Layers,
  Sparkles,
} from "lucide-react"
import { VectorNodes } from "@/components/vector-nodes"
import {
  type FeedbackCategory,
  type FeedbackDrop,
} from "@/components/feedback/drop-card"
import { FeedbackDispatchForm } from "@/components/feedback/feedback-dispatch-form"
import { RecentDropsSidebar } from "@/components/feedback/recent-drops-sidebar"

const INITIAL_DROPS: FeedbackDrop[] = [
  {
    id: "drop-1",
    category: "BUG_REPORT",
    time: "2m_AGO",
    message: "The leaderboard doesn't update in real-time on mobile Safari. Needs a fix ASAP for the upcoming contest!",
    handle: "USER_01",
  },
  {
    id: "drop-2",
    category: "SHOUTOUT",
    time: "1h_AGO",
    message: "Shoutout to the dev team for the new dark mode and neo-brutalist theme. Late-night practice is so much cleaner now.",
    handle: "DARK_MODE_LOVER",
  },
  {
    id: "drop-3",
    category: "SUGGESTION",
    time: "3h_AGO",
    message: "Can we add a 'Duel' mode where we can challenge specific people to a speed-coding round in C++?",
    handle: "COMP_GENIUS",
    avatarBg: "bg-[#0F0F0F]",
  },
]

export default function FeedbackBucketPage() {
  // Simplified strictly to two fields: category & message
  const [category, setCategory] = useState<FeedbackCategory>("SUGGESTION")
  const [message, setMessage] = useState("")
  const [drops, setDrops] = useState<FeedbackDrop[]>(INITIAL_DROPS)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setErrorMsg("CANNOT DUMP NULL BYTES! PLEASE WRITE YOUR FEEDBACK FIRST.")
      return
    }

    setErrorMsg("")
    const newDrop: FeedbackDrop = {
      id: `drop-${Date.now()}`,
      category,
      time: "JUST_NOW",
      message: message.trim(),
      handle: "COMMUNITY_CODER",
    }

    setDrops([newDrop, ...drops])
    setIsSubmitted(true)
  }

  const handleReset = () => {
    setMessage("")
    setIsSubmitted(false)
    setErrorMsg("")
  }

  return (
    <div className="flex-grow flex flex-col bg-[#FFF4E0] text-[#0F0F0F]">


      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex-1 w-full">
        {/* ── HERO SECTION ── */}
        <header className="mb-14 relative">
          <div className="absolute -top-10 -left-6 opacity-10 select-none pointer-events-none">
            <span className="font-display text-[140px] md:text-[180px] leading-none text-[#7B2CBF]">
              {"//"}
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
              <span>{"// SYSTEM_MESSAGE: DROP YOUR BRAIN BYTES HERE. HELP US OPTIMIZE THE HUB."}</span>
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
              <VectorNodes />

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
                <FeedbackDispatchForm
                  category={category}
                  message={message}
                  errorMsg={errorMsg}
                  onCategoryChange={setCategory}
                  onMessageChange={setMessage}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </section>

          {/* ── RECENT DROPS SIDEBAR (4 COLS) ── */}
          <RecentDropsSidebar drops={drops} />
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
