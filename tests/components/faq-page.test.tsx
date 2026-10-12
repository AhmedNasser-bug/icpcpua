import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import FAQPage from "@/app/(site)/faq/page"
import { CORE_FAQ_ITEMS, CONTEST_LOGISTICS_FAQ } from "@/data/faq"

describe("FAQPage", () => {
  it("renders every core question in both languages", () => {
    render(<FAQPage />)

    for (const item of CORE_FAQ_ITEMS) {
      expect(screen.getByText(item.question.ar), item.id).toBeTruthy()
      expect(screen.getByText(item.question.en), item.id).toBeTruthy()
    }
  })

  it("filters the list by search query and restores it when cleared", () => {
    render(<FAQPage />)

    fireEvent.change(screen.getByPlaceholderText(/Search topics/), {
      target: { value: "beginner" },
    })

    expect(screen.getByText(CORE_FAQ_ITEMS[1].question.en)).toBeTruthy()
    expect(screen.queryByText(CORE_FAQ_ITEMS[0].question.en)).toBeNull()

    fireEvent.change(screen.getByPlaceholderText(/Search topics/), { target: { value: "" } })

    expect(screen.getByText(CORE_FAQ_ITEMS[0].question.en)).toBeTruthy()
  })

  it("shows an empty state for a query without matches", () => {
    render(<FAQPage />)

    fireEvent.change(screen.getByPlaceholderText(/Search topics/), {
      target: { value: "zzzz-no-match" },
    })

    expect(screen.getByText(/NO MATCHING QUESTIONS FOUND/)).toBeTruthy()
    fireEvent.click(screen.getByText("RESET SEARCH"))
    expect(screen.getByText(CORE_FAQ_ITEMS[0].question.en)).toBeTruthy()
  })

  it("hides Arabic copy when English-only mode is selected", () => {
    render(<FAQPage />)

    fireEvent.click(screen.getByRole("button", { name: /ENGLISH/ }))

    expect(screen.queryByText(CORE_FAQ_ITEMS[0].question.ar)).toBeNull()
    expect(screen.getByText(CORE_FAQ_ITEMS[0].question.en)).toBeTruthy()
  })

  it("collapses an expanded answer when its question is toggled", () => {
    render(<FAQPage />)

    const answer = CORE_FAQ_ITEMS[0].answer.en.intro
    expect(screen.getByText(answer)).toBeTruthy()

    fireEvent.click(screen.getByText(CORE_FAQ_ITEMS[0].question.en))

    expect(screen.queryByText(answer)).toBeNull()
  })

  it("reveals the contest logistics rules on demand", () => {
    render(<FAQPage />)

    expect(screen.queryByText(CONTEST_LOGISTICS_FAQ[0].aEn)).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /VIEW CONTEST RULES/ }))

    expect(screen.getByText(CONTEST_LOGISTICS_FAQ[0].aEn)).toBeTruthy()
    expect(screen.getByRole("button", { name: /HIDE CONTEST RULES/ })).toBeTruthy()
  })
})
