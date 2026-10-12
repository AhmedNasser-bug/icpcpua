import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useTraineeRegistration } from "@/hooks/use-trainee-registration"

function submitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useTraineeRegistration", () => {
  it("starts with the default form values and uppercases the initial referral code", () => {
    const { result } = renderHook(() =>
      useTraineeRegistration({ initialReferralCode: "scout-01" })
    )

    expect(result.current.form).toEqual({
      fullName: "",
      universityId: "",
      email: "",
      phone: "",
      academicYear: "Year 1",
      track: "level_1",
      codeforcesHandle: "",
      referralCode: "SCOUT-01",
    })
    expect(result.current.submitted).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.errorMsg).toBeNull()
    expect(result.current.awardedPoints).toBe(10)
  })

  it("posts the form without the referral code and exposes the awarded points", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, trainee: { pointsTotal: 42 } }))
    vi.stubGlobal("fetch", fetchMock)
    const onRegistered = vi.fn()

    const { result } = renderHook(() => useTraineeRegistration({ initialReferralCode: "SCOUT-01", onRegistered }))

    act(() => {
      result.current.setForm((prev) => ({
        ...prev,
        fullName: "Ahmed Nasser",
        universityId: "202300481",
        email: "ahmed@example.com",
        phone: "01000000000",
        track: "level_2",
      }))
    })

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/trainees/register")
    expect(init.method).toBe("POST")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(init.body)).toEqual({
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 1",
      track: "level_2",
      codeforcesHandle: "",
    })

    expect(result.current.submitted).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.errorMsg).toBeNull()
    expect(result.current.awardedPoints).toBe(42)
    expect(onRegistered).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Ahmed Nasser" }))
  })

  it("keeps the default welcome points when the API omits pointsTotal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: true })))

    const { result } = renderHook(() => useTraineeRegistration())

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.submitted).toBe(true)
    expect(result.current.awardedPoints).toBe(10)
  })

  it("surfaces an API validation error and stays on the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: false, error: "Email is invalid." }, false))
    )

    const { result } = renderHook(() => useTraineeRegistration())

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.submitted).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.errorMsg).toBe("Email is invalid.")
  })

  it("falls back to a generic message when the API succeeds without an error field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: false }, false)))

    const { result } = renderHook(() => useTraineeRegistration())

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.errorMsg).toBe("Failed to register. Please check your data.")
  })

  it("surfaces a network failure message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    const { result } = renderHook(() => useTraineeRegistration())

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.submitted).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.errorMsg).toBe("network down")
  })

  it("clears loading and reports an error when onRegistered throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: true })))
    const onRegistered = vi.fn().mockRejectedValue(new Error("sync failed"))

    const { result } = renderHook(() => useTraineeRegistration({ onRegistered }))

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.submitted).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.errorMsg).toBe("sync failed")
  })

  it("keeps the referral code in sync when the initial code changes", () => {
    const { result, rerender } = renderHook(
      ({ code }: { code: string }) => useTraineeRegistration({ initialReferralCode: code }),
      { initialProps: { code: "OLD-CODE" } }
    )

    expect(result.current.form.referralCode).toBe("OLD-CODE")

    rerender({ code: "new-code" })
    expect(result.current.form.referralCode).toBe("NEW-CODE")

    rerender({ code: "" })
    expect(result.current.form.referralCode).toBe("NEW-CODE")
  })
})
