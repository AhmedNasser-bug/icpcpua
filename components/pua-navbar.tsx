"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  ChevronDown,
  Calendar,
  BookOpen,
  Trophy,
  Award,
  HelpCircle,
  MessageSquare,
  Users,
  Briefcase,
  Share2,
  Sparkles,
  User,
  LogOut,
} from "lucide-react"
import { PuaLogo } from "./pua-logo"
import { useAuth } from "@/lib/auth-context"

export function PuaNavbar() {
  const { user, traineeProfile, signOutUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setMoreDropdownOpen(false)
  }, [pathname])

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false)
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => {
        document.body.style.overflow = ""
        window.removeEventListener("keydown", handleKeyDown)
      }
    } else {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const secondaryLinks = [
    { href: "/hall-of-fame", label: "Hall of Fame", desc: "Top alumni & regional champions", icon: Award },
    { href: "/resources", label: "Resources", desc: "Curated sheets, toolkits & books", icon: BookOpen },
    { href: "/faq", label: "FAQ", desc: "Answers to common student questions", icon: HelpCircle },
    { href: "/testimonials", label: "Testimonials", desc: "Success stories from alumni", icon: MessageSquare },
    { href: "/recruitment", label: "Committee Roles", desc: "Instructor, HR, Ops, Marketing & Dev specs", icon: Briefcase },
    { href: "/flyer", label: "Campus Flyer & QR", desc: "Printable +10 PTS challenge poster", icon: Sparkles },
    { href: "/referrals", label: "Referral Hub", desc: "Invite peers and collect points", icon: Share2 },
    { href: "/feedback", label: "Feedback Bucket", desc: "Voice thoughts to leadership directly", icon: Users },
  ]

  return (
    <div className="w-full border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0] sticky top-0 z-50">
      <header className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 max-w-[1440px] mx-auto relative">
        {/* Vector nodes on header */}
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
          <PuaLogo size={34} className="group-hover:-translate-y-0.5 transition-transform shadow-[3px_3px_0px_#0F0F0F]" />
          <div className="flex flex-col">
            <h2 className="text-[#0F0F0F] text-lg lg:text-xl font-display uppercase tracking-wider leading-none">
              PUA ICPC
            </h2>
            <span className="font-mono text-[9px] font-bold text-[#7B2CBF] tracking-widest uppercase mt-0.5">
              TRAINING COMMUNITY
            </span>
          </div>
        </Link>

        {/* Desktop Simplified Navigation */}
        <div className="flex flex-1 justify-end gap-3 sm:gap-5 lg:gap-7 items-center">
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            
            {/* 1. Core Portal: Training Plan */}
            <Link
              href="/#curriculum"
              className={`px-3 py-1.5 font-mono text-xs lg:text-sm font-bold uppercase transition-all border-2 ${
                pathname === "/" || pathname === "/#curriculum"
                  ? "border-[#0F0F0F] bg-white text-[#7B2CBF] shadow-[2px_2px_0px_#0F0F0F]"
                  : "border-transparent text-[#0F0F0F] hover:border-[#0F0F0F] hover:bg-white/80"
              }`}
            >
              TRAINING PLAN
            </Link>

            {/* 2. Core Portal: Events & Bootcamps */}
            <Link
              href="/events"
              className={`px-3 py-1.5 font-mono text-xs lg:text-sm font-bold uppercase transition-all border-2 flex items-center gap-1.5 ${
                pathname === "/events"
                  ? "border-[#0F0F0F] bg-[#FFD500] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]"
                  : "border-transparent text-[#0F0F0F] hover:border-[#0F0F0F] hover:bg-[#FFD500]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#0F0F0F]" />
              <span>EVENTS &amp; SESSIONS</span>
            </Link>

            {/* 3. Core Portal: Leaderboard */}
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 font-mono text-xs lg:text-sm font-bold uppercase transition-all border-2 flex items-center gap-1.5 ${
                pathname === "/leaderboard"
                  ? "border-[#0F0F0F] bg-[#00E5FF] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]"
                  : "border-transparent text-[#0F0F0F] hover:border-[#0F0F0F] hover:bg-[#00E5FF]"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#0F0F0F]" />
              <span>LEADERBOARD</span>
            </Link>

            {/* Grouped Secondary Portal: Community & Explore Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="explore-menu-btn"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`px-3 py-1.5 font-mono text-xs lg:text-sm font-bold uppercase transition-all border-2 flex items-center gap-1 cursor-pointer min-h-[36px] ${
                  moreDropdownOpen
                    ? "border-[#0F0F0F] bg-[#0F0F0F] text-white shadow-[2px_2px_0px_#7B2CBF]"
                    : "border-transparent text-neutral-700 hover:border-[#0F0F0F] hover:bg-white"
                }`}
                aria-haspopup="true"
                aria-expanded={moreDropdownOpen}
                aria-controls="explore-menu-panel"
                aria-label="Toggle explore directory menu"
              >
                <span>EXPLORE</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {/* Neo-brutalist Dropdown Menu */}
              {moreDropdownOpen && (
                <div
                  id="explore-menu-panel"
                  role="menu"
                  aria-labelledby="explore-menu-btn"
                  className="absolute right-0 mt-2 w-72 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] py-2 z-50 animate-slide-in"
                >
                  <div className="px-3 py-1.5 border-b-2 border-[#0F0F0F]/20 mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-[#7B2CBF] tracking-wider">
                      COMMUNITY HUBS &amp; ARCHIVES
                    </span>
                  </div>
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon
                    const isItemActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-start gap-2.5 px-3 py-2 transition-colors border-b border-[#0F0F0F]/10 last:border-b-0 ${
                          isItemActive ? "bg-[#FFD500]" : "hover:bg-white"
                        }`}
                      >
                        <div className="p-1 bg-white border border-[#0F0F0F] mt-0.5 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-[#0F0F0F]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs font-bold text-[#0F0F0F] uppercase">
                            {item.label}
                          </span>
                          <span className="font-body text-[11px] text-neutral-600 truncate">
                            {item.desc}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

          </nav>

          {/* Primary High-Conversion CTA / Cadet Status */}
          {user ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] bg-[#00E5FF] hover:bg-[#00c9e0] text-[#0F0F0F] text-xs font-mono font-bold uppercase px-3 py-2 transition-all"
              >
                <div className="w-5 h-5 bg-[#FFD500] border border-[#0F0F0F] rounded-full flex items-center justify-center text-[10px] font-black">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "C"}
                </div>
                <span className="truncate max-w-[100px] lg:max-w-[130px]">
                  {traineeProfile?.fullName?.split(" ")[0] || user.displayName?.split(" ")[0] || "CADET"}
                </span>
                <span className="bg-[#FFD500] px-1 border border-[#0F0F0F] text-[10px]">
                  {traineeProfile?.pointsTotal || 10}P
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOutUser()}
                title="Sign out"
                className="p-2 bg-white border-[2px] border-[#0F0F0F] hover:bg-[#FFE8EC] shadow-[2px_2px_0px_#0F0F0F] text-neutral-700 hover:text-[#FF0055] transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="btn-solid hidden sm:inline-flex items-center justify-center gap-1.5 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] bg-[#7B2CBF] text-white text-xs lg:text-sm font-display uppercase tracking-wider px-4 lg:px-5 py-2.5 hover:bg-[#FF0055] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#0F0F0F] transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD500]" />
              <span>JOIN TRAINING</span>
            </Link>
          )}

          {/* Mobile Menu Toggle (WCAG 2.5.5 minimum 44x44px touch target) */}
          <button
            id="mobile-menu-toggle"
            className="md:hidden text-[#0F0F0F] border-[2px] border-[#0F0F0F] p-2.5 min-h-[44px] min-w-[44px] bg-white shadow-[2px_2px_0px_#0F0F0F] cursor-pointer flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Streamlined Menu Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="border-t-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-4 sm:px-6 py-6 md:hidden animate-slide-in shadow-[6px_6px_0px_#0F0F0F] max-h-[calc(100vh-70px)] overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            
            {/* Primary Mobile Portals */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-[#7B2CBF] font-bold uppercase tracking-widest block mb-2">
                MAIN DESTINATIONS
              </span>
              <Link
                href="/#curriculum"
                className="flex items-center justify-between p-3.5 min-h-[48px] bg-white border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-mono text-xs font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
                onClick={() => setMobileOpen(false)}
              >
                <span>TRAINING PLAN &amp; CURRICULUM</span>
                <span className="text-neutral-400">&rarr;</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center justify-between p-3.5 min-h-[48px] bg-[#FFD500] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-mono text-xs font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>EVENTS &amp; SESSIONS</span>
                </div>
                <span className="text-[#0F0F0F]">&rarr;</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center justify-between p-3.5 min-h-[48px] bg-[#00E5FF] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-mono text-xs font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>CADET LEADERBOARD</span>
                </div>
                <span className="text-[#0F0F0F]">&rarr;</span>
              </Link>
            </div>

            {/* High-Impact CTA button */}
            {user ? (
              <div className="flex gap-2">
                <Link
                  href="/register"
                  className="flex-1 btn-solid flex items-center justify-center gap-2 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] bg-[#00E5FF] text-[#0F0F0F] text-sm font-display uppercase tracking-wider py-3.5 min-h-[48px] hover:bg-[#00c9e0]"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>MY CADET PROFILE ({traineeProfile?.pointsTotal || 10}P)</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOutUser()
                    setMobileOpen(false)
                  }}
                  className="p-3 min-h-[48px] min-w-[48px] bg-white border-[3px] border-[#0F0F0F] text-[#FF0055] flex items-center justify-center"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/register"
                className="btn-solid flex items-center justify-center gap-2 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] bg-[#7B2CBF] text-white text-sm font-display uppercase tracking-wider py-3.5 min-h-[48px] hover:bg-[#FF0055]"
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles className="w-4 h-4 text-[#FFD500]" />
                <span>JOIN TRAINING (+10 PTS)</span>
              </Link>
            )}

            {/* Grouped Secondary Links: Accessible 44px+ touch targets */}
            <div className="pt-3 border-t-2 border-[#0F0F0F]/20">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-2">
                MORE DIRECTORIES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {secondaryLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-3 min-h-[44px] bg-white/90 border-2 border-[#0F0F0F] font-mono text-xs font-bold text-[#0F0F0F] uppercase hover:bg-white flex items-center justify-between shadow-[2px_2px_0px_#0F0F0F] active:translate-x-0.5 active:translate-y-0.5"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.label}</span>
                    <span className="text-neutral-400">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
