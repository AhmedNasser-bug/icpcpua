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
  { href: "/resources", label: "Resources" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/recruitment", label: "Work With Us" },
]

export function PuaNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="w-full border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0] sticky top-0 z-50">
      <header className="flex items-center justify-between whitespace-nowrap px-10 py-4 max-w-[1440px] mx-auto relative">
        {/* vector nodes on header */}
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <PuaLogo size={36} className="group-hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_#0F0F0F]" />
          <h2 className="text-[#0F0F0F] text-xl font-display uppercase tracking-widest">PUA ICPC</h2>
        </Link>

        {/* Desktop nav */}
        <div className="flex flex-1 justify-end gap-10 items-center">
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-bold font-body transition-colors pb-1 border-b-[3px] ${
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

          <Link
            href="/join"
            className="btn-solid hidden md:flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid-sm bg-[#7B2CBF] text-white text-base font-display uppercase tracking-wider px-5 h-11 hover:bg-[#FF0055] transition-colors"
          >
            START TRAINING
          </Link>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#0F0F0F] border-[3px] border-[#0F0F0F] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-10 py-6 md:hidden animate-slide-in">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-bold font-body pb-1 border-b-[3px] w-fit ${
                    isActive
                      ? "text-[#7B2CBF] border-[#7B2CBF]"
                      : "text-[#0F0F0F] border-transparent"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/join"
              className="btn-solid mt-2 flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid-sm bg-[#7B2CBF] text-white text-base font-display uppercase tracking-wider px-5 h-11 w-fit"
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
