import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import HallOfFamePage from "@/app/(site)/hall-of-fame/page"

describe("HallOfFamePage", () => {
  it("renders the legends headline and every hall-of-fame team", () => {
    render(<HallOfFamePage />)

    expect(screen.getByRole("heading", { name: "LEGENDS." })).toBeTruthy()
    for (const team of ["PUA_Knights", "PUA_Infinity", "PUA_Coders", "PUA_Sigma", "PUA_Legends"]) {
      expect(screen.getByText(team), team).toBeTruthy()
    }
    expect(screen.getByText("YOUR TEAM NEXT?")).toBeTruthy()
  })

  it("opens a team story and closes it again", () => {
    render(<HallOfFamePage />)

    fireEvent.click(screen.getByRole("button", { name: /PUA_Knights/ }))

    const modal = screen.getByText("TEAM MEMBERS").closest(".fixed") as HTMLElement
    expect(within(modal).getByText(/shocked everyone by qualifying/)).toBeTruthy()
    expect(within(modal).getByText("Ahmed Khalid")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByText("TEAM MEMBERS")).toBeNull()
  })

  it("links the end-of-scroll call to action to the home page", () => {
    render(<HallOfFamePage />)

    const cta = screen.getByRole("link", { name: "JOIN NOW" })
    expect(cta.getAttribute("href")).toBe("/")
    expect(within(cta.closest("div") as HTMLElement).getByText("Join PUA ICPC and write your own legend.")).toBeTruthy()
  })
})
