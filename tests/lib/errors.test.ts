import { describe, expect, it } from "vitest"
import { getErrorMessage } from "@/lib/errors"

describe("getErrorMessage", () => {
  it("returns the message of a regular Error instance", () => {
    expect(getErrorMessage(new Error("Something broke"), "fallback")).toBe("Something broke")
  })

  it("returns the message of a subclassed Error", () => {
    class ValidationError extends Error {}
    expect(getErrorMessage(new ValidationError("Invalid input"), "fallback")).toBe("Invalid input")
  })

  it("returns the fallback for a non-Error value", () => {
    expect(getErrorMessage("plain string", "fallback")).toBe("fallback")
    expect(getErrorMessage({ message: "looks like an error" }, "fallback")).toBe("fallback")
    expect(getErrorMessage(null, "fallback")).toBe("fallback")
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback")
  })

  it("returns the fallback when the error has an empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback")
  })

  it("keeps a whitespace-only message because it is truthy", () => {
    expect(getErrorMessage(new Error("   "), "fallback")).toBe("   ")
  })
})
