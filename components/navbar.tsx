"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav 
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">v0</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" className="text-white/70 hover:bg-white/5 hover:text-white">
            Sign In
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500">
            Get Started
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white/70"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div 
          className="border-t border-white/5 bg-[#0a0a0a] px-6 py-4 md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                className="text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
              <Button variant="ghost" className="w-full text-white/70 hover:bg-white/5 hover:text-white">
                Sign In
              </Button>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
