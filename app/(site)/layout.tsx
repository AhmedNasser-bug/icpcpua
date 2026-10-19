import type { ReactNode } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"
import { Footer } from "@/components/footer"
import { WhatsAppCTA } from "@/components/whatsapp-cta"

/**
 * Shared site chrome for all standard pages:
 * sticky navbar on top, marquee + footer at the bottom, and floating WhatsApp CTA.
 * Pages inside this group render only their own main content.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />
      {children}
      <Marquee />
      <Footer />
      <WhatsAppCTA />
    </div>
  )
}
