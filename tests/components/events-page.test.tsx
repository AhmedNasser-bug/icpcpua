import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import EventsPage from "@/app/(site)/events/page"

function goToPreviousMonth() {
  fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
}

function goToNextMonth() {
  fireEvent.click(screen.getByRole("button", { name: "Next month" }))
}

function getCells(container: HTMLElement) {
  return container.querySelectorAll<HTMLElement>(".calendar-cell")
}

function getDayLabel(cell: HTMLElement) {
  return cell.querySelector("span.font-body")?.textContent
}

function getGridEventButtons(container: HTMLElement) {
  return container.querySelectorAll(".calendar-cell button")
}

describe("EventsPage", () => {
  it("renders the October calendar grid and sidebar events", () => {
    const { container } = render(<EventsPage />)

    expect(screen.getByText("OCTOBER")).toBeTruthy()
    expect(screen.getByText("2026")).toBeTruthy()
    expect(getCells(container)).toHaveLength(42)
    expect(screen.getByText("Codeforces Div. 2 Round")).toBeTruthy()
    expect(screen.getByText("ECPC Qualifications")).toBeTruthy()
  })

  it("places every event on its correct day of the displayed month", () => {
    const { container } = render(<EventsPage />)
    const cells = getCells(container)

    // October 2026 starts on Thursday, so day N renders at index N + 3.
    expect(within(cells[7]).getByText(/.*Codeforces/)).toBeTruthy()
    expect(within(cells[8]).getByText(/Graph Theory/)).toBeTruthy()
    expect(within(cells[9]).getByText(/Graph Theory/)).toBeTruthy()
    expect(within(cells[16]).getByText(/ECPC Qualifi/)).toBeTruthy()
    expect(within(cells[21]).getByText("Team Meetup")).toBeTruthy()
  })

  it("derives the leading weekday offset for each displayed month", () => {
    const { container } = render(<EventsPage />)

    // October 2026 starts on Thursday: four empty leading cells, day 1 at index 4.
    const octoberCells = getCells(container)
    for (let i = 0; i < 4; i++) {
      expect(getDayLabel(octoberCells[i]), `cell ${i}`).toBeUndefined()
    }
    expect(getDayLabel(octoberCells[4])).toBe("1")

    goToPreviousMonth()

    // September 2026 starts on Tuesday: two empty leading cells.
    const septemberCells = getCells(container)
    for (let i = 0; i < 2; i++) {
      expect(getDayLabel(septemberCells[i]), `cell ${i}`).toBeUndefined()
    }
    expect(getDayLabel(septemberCells[2])).toBe("1")
  })

  it("moves to the previous month", () => {
    render(<EventsPage />)

    goToPreviousMonth()

    expect(screen.getByText("SEPTEMBER")).toBeTruthy()
    expect(screen.getByText("2026")).toBeTruthy()
    expect(screen.queryByText("OCTOBER")).toBeNull()
  })

  it("moves to the next month and wraps across year boundaries", () => {
    render(<EventsPage />)

    goToNextMonth()
    expect(screen.getByText("NOVEMBER")).toBeTruthy()
    expect(screen.getByText("2026")).toBeTruthy()

    goToNextMonth()
    expect(screen.getByText("DECEMBER")).toBeTruthy()

    goToNextMonth()
    expect(screen.getByText("JANUARY")).toBeTruthy()
    expect(screen.getByText("2027")).toBeTruthy()

    goToPreviousMonth()
    expect(screen.getByText("DECEMBER")).toBeTruthy()
    expect(screen.getByText("2026")).toBeTruthy()
  })

  it("shows empty months when navigating to months without events", async () => {
    const { container } = render(<EventsPage />)

    goToNextMonth() // November 2026 has no events

    expect(screen.getByText("NOVEMBER")).toBeTruthy()
    expect(getGridEventButtons(container)).toHaveLength(0)
    expect(getCells(container)).toHaveLength(42)
  })

  it("filters both the sidebar and the calendar by event type", () => {
    const { container } = render(<EventsPage />)

    fireEvent.click(screen.getByText("BOOTCAMP"))

    expect(screen.queryByText("Codeforces Div. 2 Round")).toBeNull()
    expect(screen.getByText("Graph Theory Bootcamp - Day 1")).toBeTruthy()
    expect(screen.getByText("Graph Theory Bootcamp - Day 2")).toBeTruthy()
    expect(getGridEventButtons(container)).toHaveLength(2)
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

  it("sends registration-required events to the /join intake form", () => {
    render(<EventsPage />)

    fireEvent.click(screen.getByText("ECPC Qualifications"))

    expect(screen.getByText("REGISTER NOW").closest("a")?.getAttribute("href")).toBe("/join")
  })
})
