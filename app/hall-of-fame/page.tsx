"use client"

import { useState, useRef } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

interface TeamMember {
  name: string
  role: string
}

interface HallTeam {
  id: number
  teamName: string
  year: string
  contest: string
  rank: string
  tilt: number
  members: TeamMember[]
  story: string
  imgPlaceholder: string
  imgColor: string
}

const TEAMS: HallTeam[] = [
  {
    id: 1,
    teamName: "PUA_Knights",
    year: "2023",
    contest: "ACPC",
    rank: "Top 20 Regionals",
    tilt: -2,
    imgPlaceholder: "PK",
    imgColor: "#7B2CBF",
    members: [
      { name: "Ahmed Khalid", role: "Team Lead" },
      { name: "Sara Mostafa", role: "Algorithm Specialist" },
      { name: "Omar Hassan", role: "Implementation" },
    ],
    story: "PUA_Knights shocked everyone by qualifying in their first-ever ACPC attempt. They solved 6 out of 11 problems in a fierce 5-hour session and secured a top-20 finish among 80+ university teams across Egypt and Africa.",
  },
  {
    id: 2,
    teamName: "PUA_Infinity",
    year: "2022",
    contest: "ACPC",
    rank: "Top 15 Regionals",
    tilt: 3,
    imgPlaceholder: "PI",
    imgColor: "#FF0055",
    members: [
      { name: "Karim Adel", role: "Graph Wizard" },
      { name: "Nour Tarek", role: "DP Master" },
      { name: "Youssef Ali", role: "Number Theory" },
    ],
    story: "PUA_Infinity set the bar for what PUA students could achieve. Their performance at ACPC 2022 placed them among the top 15 teams, with a legendary comeback solve in the final 20 minutes on a graph problem that stumped everyone else.",
  },
  {
    id: 3,
    teamName: "PUA_Coders",
    year: "2021",
    contest: "ECPC",
    rank: "National Qualifier",
    tilt: -1,
    imgPlaceholder: "PC",
    imgColor: "#FFD500",
    members: [
      { name: "Mahmoud Samir", role: "Segment Trees" },
      { name: "Aya Farouk", role: "Strings" },
      { name: "Hassan Nabil", role: "Geometry" },
    ],
    story: "PUA_Coders were the pioneers. The first-ever PUA team to qualify for ECPC nationals. They trained for 8 months straight, attending every session and solving over 2000 problems combined before the contest.",
  },
  {
    id: 4,
    teamName: "PUA_Sigma",
    year: "2020",
    contest: "ACPC",
    rank: "Top 30 Regionals",
    tilt: 2,
    imgPlaceholder: "PS",
    imgColor: "#00E5FF",
    members: [
      { name: "Ali Ramadan", role: "Data Structures" },
      { name: "Mariam Adel", role: "Math & Combinatorics" },
      { name: "Tarek Saeed", role: "System Design" },
    ],
    story: "PUA_Sigma competed virtually during COVID-19 and still managed to rank top 30 in the region. Their mental fortitude and preparation during the lockdown was unmatched.",
  },
  {
    id: 5,
    teamName: "PUA_Legends",
    year: "2019",
    contest: "ACPC",
    rank: "Top 25 Regionals",
    tilt: -3,
    imgPlaceholder: "PL",
    imgColor: "#7B2CBF",
    members: [
      { name: "Sherif Magdy", role: "Competitive Lead" },
      { name: "Dina Waheed", role: "Problem Setter" },
      { name: "Amr Fouad", role: "Optimization" },
    ],
    story: "PUA_Legends were the team that put Pharos University on the competitive programming map. Their consistent performance across regional contests inspired hundreds of students to join the ICPC community.",
  },
]

function TeamModal({ team, onClose }: { team: HallTeam; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F0F0F]/70 p-4">
      <div className="relative bg-[#FFF4E0] border-[3px] border-[#0F0F0F] shadow-solid max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-slide-in">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="font-body text-xs font-bold uppercase bg-[#7B2CBF] text-white px-3 py-1 border-[2px] border-[#0F0F0F]">
              {team.contest} {team.year}
            </span>
            <h3 className="font-display text-3xl uppercase mt-2 text-[#0F0F0F] text-shadow-cyan">{team.teamName}</h3>
            <p className="font-body text-sm font-bold mt-1 text-[#7B2CBF]">{team.rank}</p>
          </div>
          <button
            onClick={onClose}
            className="border-[3px] border-[#0F0F0F] p-1 bg-white hover:bg-[#FF0055] hover:text-white transition-colors ml-4 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Members */}
        <div className="bg-[#FFD500] border-[3px] border-[#0F0F0F] p-4 mb-4">
          <h4 className="font-body text-xs font-bold uppercase mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#7B2CBF] border-[2px] border-[#0F0F0F]" />
            TEAM MEMBERS
          </h4>
          <div className="flex flex-col gap-2">
            {team.members.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border-[2px] border-[#0F0F0F] px-3 py-2">
                <div className="w-8 h-8 bg-[#7B2CBF] border-[2px] border-[#0F0F0F] flex items-center justify-center font-display text-white text-sm">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-body text-xs font-bold">{m.name}</p>
                  <p className="font-body text-[10px] text-[#7B2CBF] uppercase">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="border-[3px] border-[#0F0F0F] bg-white p-4">
          <h4 className="font-body text-xs font-bold uppercase mb-2">THE STORY</h4>
          <p className="font-body text-sm leading-relaxed">{team.story}</p>
        </div>
      </div>
    </div>
  )
}

export default function HallOfFamePage() {
  const [selectedTeam, setSelectedTeam] = useState<HallTeam | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault()
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      {selectedTeam && <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}

      <main className="flex-grow w-full">
        {/* Giant title */}
        <div className="px-10 pt-12 pb-6">
          <h1
            className="font-display uppercase text-[#0F0F0F] leading-none text-shadow-cyan select-none"
            style={{ fontSize: "clamp(64px, 18vw, 200px)" }}
          >
            LEGENDS.
          </h1>
          <p className="font-body text-sm font-bold uppercase mt-2 bg-white border-[3px] border-[#0F0F0F] shadow-solid-sm px-4 py-2 inline-block relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-br" />
            The PUA ICPC teams who made it to ACPC &amp; ICPC Regionals.
          </p>
        </div>

        {/* Horizontal scroll polaroid gallery */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="w-full overflow-x-auto overflow-y-hidden pb-12 px-10 pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-10 items-end" style={{ width: "max-content", minHeight: "520px" }}>
            {TEAMS.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="polaroid-card flex-shrink-0 w-[360px] bg-white border-[4px] border-[#0F0F0F] shadow-solid flex flex-col text-left"
                style={{ transform: `rotate(${team.tilt}deg)` }}
              >
                {/* Photo area */}
                <div
                  className="w-full h-[300px] border-b-[3px] border-[#0F0F0F] relative overflow-hidden duotone-img flex items-center justify-center"
                  style={{ backgroundColor: team.imgColor }}
                >
                  {/* Stipple overlay */}
                  <div className="absolute inset-0 stipple-bg opacity-30" />
                  {/* Large initials */}
                  <span className="relative z-10 font-display text-[100px] text-white/30 select-none leading-none">
                    {team.imgPlaceholder}
                  </span>
                  {/* Vector corner nodes */}
                  <span className="vector-node vector-node-tl" />
                  <span className="vector-node vector-node-tr" />
                  <span className="vector-node vector-node-bl" />
                  <span className="vector-node vector-node-br" />
                  {/* Year badge */}
                  <div className="absolute top-4 right-4 bg-[#FFD500] border-[3px] border-[#0F0F0F] px-3 py-1 font-display text-lg">
                    {team.year}
                  </div>
                </div>

                {/* Caption area */}
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-display text-2xl uppercase text-[#0F0F0F]">{team.teamName}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs font-bold uppercase bg-[#7B2CBF] text-white px-3 py-1 border-[2px] border-[#0F0F0F]">
                      {team.contest}
                    </span>
                    <span className="font-body text-xs font-bold text-[#0F0F0F] uppercase">
                      {team.rank}
                    </span>
                  </div>
                  <p className="font-body text-xs text-[#0F0F0F]/70 mt-1 line-clamp-2">
                    {team.story}
                  </p>
                  <div className="flex justify-end mt-1">
                    <span className="font-body text-[10px] font-bold uppercase border-[2px] border-[#0F0F0F] px-2 py-1 bg-[#FFF4E0] hover:bg-[#7B2CBF] hover:text-white transition-colors">
                      VIEW STORY -&gt;
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {/* End of scroll CTA */}
            <div className="flex-shrink-0 w-[300px] h-[460px] border-[3px] border-[#0F0F0F] shadow-solid bg-[#FFD500] flex flex-col items-center justify-center gap-4 p-8 relative self-center">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />
              <p className="font-display text-3xl uppercase text-center text-[#0F0F0F]">
                YOUR TEAM NEXT?
              </p>
              <p className="font-body text-sm text-center text-[#0F0F0F]">
                Join PUA ICPC and write your own legend.
              </p>
              <a
                href="/"
                className="btn-solid bg-[#7B2CBF] text-white font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid px-6 py-3"
              >
                JOIN NOW
              </a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center pb-6">
          <p className="font-body text-xs font-bold uppercase text-[#0F0F0F]/50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            SCROLL TO EXPLORE
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </p>
        </div>
      </main>

      <Marquee />
    </div>
  )
}
