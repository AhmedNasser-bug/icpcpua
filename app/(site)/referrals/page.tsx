"use client";

import { useState, useEffect } from "react";
import {
  ScoutProfile,
  registerOrGetScout,
  getScoutByUniId,
  getTopScouts,
} from "@/lib/bounty";
import {
  readStoredScout,
  writeStoredScout,
  clearStoredScout,
} from "@/lib/bounty-storage";
import { ScoutEnrollmentCard } from "@/components/referrals/scout-enrollment-card";
import { ScoutDashboard } from "@/components/referrals/scout-dashboard";
import { ScoutLeaderboard } from "@/components/referrals/scout-leaderboard";

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
  const [origin, setOrigin] = useState("https://icpcpua.vercel.app");
  const [topScoutsList, setTopScoutsList] = useState<{ rank: number; name: string; points: number }[]>(FALLBACK_LEADERBOARD);

  // Sync latest scout recruits count from database
  const refreshScoutData = async (uniId: string) => {
    setSyncLoading(true);
    const res = await getScoutByUniId(uniId);
    if (res.scout) {
      setScout(res.scout);
      writeStoredScout(res.scout);
    }
    setSyncLoading(false);
  };

  // 1. Load active scout from localStorage on mount & detect origin & load leaderboard.
  // These updates bootstrap browser-only state once after hydration; there is no
  // external store to subscribe to, so the effect is the intended tool here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const stored = readStoredScout();
      if (stored) {
        setScout(stored);
        refreshScoutData(stored.uni_id);
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
    writeStoredScout(result.scout);

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
    clearStoredScout();
    setStatusMessage(null);
    setFormError(null);
  };

  // Active referral code & URL
  const activeReferralCode = scout ? scout.referral_code : "SCOUT-DEMO";
  const referralUrl = `${origin}/join?ref=${activeReferralCode}`;

  return (
    <div className="flex-grow flex flex-col bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F]">


      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 flex-1 w-full">
        {/* ── HERO BANNER ── */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-[#0F0F0F] text-[#FFF4E0] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest border border-[#0F0F0F]">
              {"// REFERRAL PROTOCOL 2026"}
            </span>
            <span className="bg-[#00E5FF] text-[#0F0F0F] px-3 py-1 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#0F0F0F]">
              1 RECRUIT = 1 POINT
            </span>
          </div>

          <h1
            className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.9] mb-4 text-[#0F0F0F]"
          >
            INVITE PEERS. <br />
            <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">
              COLLECT POINTS.
            </span>
          </h1>

          <p
            className="font-grotesk text-lg md:text-xl font-bold text-gray-800 max-w-2xl border-l-[4px] border-[#0F0F0F] pl-4 leading-snug"
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
              <ScoutEnrollmentCard
                fullNameInput={fullNameInput}
                uniIdInput={uniIdInput}
                onFullNameInputChange={setFullNameInput}
                onUniIdInputChange={setUniIdInput}
                formError={formError}
                statusMessage={statusMessage}
                formLoading={formLoading}
                onSubmit={handleEnrollScout}
              />
            ) : (
              /* State B: Active Profile HUD with Live Points */
              <ScoutDashboard
                scout={scout}
                referralUrl={referralUrl}
                syncLoading={syncLoading}
                onRefresh={() => refreshScoutData(scout.uni_id)}
                onSwitchId={handleLogout}
              />
            )}
          </div>
        </section>

        {/* ── POINTS LEADERBOARD (TOP SCOUTS) ── */}
        <ScoutLeaderboard entries={topScoutsList} />
      </main>
    </div>
  );
}
