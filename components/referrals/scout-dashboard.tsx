"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw, Share2 } from "lucide-react"
import type { ScoutProfile } from "@/lib/bounty"

export function ScoutDashboard({
  scout,
  referralUrl,
  syncLoading,
  onRefresh,
  onSwitchId,
}: {
  scout: ScoutProfile
  referralUrl: string
  syncLoading: boolean
  onRefresh: () => void
  onSwitchId: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
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
            onClick={onRefresh}
            disabled={syncLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#0F0F0F] bg-[#FFF4E0] font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500] cursor-pointer"
            title="Sync live count from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
            <span>{syncLoading ? "SYNCING..." : "REFRESH"}</span>
          </button>
          <button
            onClick={onSwitchId}
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
  )
}
