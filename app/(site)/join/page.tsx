"use client"

import { HeroSection } from "@/components/join/hero-section"
import { ValuePropsSection } from "@/components/join/value-props-section"
import { TracksSection } from "@/components/join/tracks-section"
import { CommitmentSection } from "@/components/join/commitment-section"
import { MilestonesSection } from "@/components/join/milestones-section"
import { FaqLinkSection } from "@/components/join/faq-link-section"
import { ApplicationSection } from "@/components/join/application-section"

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function JoinPage() {
  return (
    <main className="flex-grow flex flex-col w-full">
      <HeroSection />
      <ValuePropsSection />
      <TracksSection />
      <CommitmentSection />
      <MilestonesSection />
      <FaqLinkSection />
      <ApplicationSection />
    </main>
  )
}
