import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ValuePropsSection } from "@/components/join/value-props-section"

const CARD_TITLES = [
  "Crack Technical Interviews",
  "Premium Mentorship",
  "Real Stakes & Rewards",
]

describe("ValuePropsSection", () => {
  it("keeps all three cards padded and free of the absolute vector-node container styling", () => {
    const { container } = render(<ValuePropsSection />)

    for (const title of CARD_TITLES) {
      const card = screen.getByText(title).closest("div") as HTMLElement
      expect(card.className, title).toContain("p-8")
      expect(card.className, title).not.toContain("vector-node")
    }

    expect(container.querySelectorAll(".vector-node")).toHaveLength(0)
  })
})
