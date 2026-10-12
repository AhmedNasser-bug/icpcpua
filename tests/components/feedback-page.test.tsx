import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import FeedbackBucketPage from "@/app/(site)/feedback/page"

const MESSAGE_PLACEHOLDER = /TYPE_YOUR_THOUGHTS_HERE/

function submitFeedback() {
  fireEvent.submit(screen.getByPlaceholderText(MESSAGE_PLACEHOLDER).closest("form")!)
}

describe("FeedbackBucketPage", () => {
  it("renders the seeded drops and their count", () => {
    render(<FeedbackBucketPage />)

    expect(screen.getByText("3 BYTES")).toBeTruthy()
    expect(screen.getByText("USER_01")).toBeTruthy()
    expect(screen.getByText("DARK_MODE_LOVER")).toBeTruthy()
    expect(screen.getByText("COMP_GENIUS")).toBeTruthy()
  })

  it("rejects an empty message", () => {
    render(<FeedbackBucketPage />)

    submitFeedback()

    expect(screen.getByText(/CANNOT DUMP NULL BYTES/)).toBeTruthy()
    expect(screen.getByPlaceholderText(MESSAGE_PLACEHOLDER)).toBeTruthy()
  })

  it("stores a valid drop and confirms the transmission", () => {
    render(<FeedbackBucketPage />)

    fireEvent.change(screen.getByPlaceholderText(MESSAGE_PLACEHOLDER), {
      target: { value: "Add a dark mode to the leaderboard." },
    })
    submitFeedback()

    expect(screen.getByText("BYTES STORED IN BUCKET!")).toBeTruthy()
    expect(screen.getByText("4 BYTES")).toBeTruthy()
    expect(screen.getByText("JUST_NOW")).toBeTruthy()
    expect(screen.getByText(/Add a dark mode to the leaderboard\./)).toBeTruthy()
    expect(screen.getByText("COMMUNITY_CODER")).toBeTruthy()
  })

  it("resets the form for the next drop", () => {
    render(<FeedbackBucketPage />)

    fireEvent.change(screen.getByPlaceholderText(MESSAGE_PLACEHOLDER), {
      target: { value: "Keep it up." },
    })
    submitFeedback()
    fireEvent.click(screen.getByRole("button", { name: /DUMP ANOTHER BYTE/ }))

    expect(screen.getByPlaceholderText(MESSAGE_PLACEHOLDER)).toHaveProperty("value", "")
    expect(screen.queryByText("BYTES STORED IN BUCKET!")).toBeNull()
  })

  it("filters the sidebar by category", () => {
    render(<FeedbackBucketPage />)

    fireEvent.click(screen.getByRole("button", { name: "#SHOUTOUT" }))

    expect(screen.getByText("DARK_MODE_LOVER")).toBeTruthy()
    expect(screen.queryByText("USER_01")).toBeNull()
    expect(screen.queryByText("COMP_GENIUS")).toBeNull()
    expect(screen.getByText("3 BYTES")).toBeTruthy()
  })
})
