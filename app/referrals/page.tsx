"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PuaNavbar } from "@/components/pua-navbar";
import { Footer } from "@/components/footer";
import { Marquee } from "@/components/pua-marquee";
import {
  Share2,
  Copy,
  Check,
  Users,
  Trophy,
  RefreshCw,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  ScoutProfile,
  registerOrGetScout,
  getScoutByUniId,
  getTopScouts,
} from "@/lib/bounty";

const FALLBACK_LEADERBOARD = [
  { rank: 1, name: "KHALID_ALGO", points: 14 },
  { rank: 2, name: "NOOR_BYTES", points: 8 },
  { rank: 3, name: "OMAR_CPP", points: 5 },
  { rank: 4, name: "SALMA_CODE", points: 4 },
  { rank: 5, name: "YOUSSEF_DP", points: 2 },
];

export default function ReferralRewardPage() {
  // Scout State
  const [scout, setScout] = useState<ScoutProfile | null>(null);
  const [fullNameInput, setFullNameInput] = useState("");
  const [uniIdInput, setUniIdInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Link & UI States
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://icpcpua.vercel.app");
  const [topScoutsList, setTopScoutsList] = useState<{ rank: number; name: string; points: number }[]>(FALLBACK_LEADERBOARD);

  // 1. Load active scout from localStorage on mount & detect origin & load leaderboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const cached = localStorage.getItem("pua_bounty_scout");
      if (cached) {
        try {
          const parsed: ScoutProfile = JSON.parse(cached);
          setScout(parsed);
          refreshScoutData(parsed.uni_id);
        } catch {
          localStorage.removeItem("pua_bounty_scout");
        }
      }

      // Fetch live top scouts
      getTopScouts(5).then((data) => {
        if (data && data.length > 0) {
          setTopScoutsList(
            data.map((item, idx) => ({
              rank: idx + 1,
              name: item.full_name.toUpperCase().replace(/\s+/g, "_"),
              points: item.recruits_count,
            }))
          );
        }
      });
    }
  }, []);

  // Sync latest scout recruits count from database
  const refreshScoutData = async (uniId: string) => {
    setSyncLoading(true);
    const res = await getScoutByUniId(uniId);
    if (res.scout) {
      setScout(res.scout);
      localStorage.setItem("pua_bounty_scout", JSON.stringify(res.scout));
    }
    setSyncLoading(false);
  };

  // Handle Scout Registration or Retrieval
  const handleEnrollScout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    if (!fullNameInput.trim()) {
      setFormError("Please enter your Full Name.");
      return;
    }

    if (!uniIdInput.trim()) {
      setFormError("Please enter your University ID.");
      return;
    }

    setFormLoading(true);
    const result = await registerOrGetScout(fullNameInput, uniIdInput);
    setFormLoading(false);

    if (result.error || !result.scout) {
      setFormError(result.error || "Failed to register scout.");
      return;
    }

    setScout(result.scout);
    localStorage.setItem("pua_bounty_scout", JSON.stringify(result.scout));

    if (result.isNew) {
      setStatusMessage(`REFERRAL PROFILE CREATED! Code: ${result.scout.referral_code}`);
    } else {
      setStatusMessage(`WELCOME BACK, ${result.scout.full_name}! Profile retrieved.`);
    }
  };

  const handleLogout = () => {
    setScout(null);
    setFullNameInput("");
    setUniIdInput("");
    localStorage.removeItem("pua_bounty_scout");
    setStatusMessage(null);
    setFormError(null);
  };

  // Active referral code & URL
  const activeReferralCode = scout ? scout.referral_code : "SCOUT-DEMO";
  const referralUrl = `${origin}/join?ref=${activeReferralCode}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F]">
      <PuaNavbar />

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 flex-1 w-full">
        {/* ── HERO BANNER ── */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-[#0F0F0F] text-[#FFF4E0] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
              // REFERRAL PROTOCOL 2026
            </span>
            <span className="bg-[#00E5FF] text-[#0F0F0F] px-3 py-1 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#0F0F0F]">
              1 RECRUIT = 1 POINT
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.9] mb-4 text-[#0F0F0F]"
            style={{ fontFamily: "Fredoka One, sans-serif" }}
          >
            INVITE PEERS. <br />
            <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">
              COLLECT POINTS.
            </span>
          </h1>

          <p
            className="text-lg md:text-xl font-bold text-gray-800 max-w-2xl border-l-[4px] border-[#0F0F0F] pl-4 leading-snug"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Simple, transparent referral system. Generate your personal invite link, share it with fellow university students, and collect points on the community leaderboard whenever they register.
          </p>
        </header>

        {/* ── MAIN DASHBOARD / ENROLLMENT CARD ── */}
        <section className="mb-14">
          <div className="bg-white border-[3px] border-[#0F0F0F] p-6 md:p-10 shadow-[8px_8px_0px_#0F0F0F] relative">
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]" />

            {!scout ? (
              /* State A: Simple Registration Form */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-block bg-[#FFD500] text-[#0F0F0F] px-2.5 py-1 font-mono text-xs font-black border-2 border-[#0F0F0F] uppercase">
                    STEP 01 // GENERATE YOUR CODE
                  </div>

                  <h2
                    className="text-3xl md:text-4xl font-black uppercase text-[#0F0F0F] leading-tight"
                    style={{ fontFamily: "Fredoka One, sans-serif" }}
                  >
                    GET YOUR REFERRAL LINK
                  </h2>

                  <p className="font-bold text-sm text-gray-700 leading-normal" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Enter your <strong>Full Name</strong> and <strong>University ID</strong>. If you previously enrolled, your profile and points will be loaded immediately.
                  </p>

                  {formError && (
                    <div className="bg-[#FF0055] text-white p-3 font-mono text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {statusMessage && (
                    <div className="bg-[#25D366] text-[#0F0F0F] p-3 font-mono text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleEnrollScout} className="space-y-4 pt-1">
                    <div>
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F0F0F] block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        placeholder="e.g. Ahmed Nasser"
                        className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3 font-bold text-sm text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F0F0F] block mb-1">
                        University ID (Uni ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={uniIdInput}
                        onChange={(e) => setUniIdInput(e.target.value)}
                        placeholder="e.g. 202300481"
                        className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3 font-bold text-sm text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-3.5 px-6 font-black uppercase text-base tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>{formLoading ? "CONNECTING..." : "GET MY REFERRAL LINK →"}</span>
                    </button>
                  </form>
                </div>

                {/* Right: How It Works Summary */}
                <div className="lg:col-span-5 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#7B2CBF] space-y-4">
                  <div className="flex items-center gap-2 border-b-2 border-[#0F0F0F] pb-2 font-mono text-xs font-black uppercase">
                    <Sparkles className="w-4 h-4 text-[#7B2CBF]" />
                    <span>HOW POINT COLLECTION WORKS</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
                      <span className="font-black text-[#FF0055] block mb-1">01 // YOUR CODE</span>
                      <p className="font-bold text-gray-700">Enter your name &amp; ID to generate a personal tracked dispatch link.</p>
                    </div>

                    <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
                      <span className="font-black text-[#00E5FF] block mb-1">02 // SHARE IT</span>
                      <p className="font-bold text-gray-700">Send your link or referral code to friends interested in programming.</p>
                    </div>

                    <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
                      <span className="font-black text-[#25D366] block mb-1">03 // COLLECT POINTS</span>
                      <p className="font-bold text-gray-700">Earn 1 Point for every peer who completes registration with your code.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* State B: Active Profile HUD with Live Points */
              <div className="space-y-8">
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F0F0F]">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="bg-[#25D366] text-[#0F0F0F] px-2 py-0.5 font-black border border-[#0F0F0F] uppercase">
                        ACTIVE PROFILE
                      </span>
                      <span className="font-bold text-gray-600">ID: {scout.uni_id}</span>
                    </div>
                    <h2
                      className="text-3xl md:text-4xl font-black uppercase text-[#0F0F0F] mt-1"
                      style={{ fontFamily: "Fredoka One, sans-serif" }}
                    >
                      {scout.full_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refreshScoutData(scout.uni_id)}
                      disabled={syncLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0F0F0F] bg-[#FFF4E0] font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500] cursor-pointer"
                      title="Sync live count from database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                      <span>{syncLoading ? "SYNCING..." : "REFRESH"}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0F0F0F] bg-white font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FF0055] hover:text-white cursor-pointer"
                    >
                      SWITCH ID
                    </button>
                  </div>
                </div>

                {/* Main Points & Link Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Points Counter Card */}
                  <div className="lg:col-span-5 bg-[#FFD500] border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[6px_6px_0px_#0F0F0F] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs font-black uppercase tracking-wider mb-2">
                        <span>YOUR TOTAL SCORE</span>
                        <span className="bg-[#0F0F0F] text-white px-2 py-0.5">1 RECRUIT = 1 PT</span>
                      </div>
                      <div className="flex items-baseline gap-3 my-4">
                        <span
                          className="text-7xl md:text-8xl font-black text-[#0F0F0F] leading-none"
                          style={{ fontFamily: "Fredoka One, sans-serif" }}
                        >
                          {scout.recruits_count}
                        </span>
                        <span className="font-mono text-xl font-black text-black/70">
                          POINTS
                        </span>
                      </div>
                    </div>

                    <div className="border-t-2 border-[#0F0F0F] pt-3 font-mono text-xs font-bold text-gray-900">
                      Confirmed Peer Registrations: <span className="font-black text-black">{scout.recruits_count}</span>
                    </div>
                  </div>

                  {/* Shareable Link & Code */}
                  <div className="lg:col-span-7 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[6px_6px_0px_#7B2CBF] flex flex-col justify-between space-y-4">
                    <div>
                      <span className="font-mono text-xs font-black uppercase text-gray-700 block mb-1">
                        YOUR REFERRAL CODE:
                      </span>
                      <div className="bg-[#0F0F0F] text-[#00E5FF] p-3 font-mono font-black text-2xl border-2 border-[#0F0F0F] tracking-widest select-all">
                        {scout.referral_code}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-xs font-black uppercase text-gray-700 block mb-1">
                        SHAREABLE REGISTRATION URL:
                      </span>
                      <div className="bg-white p-3 font-mono text-xs text-[#0F0F0F] border-2 border-[#0F0F0F] break-all select-all font-bold">
                        {referralUrl}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleCopy}
                        className="flex-1 bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-3 px-4 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-[#FFD500]" />
                            <span>COPIED TO CLIPBOARD!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>COPY INVITE LINK</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Join me at ICPC PUA! Level up in problem solving and algorithms with my referral link: ${referralUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#25D366] text-[#0F0F0F] border-[3px] border-[#0F0F0F] py-3 px-4 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>SHARE ON WHATSAPP</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── POINTS LEADERBOARD (TOP SCOUTS) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-8 bg-[#0F0F0F] text-white border-[3px] border-[#0F0F0F] p-6 md:p-8 shadow-[8px_8px_0px_#FFD500] relative">
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]" />
            <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]" />

            <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#FFD500]" />
                <h3
                  className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight"
                  style={{ fontFamily: "Fredoka One, sans-serif" }}
                >
                  POINTS LEADERBOARD
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#00E5FF]">TOP SQUAD SCOUTS</span>
            </div>

            <div className="space-y-3 font-mono">
              {topScoutsList.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-700 shadow-[2px_2px_0px_rgba(255,255,255,0.1)]"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-black text-lg text-[#FFD500]">0{item.rank}</span>
                    <span className="font-bold text-sm uppercase text-zinc-100">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#00E5FF] text-[#0F0F0F] font-black text-xs px-2.5 py-1 border border-black shadow-[1px_1px_0px_#FFF4E0]">
                      {item.points} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Directive / Anti-Fraud Notice */}
          <div className="lg:col-span-4 bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[6px_6px_0px_#0F0F0F] space-y-4">
            <div className="inline-block bg-[#0F0F0F] text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest">
              SYSTEM DIRECTIVE
            </div>

            <h4
              className="text-xl font-black uppercase text-[#0F0F0F]"
              style={{ fontFamily: "Fredoka One, sans-serif" }}
            >
              VERIFICATION RULES
            </h4>

            <p className="font-mono text-xs text-gray-700 leading-relaxed font-bold">
              Points are credited automatically when a new student completes the official ICPC PUA intake form with your referral code. Duplicate IDs and self-referrals are automatically filtered.
            </p>

            <Link
              href="/join"
              className="block w-full text-center bg-[#7B2CBF] text-white border-[2px] border-[#0F0F0F] py-3 px-4 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FF0055] transition-all"
            >
              OPEN CADET INTAKE PORTAL →
            </Link>
          </div>
        </section>
      </main>

      <Marquee />
      <Footer />
    </div>
  );
}
