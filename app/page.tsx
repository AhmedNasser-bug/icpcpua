"use client"

import { useState } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"
import { Footer } from "@/components/footer"
import { JoinModal } from "@/components/home/join-modal"
import { HeroSection } from "@/components/home/hero-section"
import { StatsSection } from "@/components/home/stats-section"
import { RoadmapSection } from "@/components/home/roadmap-section"
import { AboutSection } from "@/components/home/about-section"
import { JoinCtaSection } from "@/components/home/join-cta-section"

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpenModal = () => setModalOpen(true)
  const handleCloseModal = () => setModalOpen(false)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      {modalOpen && <JoinModal onClose={handleCloseModal} />}

      <main className="flex-grow flex flex-col items-center w-full">
        <HeroSection onOpenModal={handleOpenModal} />
        <StatsSection />
        <RoadmapSection onOpenModal={handleOpenModal} />
        <AboutSection />
        <JoinCtaSection onOpenModal={handleOpenModal} />
      </main>

      {/* ── FEEDBACK BUCKET FOOTER ────────────── */}
      <Footer />

      {/* Scrolling marquee sits just above the footer */}
      <Marquee />
    </div>
  )
}
