"use client"

import { useState } from "react"
import Link from "next/link"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { Marquee } from "@/components/pua-marquee"
import {
  Gift,
  Share2,
  Copy,
  Check,
  Users,
  Award,
  Trophy,
  ShieldCheck,
  Flame,
  Zap,
  Sparkles,
  Terminal,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Shirt,
  Target,
  Plane,
  Star,
  CheckCircle2
} from "lucide-react"

interface Tier {
  level: number
  name: string
  recruitsNeeded: number
  badgeColor: string
  accentColor: string
  shadowColor: string
  perks: { title: string; desc: string; icon: typeof Gift }[]
}

const TIERS: Tier[] = [
  {
    level: 1,
    name: "SCOUT",
    recruitsNeeded: 1,
    badgeColor: "bg-[#FFD500] text-[#0F0F0F]",
    accentColor: "border-[#FFD500]",
    shadowColor: "shadow-[6px_6px_0px_#FFD500]",
    perks: [
      {
        title: "Discord 'Talent Scout' Role",
        desc: "Exclusive badge, access to private mentor channels & early contest leaks.",
        icon: Star,
      },
      {
        title: "Curated 50-Problem Interview Sheet",
        desc: "Handpicked high-frequency technical questions used by Google & Meta.",
        icon: BookOpen,
      },
      {
        title: "PUA ICPC Sticker Pack",
        desc: "Tactical vinyl neo-brutalist stickers for your laptop.",
        icon: Sparkles,
      },
    ],
  },
  {
    level: 2,
    name: "VANGUARD",
    recruitsNeeded: 3,
    badgeColor: "bg-[#00E5FF] text-[#0F0F0F]",
    accentColor: "border-[#00E5FF]",
    shadowColor: "shadow-[6px_6px_0px_#00E5FF]",
    perks: [
      {
        title: "Official Neo-Brutalist Hoodie",
        desc: "Heavyweight premium cotton squad apparel with custom embroidery.",
        icon: Shirt,
      },
      {
        title: "1-on-1 FAANG Mock Interview",
        desc: "60-minute technical interview simulation with senior ICPC finalists.",
        icon: Target,
      },
      {
        title: "Priority Lab Seat Reservation",
        desc: "Guaranteed terminal spot during high-volume campus mock contests.",
        icon: Terminal,
      },
    ],
  },
  {
    level: 3,
    name: "COMMANDER",
    recruitsNeeded: 6,
    badgeColor: "bg-[#7B2CBF] text-white",
    accentColor: "border-[#7B2CBF]",
    shadowColor: "shadow-[6px_6px_0px_#7B2CBF]",
    perks: [
      {
        title: "Sponsored Regional Bootcamp Pass",
        desc: "Full travel and entry coverage for the national ECPC training camps.",
        icon: Plane,
      },
      {
        title: "Verified LinkedIn Endorsement",
        desc: "Official leadership and algorithmic recommendation from PUA ICPC staff.",
        icon: Award,
      },
      {
        title: "Hall of Fame Plaque",
        desc: "Permanent inclusion on the campus leaderboard wall of honors.",
        icon: Trophy,
      },
    ],
  },
  {
    level: 4,
    name: "GRANDMASTER",
    recruitsNeeded: 10,
    badgeColor: "bg-[#FF0055] text-white",
    accentColor: "border-[#FF0055]",
    shadowColor: "shadow-[6px_6px_0px_#FF0055]",
    perks: [
      {
        title: "Custom Mechanical CP Keycaps",
        desc: "Custom engraved PBT mechanical keycap kit tailored for speed-coders.",
        icon: Zap,
      },
      {
        title: "Permanent Executive Board Seat",
        desc: "Direct vote on community curriculum, contest hosting, and team sponsorships.",
        icon: Flame,
      },
      {
        title: "Exclusive Sponsor Hardware Bounty",
        desc: "Sponsored CP gear and direct fast-track referral to partner software firms.",
        icon: Gift,
      },
    ],
  },
]

const LEADERBOARD_SCOUTS = [
  { rank: 1, handle: "KHALID_ALGO", recruits: 14, tier: "GRANDMASTER", badgeBg: "bg-[#FF0055] text-white" },
  { rank: 2, handle: "NOOR_BYTES", recruits: 8, tier: "COMMANDER", badgeBg: "bg-[#7B2CBF] text-white" },
  { rank: 3, handle: "OMAR_CPP", recruits: 5, tier: "VANGUARD", badgeBg: "bg-[#00E5FF] text-[#0F0F0F]" },
  { rank: 4, handle: "SALMA_CODE", recruits: 4, tier: "VANGUARD", badgeBg: "bg-[#00E5FF] text-[#0F0F0F]" },
  { rank: 5, handle: "YOUSSEF_DP", recruits: 2, tier: "SCOUT", badgeBg: "bg-[#FFD500] text-[#0F0F0F]" },
]

export default function ReferralRewardPage() {
  const [handle, setHandle] = useState("ANON_CODER")
  const [copied, setCopied] = useState(false)
  const [simulatedRecruits, setSimulatedRecruits] = useState(3)
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)

  const sanitizedHandle = handle.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "") || "ANON_CODER"
  const referralCode = `PUA-${sanitizedHandle}-2026`
  const referralUrl = `https://icpcpua.org/join?ref=${referralCode}`

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const currentTier = [...TIERS]
    .reverse()
    .find((t) => simulatedRecruits >= t.recruitsNeeded) || {
    level: 0,
    name: "NOVICE",
    recruitsNeeded: 0,
    badgeColor: "bg-zinc-800 text-white",
    accentColor: "border-zinc-800",
    shadowColor: "shadow-[6px_6px_0px_#0F0F0F]",
    perks: [],
  }

  const nextTier = TIERS.find((t) => t.recruitsNeeded > simulatedRecruits)
  const progressPercent = nextTier
    ? Math.min(100, Math.round((simulatedRecruits / nextTier.recruitsNeeded) * 100))
    : 100

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F]">
      <PuaNavbar />

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex-1 w-full">
        {/* ── HERO BANNER ── */}
        <header className="mb-14 relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#7B2CBF] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
              BOUNTY_SYSTEM // PROTOCOL 2026
            </span>
            <span className="bg-[#FFD500] text-[#0F0F0F] px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F]">
              COMMUNITY EXPANSION ACTIVE
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-[#0F0F0F] uppercase tracking-tight leading-[0.9] mb-6 relative z-10 [text-shadow:4px_4px_0_#00E5FF]">
            RECRUIT <br />
            <span className="text-[#7B2CBF] underline decoration-[#FFD500] decoration-8 underline-offset-8">
              PROTOCOL.
            </span>
          </h1>

          <div className="bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-4 inline-block shadow-[6px_6px_0px_#0F0F0F] max-w-3xl">
            <p className="font-body font-bold text-sm md:text-base text-[#0F0F0F] flex items-center gap-2">
              <Terminal className="w-5 h-5 shrink-0" />
              <span>// RECRUIT YOUR PEERS. SPREAD LOGIC. UNLOCK SQUAD HOODIES, MERCH & FAANG INTERVIEWS.</span>
            </p>
          </div>
        </header>

        {/* ── RECRUITMENT CODE GENERATOR & LINK HUB ── */}
        <section className="mb-16">
          <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[8px_8px_0px_#0F0F0F] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="bg-[#FFD500] text-[#0F0F0F] px-2.5 py-1 font-body text-xs font-bold border-2 border-[#0F0F0F] uppercase tracking-wider">
                  01 // GENERATE YOUR DISPATCH CODE
                </span>
                <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] leading-tight">
                  YOUR PERSONAL SCOUT LINK
                </h2>
                <p className="font-body text-sm text-zinc-700 leading-relaxed font-bold">
                  Enter your campus handle or student callsign. We will synthesize a tracked referral link. Share it with your classmates in Engineering, CS, and AI.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="font-body text-xs font-bold uppercase tracking-widest text-[#0F0F0F] block">
                    ENTER CALLSIGN / CODEFORCES HANDLE_
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="E.G. AHMED_DEV"
                    className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-4 font-body font-bold text-base text-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] focus:outline-none focus:bg-white focus:border-[#7B2CBF]"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col gap-4 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#7B2CBF]">
                <div>
                  <span className="font-body text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                    SYNTHESIZED INVITE CODE:
                  </span>
                  <div className="bg-[#0F0F0F] text-[#00E5FF] p-3 font-body font-bold text-xl border-2 border-[#0F0F0F] tracking-wider select-all">
                    {referralCode}
                  </div>
                </div>

                <div>
                  <span className="font-body text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                    TARGET REFERRAL URL:
                  </span>
                  <div className="bg-white p-3 font-body text-xs md:text-sm text-[#0F0F0F] border-2 border-[#0F0F0F] break-all select-all font-bold">
                    {referralUrl}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleCopy}
                    className="btn-solid flex-1 bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-3.5 px-6 font-display text-base md:text-lg uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-[#FFD500]" />
                        <span>COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>COPY DISPATCH LINK</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Join me at PUA ICPC! Crack competitive programming and master FAANG algorithms with code: ${referralCode} 👉 ${referralUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-solid bg-[#25D366] text-[#0F0F0F] border-[3px] border-[#0F0F0F] py-3.5 px-5 font-display text-base uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>SHARE</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE LOOT & PROGRESS SIMULATOR ── */}
        <section className="mb-20">
          <div className="bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[8px_8px_0px_#FFD500] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-2 border-purple-400/40 pb-6">
              <div>
                <span className="bg-[#FFD500] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
                  INTERACTIVE SIMULATOR
                </span>
                <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tight mt-2 text-white">
                  RECRUITMENT LADDER // LOOT PREVIEW
                </h2>
                <p className="font-body text-xs md:text-sm text-purple-200 mt-1 font-bold">
                  Drag the slider to test recruit milestones and see unlocked perks in real-time.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#0F0F0F] border-2 border-white p-3">
                <div className="flex flex-col">
                  <span className="font-body text-[10px] text-zinc-400 uppercase tracking-widest">CURRENT RANK:</span>
                  <span className="font-display text-2xl text-[#00E5FF] uppercase">{currentTier.name}</span>
                </div>
                <div className="h-8 w-[2px] bg-zinc-700" />
                <div className="flex flex-col">
                  <span className="font-body text-[10px] text-zinc-400 uppercase tracking-widest">ACTIVE RECRUITS:</span>
                  <span className="font-display text-2xl text-[#FFD500]">{simulatedRecruits}</span>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center font-body text-xs md:text-sm font-bold">
                <span>SIMULATED SQUAD RECRUITS:</span>
                <span className="text-xl font-display text-[#FFD500]">{simulatedRecruits} CADETS</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={simulatedRecruits}
                onChange={(e) => setSimulatedRecruits(Number(e.target.value))}
                className="w-full h-4 bg-[#0F0F0F] rounded-none border-2 border-white appearance-none cursor-pointer accent-[#FFD500]"
              />

              {/* Progress bar to next tier */}
              <div className="bg-[#0F0F0F] border-2 border-white p-2">
                <div className="flex justify-between text-xs font-body mb-1">
                  <span className="text-zinc-300">
                    {nextTier
                      ? `PROGRESS TO ${nextTier.name} (${simulatedRecruits}/${nextTier.recruitsNeeded})`
                      : "MAX TIER ACHIEVED // GRANDMASTER LEGEND"}
                  </span>
                  <span className="text-[#00E5FF] font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-3 border border-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-[#00E5FF] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setClaimModalOpen(true)}
                className="btn-solid inline-flex items-center gap-2 bg-[#FFD500] text-[#0F0F0F] border-[3px] border-[#0F0F0F] py-3 px-6 font-display text-base uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#00E5FF] transition-all cursor-pointer"
              >
                <Award className="w-5 h-5" />
                <span>CLAIM UNLOCKED BOUNTY</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── FOUR REWARD TIERS (CARDS) ── */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-body text-xs font-bold text-[#7B2CBF] uppercase tracking-widest border-b-2 border-[#7B2CBF] pb-1">
                02 // REWARD MATRIX
              </span>
              <h2 className="font-display text-4xl md:text-5xl uppercase text-[#0F0F0F] tracking-tight mt-2">
                TIER MILESTONES & LOOT
              </h2>
            </div>
            <p className="font-body text-xs md:text-sm text-zinc-600 max-w-md font-bold">
              Rewards compound at each stage. Every cadet you bring in unlocks higher privileges in the PUA ICPC ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => {
              const isUnlocked = simulatedRecruits >= tier.recruitsNeeded
              return (
                <div
                  key={tier.level}
                  className={`border-[3px] border-[#0F0F0F] p-6 flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? `bg-white ${tier.shadowColor} -translate-y-1`
                      : "bg-[#FFF4E0]/80 opacity-70 shadow-[4px_4px_0px_#0F0F0F]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-0.5 font-body text-xs font-bold uppercase border border-[#0F0F0F] ${tier.badgeColor}`}>
                        TIER 0{tier.level}
                      </span>
                      {isUnlocked ? (
                        <span className="bg-[#25D366] text-white px-2 py-0.5 font-body text-[10px] font-bold uppercase border border-[#0F0F0F] flex items-center gap-1">
                          <Check className="w-3 h-3" /> UNLOCKED
                        </span>
                      ) : (
                        <span className="bg-zinc-300 text-zinc-700 px-2 py-0.5 font-body text-[10px] font-bold uppercase border border-zinc-500">
                          LOCKED
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-3xl uppercase text-[#0F0F0F] mb-1">
                      {tier.name}
                    </h3>
                    <p className="font-body text-xs text-zinc-600 font-bold mb-6">
                      REQUIREMENT: {tier.recruitsNeeded}+ QUALIFIED CADETS
                    </p>

                    <div className="space-y-4">
                      {tier.perks.map((perk, i) => {
                        const Icon = perk.icon
                        return (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="p-1 bg-[#0F0F0F] text-white border border-[#0F0F0F] shrink-0 mt-0.5">
                              <Icon className="w-3.5 h-3.5 text-[#FFD500]" />
                            </div>
                            <div>
                              <h4 className="font-display text-sm uppercase text-[#0F0F0F]">
                                {perk.title}
                              </h4>
                              <p className="font-body text-xs text-zinc-600 leading-snug">
                                {perk.desc}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t-2 border-zinc-200">
                    <span className="font-body text-[11px] font-bold text-zinc-500 uppercase tracking-widest block text-center">
                      {isUnlocked ? "ELIGIBLE FOR DISPATCH" : `${tier.recruitsNeeded - simulatedRecruits} MORE NEEDED`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── FAIR PLAY & VERIFICATION PROTOCOL ── */}
        <section className="mb-20">
          <div className="bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-8 md:p-12 shadow-[8px_8px_0px_#00E5FF]">
            <div className="max-w-3xl mb-10">
              <span className="bg-[#FF0055] text-white px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-white">
                ANTI-SYBIL & VERIFICATION POLICY
              </span>
              <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tight text-white mt-3">
                HOW QUALIFICATION WORKS
              </h2>
              <p className="font-body text-xs md:text-sm text-zinc-400 mt-2 font-bold">
                To keep community rewards genuine and prevent fake email signups, every recruit must satisfy the fair-play verification protocol.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "INVITE TRANSMISSION",
                  desc: "Your peer uses your custom link or enters your referral code on the application page.",
                },
                {
                  step: "02",
                  title: "ONBOARDING COMPLETE",
                  desc: "Recruit completes the PUA ICPC registration and joins the official community Discord.",
                },
                {
                  step: "03",
                  title: "FIRST 3 SOLVES",
                  desc: "Recruit submits code and solves 3 beginner training problems on Codeforces or our sheet.",
                },
                {
                  step: "04",
                  title: "LOOT DISPATCH",
                  desc: "Your scout profile automatically registers +1 recruit XP. Claim your rewards instantly.",
                },
              ].map((s) => (
                <div key={s.step} className="bg-zinc-900 border-2 border-zinc-700 p-5 flex flex-col justify-between">
                  <div>
                    <span className="font-display text-2xl text-[#FFD500] mb-2 block">
                      STEP_{s.step}
                    </span>
                    <h3 className="font-display text-lg uppercase text-white mb-2">
                      {s.title}
                    </h3>
                    <p className="font-body text-xs text-zinc-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOUNTY BOARD (LEADERBOARD) & CTA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* LEADERBOARD (7 COLS) */}
          <section className="lg:col-span-7 bg-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#0F0F0F]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#0F0F0F]">
              <div>
                <span className="bg-[#FFD500] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
                  SEASON 2026 STANDINGS
                </span>
                <h3 className="font-display text-3xl uppercase text-[#0F0F0F] mt-1">
                  TOP SCOUTS BOUNTY BOARD
                </h3>
              </div>
              <Trophy className="w-8 h-8 text-[#FFD500]" />
            </div>

            <div className="space-y-3">
              {LEADERBOARD_SCOUTS.map((scout) => (
                <div
                  key={scout.rank}
                  className="flex items-center justify-between p-3.5 border-2 border-[#0F0F0F] bg-[#FFF4E0] hover:translate-x-1 transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 bg-[#0F0F0F] text-white font-display text-base flex items-center justify-center border border-[#0F0F0F]">
                      #{scout.rank}
                    </span>
                    <div>
                      <span className="font-body font-bold text-sm text-[#0F0F0F] block">
                        {scout.handle}
                      </span>
                      <span className={`inline-block px-1.5 py-0.2 font-body text-[10px] font-bold uppercase border border-[#0F0F0F] ${scout.badgeBg}`}>
                        {scout.tier}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-xl text-[#7B2CBF] block leading-none">
                      {scout.recruits}
                    </span>
                    <span className="font-body text-[10px] text-zinc-500 font-bold uppercase">
                      RECRUITS VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CALL TO ACTION (5 COLS) */}
          <aside className="lg:col-span-5 bg-[#FFD500] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_#0F0F0F] flex flex-col justify-between h-full">
            <div>
              <span className="bg-[#0F0F0F] text-[#FFD500] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest">
                START RECRUITING TODAY
              </span>
              <h3 className="font-display text-4xl uppercase text-[#0F0F0F] mt-3 leading-tight">
                BRING YOUR SQUAD TO THE LAB.
              </h3>
              <p className="font-body text-sm text-[#0F0F0F] font-bold mt-3 leading-relaxed">
                Competitive programming is a team discipline. The best squads are formed through peer camaraderie and mutual algorithmic accountability.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href="/join"
                className="btn-solid w-full bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-4 px-6 font-display text-lg uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all flex items-center justify-center gap-2"
              >
                <span>JOIN APPLICATION FORM</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/feedback"
                className="btn-solid w-full bg-white text-[#0F0F0F] border-[3px] border-[#0F0F0F] py-3.5 px-6 font-display text-base uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#00E5FF] transition-all flex items-center justify-center gap-2"
              >
                <span>SUGGEST A BOUNTY PERK 🪣</span>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* ── CLAIM BOUNTY MODAL ── */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]/80 p-4">
          <div className="bg-white border-[4px] border-[#0F0F0F] shadow-[12px_12px_0px_#FFD500] max-w-lg w-full p-8 relative animate-slide-in">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            {claimSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-[#25D366] text-white border-[3px] border-[#0F0F0F] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-display text-3xl uppercase text-[#0F0F0F]">
                  BOUNTY VOUCHER GENERATED!
                </h3>
                <p className="font-body text-xs md:text-sm text-zinc-600">
                  Your dispatch code <span className="font-bold text-[#7B2CBF]">{referralCode}</span> has been logged with the core team. Check Discord #bounty-dispatch or visit Lab 402 with your student ID to claim your physical loot.
                </p>
                <button
                  onClick={() => {
                    setClaimModalOpen(false)
                    setClaimSuccess(false)
                  }}
                  className="btn-solid bg-[#0F0F0F] text-white px-8 py-3 font-display uppercase tracking-wider border-2 border-[#0F0F0F] hover:bg-[#7B2CBF]"
                >
                  DISMISS
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 border-b-2 border-[#0F0F0F] pb-3">
                  <span className="font-display text-2xl uppercase text-[#0F0F0F]">
                    DISPATCH BOUNTY CLAIM
                  </span>
                  <button
                    onClick={() => setClaimModalOpen(false)}
                    className="p-1 border-2 border-[#0F0F0F] bg-[#FFF4E0] hover:bg-[#FF0055] hover:text-white font-display text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="font-body text-xs text-zinc-600 leading-relaxed">
                    Confirming bounty verification for handle <strong className="text-[#7B2CBF]">{sanitizedHandle}</strong>.
                  </p>

                  <div className="bg-[#FFF4E0] p-4 border-2 border-[#0F0F0F] space-y-2">
                    <div className="flex justify-between text-xs font-body font-bold">
                      <span>CURRENT TIER:</span>
                      <span className="text-[#7B2CBF]">{currentTier.name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-body font-bold">
                      <span>QUALIFIED CADETS:</span>
                      <span>{simulatedRecruits}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-body text-xs font-bold uppercase tracking-wider block">
                      STUDENT ID / EMAIL VERIFICATION_
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20230042@pua.edu.eg"
                      className="w-full border-2 border-[#0F0F0F] p-3 font-body text-xs bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setClaimSuccess(true)}
                  className="btn-solid w-full bg-[#7B2CBF] text-white py-3.5 font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#25D366] hover:text-[#0F0F0F] transition-all cursor-pointer"
                >
                  SUBMIT CLAIM TO LAB CORE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Marquee />
      <Footer />
    </div>
  )
}
