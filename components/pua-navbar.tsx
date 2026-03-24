"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events & Training" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/resources", label: "Resources" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
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
          <div className="size-9 bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid-sm flex items-center justify-center group-hover:-translate-y-1 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_nav)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd" />
              </g>
              <defs>
                <clipPath id="clip0_nav"><rect fill="white" height="48" width="48" /></clipPath>
              </defs>
            </svg>
          </div>
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
            href="/"
            className="btn-solid hidden md:flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid-sm bg-[#7B2CBF] text-white text-base font-display uppercase tracking-wider px-5 h-11 hover:bg-[#FF0055] transition-colors"
          >
            JOIN THE SQUAD
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
              href="/"
              className="btn-solid mt-2 flex items-center justify-center border-[3px] border-[#0F0F0F] shadow-solid-sm bg-[#7B2CBF] text-white text-base font-display uppercase tracking-wider px-5 h-11 w-fit"
              onClick={() => setMobileOpen(false)}
            >
              JOIN THE SQUAD
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
