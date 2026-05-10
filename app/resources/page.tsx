"use client"

import { useState, useMemo } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

type Category = "All Sheets" | "Algorithms" | "Platforms" | "Bootcamps"

interface Resource {
  title: string
  description: string
  category: Omit<Category, "All Sheets">
  tag: string
  bg: string
  url: string
  icon: React.ReactNode
}

function BookIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function GraphIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  )
}

function MathIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.255 3A23.933 23.933 0 0121 12c0 3.183-.62 6.22-1.745 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.205a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09" />
    </svg>
  )
}

function PlatformIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function SumIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const RESOURCES: Resource[] = [
  {
    title: "ASSIUT UNIVERSITY TRAINING SHEET",
    description: "The legendary starting point. Master C++ syntax, loops, arrays, and basic problem solving fundamentals.",
    category: "Algorithms",
    tag: "BEGINNER",
    bg: "#FFD500",
    url: "https://codeforces.com/group/MWSDmqGsZm/contests",
    icon: <BookIcon />,
  },
  {
    title: "GRAPH THEORY 101",
    description: "Master BFS, DFS, Dijkstra, and minimum spanning trees. Essential concepts for any serious competitive programmer.",
    category: "Algorithms",
    tag: "ADVANCED",
    bg: "#00E5FF",
    url: "#",
    icon: <GraphIcon />,
  },
  {
    title: "LEETCODE GRINDER",
    description: "Focus on specific topics. Good for interview prep and solidifying data structure understanding.",
    category: "Platforms",
    tag: "PRACTICE",
    bg: "#FF0055",
    url: "https://leetcode.com",
    icon: <CodeIcon />,
  },
  {
    title: "CODEFORCES",
    description: "The main arena. Participate in Div. 2 and Div. 3 rounds to boost your rating and test skills under pressure.",
    category: "Platforms",
    tag: "PLATFORM",
    bg: "#FFF4E0",
    url: "https://codeforces.com",
    icon: <PlatformIcon />,
  },
  {
    title: "NUMBER THEORY BASICS",
    description: "Sieve of Eratosthenes, GCD, LCM, and modular arithmetic. You won&apos;t survive without these.",
    category: "Algorithms",
    tag: "MATH",
    bg: "#FFD500",
    url: "#",
    icon: <SumIcon />,
  },
  {
    title: "DYNAMIC PROGRAMMING MASTERCLASS",
    description: "From 0/1 Knapsack to interval DP. Step-by-step guide covering classical DP patterns with practice problems.",
    category: "Bootcamps",
    tag: "INTERMEDIATE",
    bg: "#7B2CBF",
    url: "#",
    icon: <MathIcon />,
  },
  {
    title: "STRING ALGORITHMS",
    description: "KMP, Z-function, suffix arrays, and Aho-Corasick. The string toolkit for IOI and ICPC problems.",
    category: "Algorithms",
    tag: "ADVANCED",
    bg: "#00E5FF",
    url: "#",
    icon: <CodeIcon />,
  },
  {
    title: "HACKERRANK",
    description: "Great for practice challenges and warm-up contests. Start with 30 Days of Code for foundational practice.",
    category: "Platforms",
    tag: "PLATFORM",
    bg: "#FFD500",
    url: "https://hackerrank.com",
    icon: <PlatformIcon />,
  },
  {
    title: "ICPC BOOTCAMP MATERIALS",
    description: "Official PUA ICPC internal sheets and slides from past bootcamp sessions. Covers all competitive programming domains.",
    category: "Bootcamps",
    tag: "OFFICIAL",
    bg: "#FF0055",
    url: "#",
    icon: <BookIcon />,
  },
]

const CATEGORIES: Category[] = ["All Sheets", "Algorithms", "Platforms", "Bootcamps"]

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All Sheets")

  const filtered = activeCategory === "All Sheets"
    ? RESOURCES
    : RESOURCES.filter((r) => r.category === activeCategory)

  const categoryGroups = activeCategory === "All Sheets"
    ? (["Algorithms", "Platforms", "Bootcamps"] as const)
    : ([activeCategory] as const)

  const groupedResources = useMemo(() => {
    return filtered.reduce((acc, resource) => {
      if (!acc[resource.category]) {
        acc[resource.category] = []
      }
      acc[resource.category].push(resource)
      return acc
    }, {} as Record<string, Resource[]>)
  }, [filtered])

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-10 py-12">
        {/* Page Header */}
        <div className="text-center mb-4">
          <h1 className="font-display text-[56px] lg:text-[72px] leading-[0.9] uppercase text-shadow-cyan">
            TRAINING<br />ARMORY
          </h1>
        </div>
        <div className="flex justify-center mb-8">
          <p className="font-body text-base max-w-xl text-center bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid-sm px-6 py-3 relative">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-br" />
            Master the algorithms. Dominate the leaderboards. The tools of destruction are here.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`filter-pill shadow-solid-sm ${
                activeCategory === cat
                  ? "bg-[#7B2CBF] text-white border-[#7B2CBF] shadow-none translate-x-[4px] translate-y-[4px]"
                  : "bg-[#FFF4E0] text-[#0F0F0F] border-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Resource grid by category */}
        {categoryGroups.map((group) => {
          const groupResources = groupedResources[group] || []
          if (groupResources.length === 0) return null
          return (
            <div key={group} className="mb-12">
              {/* Category header with vector nodes */}
              <div className="relative inline-flex items-center gap-3 mb-6">
                <span className="w-4 h-4 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] flex-shrink-0" />
                <h2 className="font-display text-3xl uppercase text-[#0F0F0F]">{group.toUpperCase()}</h2>
                <span className="w-4 h-4 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] flex-shrink-0" />
                <div className="ml-2 flex-1 border-b-[3px] border-dashed border-[#0F0F0F] min-w-[60px]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupResources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-card border-[3px] border-[#0F0F0F] shadow-solid p-6 flex flex-col gap-3 relative"
                    style={{ backgroundColor: resource.bg }}
                  >
                    <span className="vector-node vector-node-tl" />
                    <span className="vector-node vector-node-br" />

                    {/* Icon + tag */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-white border-[3px] border-[#0F0F0F] flex items-center justify-center text-[#0F0F0F]">
                        {resource.icon}
                      </div>
                      <span className={`font-body text-[10px] font-bold uppercase px-2 py-1 border-[2px] border-[#0F0F0F] ${
                        resource.bg === "#FF0055" ? "bg-white text-[#0F0F0F]" : resource.bg === "#7B2CBF" ? "bg-[#FFD500] text-[#0F0F0F]" : "bg-[#7B2CBF] text-white"
                      }`}>
                        {resource.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-display text-xl uppercase leading-tight ${resource.bg === "#FF0055" || resource.bg === "#7B2CBF" ? "text-white" : "text-[#0F0F0F]"}`}>
                      {resource.title}
                    </h3>

                    {/* Description */}
                    <p className={`font-body text-xs leading-relaxed flex-1 ${resource.bg === "#FF0055" || resource.bg === "#7B2CBF" ? "text-white/90" : "text-[#0F0F0F]"}`}>
                      {resource.description}
                    </p>

                    {/* Arrow CTA */}
                    <div className={`flex justify-end mt-2 font-display text-2xl font-bold ${resource.bg === "#FF0055" || resource.bg === "#7B2CBF" ? "text-white" : "text-[#0F0F0F]"}`}>
                      -&gt;
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </main>

      <Marquee />
    </div>
  )
}
