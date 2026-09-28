"use client"

import React, { useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Sparkles, Zap, Compass, Copy, Check, ArrowRight } from "lucide-react"

interface HeroSectionProps {
  onOpenModal: () => void
}

export function HeroSection({ onOpenModal }: HeroSectionProps) {
  const [beaconPowered, setBeaconPowered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [doorMessage, setDoorMessage] = useState(false)

  // 3D Tilt calculation for the Emblem card
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 250, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 250, damping: 25 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      {/* ============================================================
          MAIN BILLBOARD CANVAS (Exact match to uploaded design)
          - Dotted grid cream background
          - 4px solid black border
          - 12px solid black block shadow
          ============================================================ */}
      <div 
        className="w-full relative border-[4px] border-[#0F0F0F] rounded-2xl sm:rounded-3xl bg-[#FFF4E0] shadow-[8px_8px_0px_#0F0F0F] sm:shadow-[14px_14px_0px_#0F0F0F] p-6 sm:p-10 lg:p-12 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(#0F0F0F 1.4px, transparent 1.4px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* Subtle decorative edge nodes */}
        <div className="absolute top-2 left-2 w-3 h-3 bg-white border-2 border-black z-20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 bg-white border-2 border-black z-20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-white border-2 border-black z-20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-white border-2 border-black z-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 relative z-10">

          {/* ==========================================================
              LEFT COLUMN: THE "EMBLEM" SHOWCASE CARD
              ========================================================== */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            className="w-full max-w-[420px] sm:max-w-[440px] aspect-square flex-shrink-0 relative select-none"
          >
            {/* The Emblem Card */}
            <div className="w-full h-full bg-[#FFD500] border-[4px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] flex flex-col justify-between p-4 relative overflow-hidden group">
              
              {/* Corner vector node squares */}
              <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0F0F0F] z-30" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0F0F0F] z-30" />

              {/* Card Top Bar */}
              <div className="flex items-center justify-between border-b-[3px] border-[#0F0F0F] pb-2 px-1 relative z-20">
                <span className="font-display text-sm tracking-widest text-[#0F0F0F] uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7B2CBF] inline-block animate-pulse" />
                  EMBLEM
                </span>
                <span className="font-body text-xs font-bold tracking-wider text-[#0F0F0F] bg-white px-2 py-0.5 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]">
                  EST. 2027
                </span>
              </div>

              {/* Graphic Stage: Lighthouse + Rays + Floating Accents */}
              <div className="relative flex-grow flex items-center justify-center my-2 overflow-hidden">
                
                {/* Comic Rays SVG */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={{
                    opacity: beaconPowered ? [0.9, 1, 0.85, 1] : 0.9,
                    scale: beaconPowered ? [1, 1.03, 1] : 1,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 360 300">
                    {/* Cyan Beams */}
                    <path d="M 180 120 L -30 20" fill="none" stroke="#00FFFF" strokeLinecap="round" strokeWidth="22" opacity="0.85" />
                    <path d="M 180 120 L 390 20" fill="none" stroke="#00FFFF" strokeLinecap="round" strokeWidth="22" opacity="0.85" />
                    
                    {/* Yellow Beams */}
                    <path d="M 180 120 L -30 120" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="18" opacity="0.95" />
                    <path d="M 180 120 L 390 120" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="18" opacity="0.95" />
                    <path d="M 180 120 L 80 -40" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="24" opacity="0.95" />
                    <path d="M 180 120 L 280 -40" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="24" opacity="0.95" />
                    
                    {/* Black Outlines */}
                    <path d="M 180 120 L -30 20" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 180 120 L 390 20" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 180 120 L -30 120" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 180 120 L 390 120" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 180 120 L 80 -40" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                    <path d="M 180 120 L 280 -40" fill="none" stroke="#0F0F0F" strokeLinecap="round" strokeWidth="3.5" />
                  </svg>
                </motion.div>

                {/* Floating Algorithmic Nodes */}
                {/* Upper Left Cube */}
                <motion.div 
                  animate={{ y: [-3, 3, -3], rotate: [12, 18, 12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-[18%] left-[10%] w-6 h-6 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] z-20 cursor-pointer"
                  title="Algorithm Node"
                />

                {/* Upper Right Diamond Node */}
                <motion.div 
                  animate={{ y: [3, -3, 3], rotate: [45, 55, 45] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-[14%] right-[12%] w-6 h-6 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] z-20 cursor-pointer"
                />

                {/* Lower Right Cube */}
                <motion.div 
                  animate={{ y: [-4, 2, -4], rotate: [-6, 0, -6] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-[16%] right-[10%] w-7 h-7 bg-[#7B2CBF] border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] z-20"
                />

                {/* Left Curly Brace */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute bottom-[22%] left-[12%] text-[#0F0F0F] text-5xl sm:text-6xl font-bold font-mono opacity-90 select-none z-20"
                  style={{ textShadow: "-2px 2px 0px #FFF" }}
                >
                  &#123;
                </motion.div>

                {/* Right Curly Brace */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute top-[26%] right-[18%] text-[#0F0F0F] text-5xl sm:text-6xl font-bold font-mono opacity-90 select-none z-20"
                  style={{ textShadow: "2px 2px 0px #00FFFF" }}
                >
                  &#125;
                </motion.div>

                {/* The Lighthouse Tower Structure */}
                <div className="relative z-10 w-40 h-64 flex flex-col items-center justify-end scale-[0.92] translate-y-1">
                  
                  {/* Glowing Lantern Bulb (Interactive Beacon) */}
                  <motion.div 
                    onClick={() => setBeaconPowered(!beaconPowered)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 bg-[#FFD500] border-[4px] border-[#0F0F0F] rounded-full absolute top-1 z-20 flex items-center justify-center cursor-pointer shadow-[-4px_4px_0px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_20px_#FFD500]"
                    title="Click to toggle Beacon Light!"
                  >
                    <div className="w-10 h-10 bg-white rounded-full opacity-60 mix-blend-overlay" />
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-3 left-3" />
                    {beaconPowered && (
                      <span className="absolute -top-6 bg-black text-[#00FFFF] text-[10px] font-mono px-2 py-0.5 rounded border border-[#00FFFF] whitespace-nowrap animate-bounce">
                        BEACON ON!
                      </span>
                    )}
                  </motion.div>

                  {/* Gallery Deck */}
                  <div className="w-28 h-5 bg-[#7B2CBF] border-[3.5px] border-[#0F0F0F] absolute top-16 z-10 rounded-sm shadow-[-2px_2px_0px_rgba(0,0,0,0.3)]" />

                  {/* Tower Body with Halftone Texture */}
                  <div 
                    className="w-28 h-48 bg-[#7B2CBF] border-[3.5px] border-[#0F0F0F] border-t-0 flex flex-col relative overflow-hidden" 
                    style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }}
                  >
                    {/* SVG Halftone Pattern */}
                    <svg className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" height="100%" width="100%">
                      <defs>
                        <pattern height="8" id="stipple-hero-box" patternUnits="userSpaceOnUse" width="8">
                          <circle cx="2" cy="2" fill="#0F0F0F" r="1.5" />
                          <circle cx="6" cy="6" fill="#0F0F0F" r="1" />
                        </pattern>
                      </defs>
                      <rect fill="url(#stipple-hero-box)" height="100%" width="50%" x="0" y="0" />
                    </svg>

                    {/* White Horizontal Bands */}
                    <div className="w-full h-7 bg-[#FFF4E0] border-y-[3.5px] border-[#0F0F0F] mt-7" />
                    <div className="w-full h-7 bg-[#FFF4E0] border-y-[3.5px] border-[#0F0F0F] mt-9" />

                    {/* Arched Doorway (Interactive Easter Egg) */}
                    <motion.div 
                      onClick={() => setDoorMessage(!doorMessage)}
                      whileHover={{ scale: 1.1 }}
                      className="w-9 h-14 bg-[#0F0F0F] border-[3px] border-[#0F0F0F] absolute bottom-0 left-1/2 transform -translate-x-1/2 rounded-t-full cursor-pointer"
                      title="Inspect the secret door"
                    />
                  </div>

                  {/* Foundation Base */}
                  <div className="w-36 h-7 bg-[#7B2CBF] border-[3.5px] border-[#0F0F0F] rounded-md relative shadow-[-4px_4px_0px_#0F0F0F]" />
                </div>

                {/* Secret Door Easter Egg Tooltip */}
                {doorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-16 bg-[#0F0F0F] text-[#00FFFF] border-2 border-white px-3 py-1 font-mono text-xs z-40 rounded shadow-solid-sm"
                  >
                    &gt; while(alive) {`{ code(); }`}
                  </motion.div>
                )}
              </div>

              {/* Card Bottom Pill Tag: PHAROS LIGHTHOUSE */}
              <div className="w-full flex justify-center pt-1 relative z-20">
                <motion.div 
                  whileHover={{ y: -2, boxShadow: "4px 4px 0px #0F0F0F" }}
                  className="w-full bg-white border-[3px] border-[#0F0F0F] py-1 px-3 text-center shadow-[2px_2px_0px_#0F0F0F] transition-all"
                >
                  <span className="font-display text-xs sm:text-sm font-bold tracking-wider text-[#0F0F0F] uppercase">
                    PHAROS LIGHTHOUSE
                  </span>
                </motion.div>
              </div>

            </div>
          </motion.div>

          {/* ==========================================================
              RIGHT COLUMN: TYPOGRAPHY, BADGES & INTERACTIVE CONTROLS
              ========================================================== */}
          <div className="w-full flex flex-col items-start gap-5 sm:gap-6 flex-grow">
            
            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center gap-3 select-none">
              {/* Badge 1: OFFICIAL COMMUNITY LOGO */}
              <motion.div 
                whileHover={{ y: -3, x: -1 }}
                whileTap={{ y: 1, x: 1 }}
                className="bg-[#0F0F0F] border-[3px] border-[#0F0F0F] px-3.5 py-1 shadow-[3px_3px_0px_#FFD500] flex items-center gap-2 cursor-pointer"
                onClick={handleCopyLink}
              >
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#00FFFF] uppercase">
                  OFFICIAL COMMUNITY LOGO
                </span>
                {copied ? <Check className="w-3.5 h-3.5 text-[#00FFFF]" /> : <Copy className="w-3.5 h-3.5 text-[#00FFFF] opacity-70" />}
              </motion.div>

              {/* Badge 2: TECH CORPS */}
              <motion.div 
                whileHover={{ y: -3, x: -1 }}
                whileTap={{ y: 1, x: 1 }}
                className="bg-[#FF0055] border-[3px] border-[#0F0F0F] px-4 py-1 shadow-[3px_3px_0px_#0F0F0F] cursor-pointer"
              >
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  TECH CORPS
                </span>
              </motion.div>
            </div>

            {/* Main Massive Headline: ICPC */}
            <div className="relative group select-none">
              <motion.h1 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="font-display text-[84px] sm:text-[104px] lg:text-[124px] text-[#7B2CBF] leading-[0.88] tracking-tight cursor-default"
                style={{
                  textShadow: "6px 6px 0px #00FFFF, 10px 10px 0px #0F0F0F",
                }}
              >
                ICPC
              </motion.h1>
            </div>

            {/* Secondary Banner: PHAROS UNIVERSITY */}
            <motion.div 
              whileHover={{ x: 2, y: -2, boxShadow: "8px 8px 0px #0F0F0F" }}
              whileTap={{ x: 0, y: 0, boxShadow: "3px 3px 0px #0F0F0F" }}
              className="w-full bg-[#FFD500] border-[4px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] px-5 sm:px-7 py-3 sm:py-4 transition-all select-none"
            >
              <h2 className="font-display text-[26px] sm:text-[38px] lg:text-[46px] text-[#0F0F0F] tracking-wide uppercase leading-none">
                PHAROS UNIVERSITY
              </h2>
            </motion.div>

            {/* Bottom Badges Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 select-none">
              {/* Badge: ALEXANDRIA • EGYPT */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white border-[3px] border-[#0F0F0F] px-4 py-1.5 shadow-[3px_3px_0px_#0F0F0F]"
              >
                <span className="font-mono text-xs sm:text-sm font-bold text-[#0F0F0F] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[#7B2CBF]" />
                  ALEXANDRIA • EGYPT
                </span>
              </motion.div>

              {/* Badge: PROBLEM SOLVING SQUAD */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-[#00E5FF] border-[3px] border-[#0F0F0F] px-4 py-1.5 shadow-[3px_3px_0px_#0F0F0F]"
              >
                <span className="font-mono text-xs sm:text-sm font-bold text-[#0F0F0F] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F0F0F]" />
                  PROBLEM SOLVING SQUAD
                </span>
              </motion.div>
            </div>

            {/* Interactive Action Bar: Call to Action + Beacon Toggle */}
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t-[3px] border-[#0F0F0F]/20 mt-2">
              {/* Primary Join Button */}
              <motion.button
                onClick={onOpenModal}
                whileHover={{ scale: 1.02, y: -2, boxShadow: "8px 8px 0px #0F0F0F" }}
                whileTap={{ scale: 0.98, y: 2, boxShadow: "2px 2px 0px #0F0F0F" }}
                className="flex-grow sm:flex-grow-0 btn-solid flex items-center justify-center gap-3 px-8 py-4 bg-[#7B2CBF] text-white border-[3.5px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] font-display text-xl sm:text-2xl uppercase tracking-widest relative overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  JOIN THE SQUAD
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-[#FF0055] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
              </motion.button>

              {/* Beacon Light Switch Toggle Button */}
              <motion.button
                type="button"
                onClick={() => setBeaconPowered(!beaconPowered)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 2 }}
                className={`px-5 py-4 border-[3px] border-[#0F0F0F] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[4px_4px_0px_#0F0F0F] ${
                  beaconPowered 
                    ? "bg-[#FFD500] text-black" 
                    : "bg-white text-black hover:bg-slate-50"
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 border-black ${beaconPowered ? "bg-[#00E5FF] animate-ping" : "bg-gray-300"}`} />
                {beaconPowered ? "BEACON ACTIVE" : "IGNITE LIGHTHOUSE"}
              </motion.button>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
