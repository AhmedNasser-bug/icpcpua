"use client"

import { useState } from "react"
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
    <>
      {modalOpen && <JoinModal onClose={handleCloseModal} />}

      <main id="main-content" className="flex-grow flex flex-col items-center w-full">
        <HeroSection onOpenModal={handleOpenModal} />
        <StatsSection />
        <RoadmapSection onOpenModal={handleOpenModal} />
        <AboutSection />
        <JoinCtaSection onOpenModal={handleOpenModal} />
      </main>
    </>
  )
}
