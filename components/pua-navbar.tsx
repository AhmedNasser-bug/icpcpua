"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { PuaLogo } from "./pua-logo"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events & Training" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/resources", label: "Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/recruitment", label: "Work With Us" },
  { href: "/referrals", label: "Referrals" },
  { href: "/feedback", label: "Feedback" },
]

export function PuaNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="w-full border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0] sticky top-0 z-50">
      <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-6 lg:px-8 py-3.5 max-w-[1440px] mx-auto relative">
        {/* vector nodes on header */}
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
          <PuaLogo size={34} className="group-hover:-translate-y-0.5 transition-transform shadow-[3px_3px_0px_#0F0F0F]" />
          <h2 className="text-[#0F0F0F] text-lg lg:text-xl font-display uppercase tracking-wider">PUA ICPC</h2>
        </Link>

        {/* Desktop nav */}
        <div className="flex flex-1 justify-end gap-3 lg:gap-6 xl:gap-8 items-center">
          <nav className="hidden xl:flex items-center gap-3.5 lg:gap-4.5 2xl:gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs 2xl:text-sm font-bold font-body transition-colors pb-1 border-b-[2px] ${
                    isActive
                      ? "text-[#7B2CBF] border-[#7B2CBF]"
                      : "text-[#0F0F0F] border-transparent hover:text-[#7B2CBF] hover:border-[#0F0F0F]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Medium screen collapsed menu trigger or primary links */}
          <div className="hidden md:flex xl:hidden items-center gap-3">
            {[
              { href: "/events", label: "Events" },
              { href: "/leaderboard", label: "Board" },
              { href: "/resources", label: "Resources" },
              { href: "/recruitment", label: "Recruitment" },
              { href: "/referrals", label: "Referrals" },
            ].map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold font-body transition-colors pb-0.5 border-b-2 ${
                    isActive
                      ? "text-[#7B2CBF] border-[#7B2CBF]"
                      : "text-[#0F0F0F] border-transparent hover:text-[#7B2CBF]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <Link
            href="/join"
            className="btn-solid hidden sm:inline-flex items-center justify-center border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] bg-[#7B2CBF] text-white text-xs lg:text-sm font-display uppercase tracking-wider px-3.5 lg:px-4 py-2 hover:bg-[#FF0055] transition-colors shrink-0"
          >
            START TRAINING
          </Link>

          {/* Mobile toggle */}
          <button
            className="xl:hidden text-[#0F0F0F] border-[2px] border-[#0F0F0F] p-1.5 bg-white shadow-[2px_2px_0px_#0F0F0F] cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-6 py-6 xl:hidden animate-slide-in shadow-[6px_6px_0px_#0F0F0F]">
          <div className="flex flex-col gap-3">
            <span className="font-display text-xs text-[#7B2CBF] uppercase tracking-widest pb-1 border-b border-[#0F0F0F]/20">
              NAVIGATION DIRECTORY
            </span>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs font-bold font-body p-2 border-[2px] border-[#0F0F0F] ${
                      isActive
                        ? "bg-[#7B2CBF] text-white"
                        : "bg-white text-[#0F0F0F] hover:bg-[#FFD500]"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
            <Link
              href="/join"
              className="btn-solid mt-2 flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] bg-[#7B2CBF] text-white text-sm font-display uppercase tracking-wider py-3"
              onClick={() => setMobileOpen(false)}
            >
              START TRAINING
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
