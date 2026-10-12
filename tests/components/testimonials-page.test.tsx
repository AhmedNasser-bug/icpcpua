import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import TestimonialsPage from "@/app/(site)/testimonials/page"

describe("TestimonialsPage", () => {
  it("renders the placeholder container with its shared chrome", () => {
    const { container } = render(<TestimonialsPage />)

    expect(screen.getByText("Testimonials section coming soon.")).toBeTruthy()
    expect(container.querySelector("main")).toBeTruthy()
    expect(container.querySelectorAll(".vector-node")).toHaveLength(4)
  })
})
