"use client"

import { useRouter } from "next/navigation"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { StatsSection } from "@/components/home/stats-section"
import { RoadmapSection } from "@/components/home/roadmap-section"
import { AboutSection } from "@/components/home/about-section"
import { JoinCtaSection } from "@/components/home/join-cta-section"

export default function HomePage() {
  const router = useRouter()
  const handleGoToRegister = () => router.push("/register")

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main id="main-content" className="flex-grow flex flex-col items-center w-full">
        <HeroSection onOpenModal={handleGoToRegister} />
        <StatsSection />
        <RoadmapSection onOpenModal={handleGoToRegister} />
        <AboutSection />
        <JoinCtaSection onOpenModal={handleGoToRegister} />
      </main>

      {/* Scrolling marquee sits just above the footer */}
      <Marquee />

      {/* ── FEEDBACK BUCKET FOOTER ────────────── */}
      <Footer />
    </div>
  )
}
