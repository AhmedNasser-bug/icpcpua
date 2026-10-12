import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import EventsPage from "@/app/(site)/events/page"

describe("EventsPage", () => {
  it("renders the October calendar grid and sidebar events", () => {
    const { container } = render(<EventsPage />)

    expect(screen.getByText("OCTOBER")).toBeTruthy()
    expect(container.querySelectorAll(".calendar-cell")).toHaveLength(42)
    expect(screen.getByText("Codeforces Round #888 (Div. 2)")).toBeTruthy()
    expect(screen.getByText("ECPC Qualifications")).toBeTruthy()
  })

  it("filters both the sidebar and the calendar by event type", () => {
    render(<EventsPage />)

    fireEvent.click(screen.getByText("BOOTCAMP"))

    expect(screen.queryByText("Codeforces Round #888 (Div. 2)")).toBeNull()
    expect(screen.getByText("Graph Theory Bootcamp - Day 1")).toBeTruthy()
    expect(screen.getByText("Graph Theory Bootcamp - Day 2")).toBeTruthy()
  })

  it("opens and closes the event detail modal", () => {
    render(<EventsPage />)

    fireEvent.click(screen.getByText("ECPC Qualifications"))

    expect(screen.getByText("REGISTER NOW")).toBeTruthy()
    expect(screen.getByText(/Egyptian Collegiate Programming Contest/)).toBeTruthy()

    const modal = screen.getByText("REGISTER NOW").closest(".fixed")!
    fireEvent.click(modal.querySelector("button")!)

    expect(screen.queryByText("REGISTER NOW")).toBeNull()
  })

  it("shows time, location and registration details in the modal", () => {
    render(<EventsPage />)

    fireEvent.click(screen.getByText("Graph Theory Bootcamp - Day 1"))

    const modal = screen.getByText(/BFS, DFS, and shortest path foundations/).closest(".fixed") as HTMLElement
    expect(within(modal).getByText("OCT 05")).toBeTruthy()
    expect(within(modal).getByText("Lab 402, Building C")).toBeTruthy()
    expect(within(modal).getByText("REGISTER NOW")).toBeTruthy()
  })
})
