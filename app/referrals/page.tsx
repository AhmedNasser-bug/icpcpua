"use client"

import { useState, useEffect } from "react"
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
  CheckCircle2,
  RefreshCw,
  UserCheck,
  AlertCircle
} from "lucide-react"
import {
  ScoutProfile,
  registerOrGetScout,
  getScoutByUniId,
  claimBountyReward
} from "@/lib/bounty"

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
        title: "PUA ICPC Vinyl Sticker Pack",
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
        title: "Custom Mechanical CP Keycaps",
        desc: "Custom engraved PBT mechanical keycap kit tailored for speed-coders.",
        icon: Zap,
      },
      {
        title: "Executive Team Dinner",
        desc: "Exclusive dinner with visiting tech leads, coach staff, and top alumni.",
        icon: Flame,
      },
      {
        title: "Sponsored Regional Contest Pass",
        desc: "Full entry and kit coverage for regional mock contests.",
        icon: Plane,
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
    level: 5,
    name: "LEGEND",
    recruitsNeeded: 25,
    badgeColor: "bg-[#25D366] text-[#0F0F0F]",
    accentColor: "border-[#25D366]",
    shadowColor: "shadow-[6px_6px_0px_#25D366]",
    perks: [
      {
        title: "All-Expenses Regional Finalist Kit",
        desc: "Custom hardware, flight luggage, and high-performance squad kit.",
        icon: Gift,
      },
      {
        title: "Platinum Sponsor Fast-Track Interview",
        desc: "Direct interview bypass for partner software firms across Egypt and the Gulf.",
        icon: ShieldCheck,
      },
      {
        title: "Permanent Community Honorary Seat",
        desc: "Lifetime honorary status and keynote speaker invitations.",
        icon: Trophy,
      },
    ],
  },
]

export default function ReferralRewardPage() {
  // Scout State
  const [scout, setScout] = useState<ScoutProfile | null>(null)
  const [fullNameInput, setFullNameInput] = useState("")
  const [uniIdInput, setUniIdInput] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Link & UI States
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("https://icpcpua.org")

  // Claim Modal State
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<Tier>(TIERS[0])
  const [selectedPerk, setSelectedPerk] = useState<string>(TIERS[0].perks[0].title)
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)

  // Simulation fallback for users wanting to preview beyond their current count
  const [simulatedRecruits, setSimulatedRecruits] = useState<number>(1)

  // 1. Load active scout from localStorage on mount & detect origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
      const cached = localStorage.getItem("pua_bounty_scout")
      if (cached) {
        try {
          const parsed: ScoutProfile = JSON.parse(cached)
          setScout(parsed)
          setSimulatedRecruits(parsed.recruits_count)
          // Background refresh from Supabase to sync live recruits
          refreshScoutData(parsed.uni_id)
        } catch {
          localStorage.removeItem("pua_bounty_scout")
        }
      }
    }
  }, [])

  // Sync latest scout recruits count from database
  const refreshScoutData = async (uniId: string) => {
    setSyncLoading(true)
    const res = await getScoutByUniId(uniId)
    if (res.scout) {
      setScout(res.scout)
      setSimulatedRecruits(res.scout.recruits_count)
      localStorage.setItem("pua_bounty_scout", JSON.stringify(res.scout))
    }
    setSyncLoading(false)
  }

  // Handle Scout Registration or Retrieval
  const handleEnrollScout = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setStatusMessage(null)

    if (!fullNameInput.trim()) {
      setFormError("Please enter your Full Name.")
      return
    }

    if (!uniIdInput.trim()) {
      setFormError("Please enter your University ID.")
      return
    }

    setFormLoading(true)
    const result = await registerOrGetScout(fullNameInput, uniIdInput)
    setFormLoading(false)

    if (result.error || !result.scout) {
      setFormError(result.error || "Failed to register scout.")
      return
    }

    setScout(result.scout)
    setSimulatedRecruits(result.scout.recruits_count)
    localStorage.setItem("pua_bounty_scout", JSON.stringify(result.scout))

    if (result.isNew) {
      setStatusMessage(`SCOUT PROFILE ENROLLED! Callsign: ${result.scout.referral_code}`)
    } else {
      setStatusMessage(`WELCOME BACK CADET ${result.scout.full_name}! Profile retrieved.`)
    }
  }

  const handleLogout = () => {
    setScout(null)
    setFullNameInput("")
    setUniIdInput("")
    localStorage.removeItem("pua_bounty_scout")
    setStatusMessage(null)
    setFormError(null)
  }

  // Active referral code & URL
  const activeReferralCode = scout ? scout.referral_code : "SCOUT-PREVIEW"
  const referralUrl = `${origin}/join?ref=${activeReferralCode}`

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Current tier calculation
  const effectiveRecruits = scout ? Math.max(scout.recruits_count, simulatedRecruits) : simulatedRecruits
  const currentTier =
    [...TIERS].reverse().find((t) => effectiveRecruits >= t.recruitsNeeded) || {
      level: 0,
      name: "NOVICE",
      recruitsNeeded: 0,
      badgeColor: "bg-zinc-800 text-white",
      accentColor: "border-zinc-800",
      shadowColor: "shadow-[6px_6px_0px_#0F0F0F]",
      perks: [],
    }

  const nextTier = TIERS.find((t) => t.recruitsNeeded > effectiveRecruits)
  const progressPercent = nextTier
    ? Math.min(100, Math.round((effectiveRecruits / nextTier.recruitsNeeded) * 100))
    : 100

  // Handle Claim Submission
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scout) return

    setClaimLoading(true)
    const res = await claimBountyReward(scout.id, selectedTier.name, selectedPerk)
    setClaimLoading(false)

    if (res.success) {
      setClaimSuccess(true)
      refreshScoutData(scout.uni_id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F]">
      <PuaNavbar />

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex-1 w-full">
        {/* ── HERO BANNER ── */}
        <header className="mb-14 relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#7B2CBF] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F]">
              BOUNTY_SYSTEM // PROTOCOL 2026-2027
            </span>
            <span className="bg-[#FFD500] text-[#0F0F0F] px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F]">
              COMMUNITY EXPANSION NETWORK
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
              <span>// ENROLL WITH YOUR NAME &amp; UNI ID. GENERATE YOUR TRACKED LINK. UNLOCK SQUAD HOODIES, MERCH &amp; FAANG INTERVIEWS.</span>
            </p>
          </div>
        </header>

        {/* ── 01. ENROLLMENT & SCOUT HUB ── */}
        <section className="mb-16">
          <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[8px_8px_0px_#0F0F0F] relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />

            {!scout ? (
              /* Registration Form (Name + Uni ID) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="bg-[#FFD500] text-[#0F0F0F] px-2.5 py-1 font-body text-xs font-bold border-2 border-[#0F0F0F] uppercase tracking-wider">
                    01 // SCOUT PROFILE ENROLLMENT
                  </span>
                  <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] leading-tight">
                    ACTIVATE YOUR SCOUT PROFILE
                  </h2>
                  <p className="font-body text-sm text-zinc-700 leading-relaxed font-bold">
                    Enter your <strong>Full Name</strong> and <strong>University ID (Uni ID)</strong> to synthesize your unique tracking code. If you previously registered, your live stats will be retrieved instantly.
                  </p>

                  {formError && (
                    <div className="bg-[#FF0055] text-white p-3 font-body text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {statusMessage && (
                    <div className="bg-[#25D366] text-[#0F0F0F] p-3 font-body text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleEnrollScout} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="font-body text-xs font-bold uppercase tracking-widest text-[#0F0F0F] block">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        placeholder="e.g. Ahmed Nasser"
                        className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body font-bold text-base text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white focus:border-[#7B2CBF]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-body text-xs font-bold uppercase tracking-widest text-[#0F0F0F] block">
                        University ID (Uni ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={uniIdInput}
                        onChange={(e) => setUniIdInput(e.target.value)}
                        placeholder="e.g. 202300481"
                        className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3.5 font-body font-bold text-base text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white focus:border-[#7B2CBF]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="btn-solid w-full bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-4 px-6 font-display text-lg uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>{formLoading ? "CONNECTING TO DATABASE..." : "ENROLL / RETRIEVE SCOUT LINK"}</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 flex flex-col gap-4 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#7B2CBF]">
                  <div className="flex items-center gap-2 border-b-2 border-[#0F0F0F] pb-3">
                    <Sparkles className="w-5 h-5 text-[#7B2CBF]" />
                    <span className="font-display text-lg uppercase text-[#0F0F0F]">
                      WHY ENROLL IN THE SCOUT CORPS?
                    </span>
                  </div>
                  <ul className="space-y-3 font-body text-xs md:text-sm font-bold text-zinc-800">
                    <li className="flex items-start gap-2">
                      <span className="text-[#7B2CBF] font-black">✓</span>
                      <span>Zero-friction setup — only your student name and University ID are required.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#7B2CBF] font-black">✓</span>
                      <span>Automated tracking via Supabase cloud database whenever a peer applies with your code.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#7B2CBF] font-black">✓</span>
                      <span>Instant physical loot dispatch (hoodies, keycaps, sticker packs) at Lab 402.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#7B2CBF] font-black">✓</span>
                      <span>Exclusive interview fast-tracks with partner software companies.</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Active Scout HUD */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F0F0F]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#25D366] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold border border-[#0F0F0F] uppercase">
                        ACTIVE SCOUT PROFILE
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-500">
                        UNI_ID: {scout.uni_id}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0F0F0F] mt-1">
                      CADET: {scout.full_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => refreshScoutData(scout.uni_id)}
                      disabled={syncLoading}
                      className="btn-solid inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0F0F0F] bg-[#FFF4E0] font-body text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500] cursor-pointer"
                      title="Sync live recruits from database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                      <span>{syncLoading ? "SYNCING..." : "REFRESH STATS"}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="btn-solid inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0F0F0F] bg-white font-body text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FF0055] hover:text-white cursor-pointer"
                    >
                      <span>SWITCH ID</span>
                    </button>
                  </div>
                </div>

                {statusMessage && (
                  <div className="bg-[#FFD500] border-2 border-[#0F0F0F] p-3 font-body text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F0F0F]" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Live Stats Cards */}
                  <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                    <div className="bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#0F0F0F]">
                      <span className="font-body text-xs font-bold text-zinc-600 uppercase block mb-1">
                        CONFIRMED RECRUITS
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl text-[#7B2CBF]">
                          {scout.recruits_count}
                        </span>
                        <span className="font-body text-xs font-bold text-zinc-500 uppercase">
                          CADETS
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#0F0F0F]">
                      <span className="font-body text-xs font-bold text-zinc-600 uppercase block mb-1">
                        CURRENT RANK
                      </span>
                      <span
                        className={`inline-block px-2.5 py-1 font-display text-sm uppercase border border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] ${currentTier.badgeColor}`}
                      >
                        {currentTier.name} (LVL 0{currentTier.level})
                      </span>
                      <div className="mt-3">
                        <div className="w-full bg-zinc-200 border border-[#0F0F0F] h-2.5 overflow-hidden">
                          <div
                            className="bg-[#7B2CBF] h-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 mt-1 block">
                          {nextTier
                            ? `${nextTier.recruitsNeeded - effectiveRecruits} more to ${nextTier.name}`
                            : "MAX RANK ACHIEVED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dispatch Code & Link */}
                  <div className="lg:col-span-6 flex flex-col gap-4 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#7B2CBF]">
                    <div>
                      <span className="font-body text-xs font-bold text-zinc-600 uppercase tracking-widest block mb-1">
                        YOUR TRACKED DISPATCH CODE:
                      </span>
                      <div className="bg-[#0F0F0F] text-[#00E5FF] p-3 font-body font-bold text-2xl border-2 border-[#0F0F0F] tracking-wider select-all">
                        {scout.referral_code}
                      </div>
                    </div>

                    <div>
                      <span className="font-body text-xs font-bold text-zinc-600 uppercase tracking-widest block mb-1">
                        SHAREABLE APPLICATION URL:
                      </span>
                      <div className="bg-white p-3 font-body text-xs md:text-sm text-[#0F0F0F] border-2 border-[#0F0F0F] break-all select-all font-bold">
                        {referralUrl}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleCopy}
                        className="btn-solid flex-1 bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-3.5 px-6 font-display text-base uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Join me at ICPC PUA! Crack competitive programming and master FAANG algorithms with my referral code [${scout.referral_code}] 👉 ${referralUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-solid bg-[#25D366] text-[#0F0F0F] border-[3px] border-[#0F0F0F] py-3.5 px-5 font-display text-base uppercase tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>SHARE ON WHATSAPP</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 02. REWARD ROADMAP & CLAIMING ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-20">
          <div className="lg:col-span-8 space-y-12">
            <div className="border-b-2 border-[#0F0F0F] pb-4">
              <span className="bg-[#FF0055] text-white px-2.5 py-1 font-body text-xs font-bold border-2 border-[#0F0F0F] uppercase tracking-wider">
                02 // REWARD MATRIX
              </span>
              <h3 className="font-display text-4xl uppercase text-[#0F0F0F] mt-2">
                RECRUIT TIERS &amp; UNLOCKABLE LOOT
              </h3>
              <p className="font-body text-sm text-zinc-600 font-bold mt-1">
                Every peer who registers with your dispatch code moves you up the ranks. Loot is redeemed at Lab 402 with your student ID.
              </p>
            </div>

            <div className="space-y-8">
              {TIERS.map((tier) => {
                const isUnlocked = effectiveRecruits >= tier.recruitsNeeded
                return (
                  <div
                    key={tier.level}
                    className={`bg-white border-[3px] border-[#0F0F0F] p-6 md:p-8 ${tier.shadowColor} relative transition-all`}
                  >
                    <span className="vector-node vector-node-tl" />
                    <span className="vector-node vector-node-tr" />
                    <span className="vector-node vector-node-bl" />
                    <span className="vector-node vector-node-br" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#0F0F0F]">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-display text-lg uppercase px-3 py-1 border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] ${tier.badgeColor}`}
                        >
                          TIER 0{tier.level} // {tier.name}
                        </span>
                        <span className="font-body text-xs font-bold uppercase text-zinc-600">
                          {tier.recruitsNeeded} {tier.recruitsNeeded === 1 ? "RECRUIT" : "RECRUITS"} REQUIRED
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              setSelectedTier(tier)
                              setSelectedPerk(tier.perks[0].title)
                              setClaimSuccess(false)
                              setClaimModalOpen(true)
                            }}
                            className="btn-solid inline-flex items-center gap-2 bg-[#25D366] text-[#0F0F0F] border-2 border-[#0F0F0F] px-4 py-1.5 font-display text-sm uppercase shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FFD500] cursor-pointer"
                          >
                            <Award className="w-4 h-4" />
                            <span>CLAIM PERK</span>
                          </button>
                        ) : (
                          <span className="font-body text-xs font-bold uppercase bg-zinc-100 text-zinc-500 px-3 py-1 border border-zinc-300">
                            {tier.recruitsNeeded - effectiveRecruits} MORE NEEDED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {tier.perks.map((perk, i) => {
                        const Icon = perk.icon
                        return (
                          <div
                            key={i}
                            className={`p-4 border-2 border-[#0F0F0F] flex flex-col justify-between ${
                              isUnlocked ? "bg-[#FFF4E0] shadow-[3px_3px_0px_#0F0F0F]" : "bg-zinc-50 opacity-80"
                            }`}
                          >
                            <div>
                              <div className="w-9 h-9 bg-white border-2 border-[#0F0F0F] flex items-center justify-center mb-3">
                                <Icon className="w-5 h-5 text-[#7B2CBF]" />
                              </div>
                              <h4 className="font-display text-base uppercase text-[#0F0F0F] mb-1 leading-snug">
                                {perk.title}
                              </h4>
                              <p className="font-body text-xs text-zinc-600 leading-relaxed font-semibold">
                                {perk.desc}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SIDEBAR: SCOUT LEADERBOARD & DIRECTIVES ── */}
          <aside className="lg:col-span-4 space-y-8 sticky top-24">
            <div className="bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-6 shadow-[8px_8px_0px_#FFD500] relative">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-zinc-700">
                <Trophy className="w-6 h-6 text-[#FFD500]" />
                <h3 className="font-display text-2xl uppercase tracking-tight text-white">
                  TOP SQUAD SCOUTS
                </h3>
              </div>

              <div className="space-y-3 font-body">
                {[
                  { rank: 1, handle: "KHALID_ALGO", recruits: 14, tier: "GRANDMASTER", badgeBg: "bg-[#FF0055] text-white" },
                  { rank: 2, handle: "NOOR_BYTES", recruits: 8, tier: "COMMANDER", badgeBg: "bg-[#7B2CBF] text-white" },
                  { rank: 3, handle: "OMAR_CPP", recruits: 5, tier: "VANGUARD", badgeBg: "bg-[#00E5FF] text-[#0F0F0F]" },
                  { rank: 4, handle: "SALMA_CODE", recruits: 4, tier: "VANGUARD", badgeBg: "bg-[#00E5FF] text-[#0F0F0F]" },
                  { rank: 5, handle: "YOUSSEF_DP", recruits: 2, tier: "SCOUT", badgeBg: "bg-[#FFD500] text-[#0F0F0F]" },
                ].map((s) => (
                  <div
                    key={s.rank}
                    className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base text-[#FFD500]">0{s.rank}</span>
                      <span className="font-bold text-xs uppercase text-zinc-200">{s.handle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 border border-zinc-600 ${s.badgeBg}`}>
                        {s.tier}
                      </span>
                      <span className="font-display text-sm text-[#00E5FF]">{s.recruits} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#0F0F0F]">
              <h4 className="font-display text-xl uppercase mb-3 text-[#0F0F0F]">
                DISPATCH DIRECTIVE
              </h4>
              <p className="font-body text-xs text-zinc-700 font-bold leading-relaxed mb-4">
                Recruits must be students at Pharos University Alexandria. Fake accounts or duplicate student IDs are detected and filtered by automated Polygon-grade verification.
              </p>
              <Link
                href="/join"
                className="btn-solid w-full bg-[#7B2CBF] text-white border-[2px] border-[#0F0F0F] py-3 px-4 font-display text-sm uppercase tracking-wider text-center block hover:bg-[#FF0055] transition-colors"
              >
                VIEW CADET INTAKE PORTAL →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* ── CLAIM BOUNTY MODAL ── */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]/80 p-4 animate-fade-in">
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
                <h4 className="font-display text-3xl uppercase text-[#0F0F0F]">
                  BOUNTY CLAIM LOGGED!
                </h4>
                <p className="font-body text-xs md:text-sm text-zinc-700 font-bold">
                  Claim confirmed for Scout <strong>{scout?.full_name}</strong> (ID: {scout?.uni_id}). Your request for [{selectedPerk}] has been committed to the dispatch queue.
                </p>
                <div className="bg-[#FFF4E0] border-2 border-[#0F0F0F] p-3 inline-block font-body text-xs font-bold">
                  Present your Uni ID at Lab 402 during office hours to receive physical apparel and tokens.
                </div>
                <div>
                  <button
                    onClick={() => {
                      setClaimModalOpen(false)
                      setClaimSuccess(false)
                    }}
                    className="btn-solid bg-[#0F0F0F] text-white px-8 py-3 font-display uppercase tracking-wider border-2 border-[#0F0F0F] hover:bg-[#7B2CBF] cursor-pointer"
                  >
                    CLOSE WINDOW
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="space-y-5">
                <div className="flex items-center justify-between border-b-2 border-[#0F0F0F] pb-3">
                  <span className="font-display text-2xl uppercase text-[#0F0F0F]">
                    DISPATCH BOUNTY CLAIM
                  </span>
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="p-1 border-2 border-[#0F0F0F] bg-[#FFF4E0] hover:bg-[#FF0055] hover:text-white font-display text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#FFF4E0] border-2 border-[#0F0F0F] p-4 text-xs font-bold space-y-1">
                  <div>CADET: <strong>{scout?.full_name}</strong></div>
                  <div>UNI_ID: <strong>{scout?.uni_id}</strong></div>
                  <div>DISPATCH_CODE: <strong>{scout?.referral_code}</strong></div>
                  <div>VERIFIED RECRUITS: <strong>{scout?.recruits_count}</strong></div>
                </div>

                <div className="space-y-1">
                  <label className="font-body text-xs font-bold uppercase tracking-wider block">
                    Target Perk / Reward:
                  </label>
                  <select
                    value={selectedPerk}
                    onChange={(e) => setSelectedPerk(e.target.value)}
                    className="w-full border-[3px] border-[#0F0F0F] bg-white p-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF] cursor-pointer"
                  >
                    {selectedTier.perks.map((p, idx) => (
                      <option key={idx} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={claimLoading}
                  className="btn-solid w-full bg-[#7B2CBF] text-white py-3.5 font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#25D366] hover:text-[#0F0F0F] transition-all cursor-pointer disabled:opacity-50"
                >
                  {claimLoading ? "DISPATCHING CLAIM..." : "SUBMIT CLAIM TO LAB CORE"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Marquee />
      <Footer />
    </div>
  )
}
