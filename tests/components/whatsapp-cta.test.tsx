import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { WhatsAppCTA } from "@/components/whatsapp-cta"
import { OFFICIAL_COMMUNITY_LINKS } from "@/data/faq"

describe("WhatsAppCTA", () => {
  it("renders floating WhatsApp CTA with link to official WhatsApp group", () => {
    render(<WhatsAppCTA />)

    const ctaLink = screen.getByRole("link", { name: /join official whatsapp group/i })
    expect(ctaLink).toBeTruthy()
    expect(ctaLink.getAttribute("href")).toBe(OFFICIAL_COMMUNITY_LINKS.whatsapp)
    expect(ctaLink.getAttribute("target")).toBe("_blank")
    expect(ctaLink.getAttribute("rel")).toBe("noopener noreferrer")

    expect(screen.getByText("WhatsApp Community")).toBeTruthy()
  })
})
