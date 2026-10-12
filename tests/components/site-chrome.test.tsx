import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"
import { Marquee } from "@/components/pua-marquee"

const SECONDARY_LINKS: Array<[string, string]> = [
  ["Hall of Fame", "/hall-of-fame"],
  ["Resources", "/resources"],
  ["FAQ", "/faq"],
  ["Committee Roles", "/recruitment"],
  ["Referral Hub", "/referrals"],
  ["Feedback Bucket", "/feedback"],
]

describe("PuaNavbar", () => {
  it("renders the brand and the primary destinations", () => {
    render(<PuaNavbar />)

    expect(screen.getByText("PUA ICPC")).toBeTruthy()
    expect(screen.getByRole("link", { name: /TRAINING PLAN/ }).getAttribute("href")).toBe("/#curriculum")
    expect(screen.getByRole("link", { name: /EVENTS & SESSIONS/ }).getAttribute("href")).toBe("/events")
    expect(screen.getByRole("link", { name: /LEADERBOARD/ }).getAttribute("href")).toBe("/leaderboard")
    expect(screen.getByRole("link", { name: /JOIN TRAINING/ }).getAttribute("href")).toBe("/join")
  })

  it("opens and closes the explore directory with every secondary hub", () => {
    render(<PuaNavbar />)

    const toggle = screen.getByRole("button", { name: "Toggle explore directory menu" })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("menu")).toBeTruthy()

    for (const [label, href] of SECONDARY_LINKS) {
      expect(screen.getByRole("link", { name: new RegExp(label) }).getAttribute("href"), label).toBe(href)
    }

    fireEvent.click(toggle)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("opens the mobile menu with the core destinations and CTA", () => {
    render(<PuaNavbar />)

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))

    expect(screen.getByText("MAIN DESTINATIONS")).toBeTruthy()
    expect(screen.getByRole("link", { name: /TRAINING PLAN & CURRICULUM/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: /CADET LEADERBOARD/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: /JOIN TRAINING \(\+10 PTS\)/ }).getAttribute("href")).toBe("/join")
  })
})

describe("Footer", () => {
  it("renders the feedback banner and the directory links", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: /DUMP YOUR FEEDBACK/ }).getAttribute("href")).toBe("/feedback")
    expect(screen.getByRole("link", { name: "Home Base" }).getAttribute("href")).toBe("/")
    expect(screen.getByRole("link", { name: /Hall of Fame/ }).getAttribute("href")).toBe("/hall-of-fame")
    expect(screen.getByRole("link", { name: /Training Armory & Resources/ }).getAttribute("href")).toBe("/resources")
    expect(screen.getByRole("link", { name: "Instructor Blueprint" }).getAttribute("href")).toBe("/specs/instructor")
    expect(screen.getByText(/© 2026 PUA ICPC COMMUNITY/)).toBeTruthy()
  })
})

describe("Marquee", () => {
  it("repeats the community slogans for the seamless loop", () => {
    const { container } = render(<Marquee />)

    expect(container.querySelector(".marquee-content")).toBeTruthy()
    expect(screen.getAllByText("CRACK THE CODE.")).toHaveLength(2)
    expect(screen.getAllByText("O(N LOG N) OR BUST")).toHaveLength(2)
  })
})
