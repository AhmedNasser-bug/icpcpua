import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import ResourcesPage from "@/app/(site)/resources/page"

describe("ResourcesPage", () => {
  it("renders the armory headline and the full resource catalog", () => {
    const { container } = render(<ResourcesPage />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toContain("TRAINING")
    expect(heading.textContent).toContain("ARMORY")
    expect(container.querySelectorAll(".resource-card")).toHaveLength(9)
    expect(screen.getByText("ASSIUT UNIVERSITY TRAINING SHEET")).toBeTruthy()
    expect(screen.getByText("ICPC BOOTCAMP MATERIALS")).toBeTruthy()
  })

  it("links every resource card out of the site", () => {
    const { container } = render(<ResourcesPage />)

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>(".resource-card"))
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute("href")).toBeTruthy()
      expect(link.getAttribute("target")).toBe("_blank")
      expect(link.getAttribute("rel")).toContain("noreferrer")
    }
  })

  it("filters the catalog down to the selected category", () => {
    const { container } = render(<ResourcesPage />)

    fireEvent.click(screen.getByRole("button", { name: "PLATFORMS" }))

    expect(container.querySelectorAll(".resource-card")).toHaveLength(3)
    expect(screen.getByText("LEETCODE GRINDER")).toBeTruthy()
    expect(screen.queryByText("ASSIUT UNIVERSITY TRAINING SHEET")).toBeNull()
    expect(screen.queryByText("DYNAMIC PROGRAMMING MASTERCLASS")).toBeNull()
  })
})
