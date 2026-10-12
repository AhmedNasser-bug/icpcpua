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
    expect(screen.getByText("2023")).toBeTruthy()
    expect(getCells(container)).toHaveLength(42)
    expect(screen.getByText("Codeforces Round #888 (Div. 2)")).toBeTruthy()
    expect(screen.getByText("ECPC Qualifications")).toBeTruthy()
  })

  it("places every event on its correct day of the displayed month", () => {
    const { container } = render(<EventsPage />)
    const cells = getCells(container)

    // October 2023 starts on Sunday, so day N renders at index N - 1.
    expect(within(cells[3]).getByText(/.*Codeforces R/)).toBeTruthy()
    expect(within(cells[4]).getByText(/Graph Theory/)).toBeTruthy()
    expect(within(cells[5]).getByText(/Graph Theory/)).toBeTruthy()
    expect(within(cells[12]).getByText(/ECPC Qualifi/)).toBeTruthy()
    expect(within(cells[17]).getByText("Team Meetup")).toBeTruthy()
  })

  it("derives the leading weekday offset for each displayed month", () => {
    const { container } = render(<EventsPage />)

    // October 2023 starts on Sunday: the first cell is day 1.
    expect(getDayLabel(getCells(container)[0])).toBe("1")

    goToPreviousMonth()

    // September 2023 starts on Friday: five empty leading cells.
    const septemberCells = getCells(container)
    for (let i = 0; i < 5; i++) {
      expect(getDayLabel(septemberCells[i]), `cell ${i}`).toBeUndefined()
    }
    expect(getDayLabel(septemberCells[5])).toBe("1")
  })

  it("moves to the previous month", () => {
    render(<EventsPage />)

    goToPreviousMonth()

    expect(screen.getByText("SEPTEMBER")).toBeTruthy()
    expect(screen.getByText("2023")).toBeTruthy()
    expect(screen.queryByText("OCTOBER")).toBeNull()
  })

  it("moves to the next month and wraps across year boundaries", () => {
    render(<EventsPage />)

    goToNextMonth()
    expect(screen.getByText("NOVEMBER")).toBeTruthy()
    expect(screen.getByText("2023")).toBeTruthy()

    goToNextMonth()
    expect(screen.getByText("DECEMBER")).toBeTruthy()

    goToNextMonth()
    expect(screen.getByText("JANUARY")).toBeTruthy()
    expect(screen.getByText("2024")).toBeTruthy()

    goToPreviousMonth()
    expect(screen.getByText("DECEMBER")).toBeTruthy()
    expect(screen.getByText("2023")).toBeTruthy()
  })

  it("shows empty months when navigating to months without events", () => {
    const { container } = render(<EventsPage />)

    goToNextMonth() // November 2023 has no events

    expect(screen.getByText("NOVEMBER")).toBeTruthy()
    expect(getGridEventButtons(container)).toHaveLength(0)
    expect(getCells(container)).toHaveLength(42)
  })

  it("filters both the sidebar and the calendar by event type", () => {
    const { container } = render(<EventsPage />)

    fireEvent.click(screen.getByText("BOOTCAMP"))

    expect(screen.queryByText("Codeforces Round #888 (Div. 2)")).toBeNull()
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
