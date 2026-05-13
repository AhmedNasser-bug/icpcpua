"use client"

import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "./components/hero-section"
import { ValuePropsSection } from "./components/value-props-section"
import { TracksSection } from "./components/tracks-section"
import { CommitmentSection } from "./components/commitment-section"
import { MilestonesSection } from "./components/milestones-section"
import { FaqLinkSection } from "./components/faq-link-section"
import { ApplicationSection } from "./components/application-section"

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main className="flex-grow flex flex-col w-full">
        <HeroSection />
        <ValuePropsSection />
        <TracksSection />
        <CommitmentSection />
        <MilestonesSection />
        <FaqLinkSection />
        <ApplicationSection />
        <Footer />
      </main>
    </div>
  )
}
