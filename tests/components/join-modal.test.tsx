import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { JoinModal } from "@/components/home/join-modal"

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Ahmed Nasser" } })
  fireEvent.change(screen.getByLabelText(/University ID/), { target: { value: "202300481" } })
  fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "ahmed@example.com" } })
  fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: "01000000000" } })
}

function submitForm() {
  fireEvent.submit(screen.getByLabelText(/Full Name/).closest("form")!)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("JoinModal", () => {
  it("submits the cadet details and confirms the awarded points", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, trainee: { pointsTotal: 25 } }))
    vi.stubGlobal("fetch", fetchMock)
    render(<JoinModal onClose={vi.fn()} />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("YOU'RE IN!")
    expect(screen.getByText("+25 POINTS")).toBeTruthy()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/trainees/register")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body)).toEqual({
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 1",
      track: "level_1",
      codeforcesHandle: "",
    })
  })

  it("disables the submit control while the registration is in flight", async () => {
    let resolveFetch!: (value: unknown) => void
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        })
    )
    vi.stubGlobal("fetch", fetchMock)
    render(<JoinModal onClose={vi.fn()} />)

    fillRequiredFields()
    submitForm()

    const pendingButton = screen.getByRole("button", { name: /REGISTERING/ }) as HTMLButtonElement
    expect(pendingButton.disabled).toBe(true)

    resolveFetch(jsonResponse({ success: true, trainee: { pointsTotal: 10 } }))

    await screen.findByText("YOU'RE IN!")
    expect(screen.queryByText("REGISTERING...")).toBeNull()
  })

  it("surfaces an API error and keeps the form open", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: false, error: "Email is invalid." }, false))
    )
    render(<JoinModal onClose={vi.fn()} />)

    fillRequiredFields()
    submitForm()

    await screen.findByText("Email is invalid.")
    expect(screen.getByPlaceholderText("e.g. Ahmed Mahmoud")).toBeTruthy()
    expect(screen.queryByText("YOU'RE IN!")).toBeNull()
  })

  it("links to the /join application page", () => {
    render(<JoinModal onClose={vi.fn()} />)

    const link = screen.getByText(/Need committee hiring details/).closest("a")
    expect(link?.getAttribute("href")).toBe("/join")
  })

  it("closes on Escape and from the close control", () => {
    const onClose = vi.fn()
    render(<JoinModal onClose={onClose} />)

    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Close registration dialog" }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
