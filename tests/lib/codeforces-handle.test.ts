import { describe, expect, it } from "vitest"
import {
  codeforcesHandleKey,
  codeforcesProfileUrl,
  normalizeCodeforcesHandle,
} from "@/lib/codeforces/handle"

describe("normalizeCodeforcesHandle", () => {
  it("trims whitespace and strips one leading @", () => {
    expect(normalizeCodeforcesHandle("  @Tourist  ")).toBe("Tourist")
    expect(normalizeCodeforcesHandle("@algo_queen")).toBe("algo_queen")
  })

  it("preserves case and valid punctuation", () => {
    expect(normalizeCodeforcesHandle("I_love_CP")).toBe("I_love_CP")
    expect(normalizeCodeforcesHandle("user.name-test")).toBe("user.name-test")
  })

  it("rejects empty, short, long and malformed handles", () => {
    expect(normalizeCodeforcesHandle("")).toBeNull()
    expect(normalizeCodeforcesHandle("@")).toBeNull()
    expect(normalizeCodeforcesHandle("ab")).toBeNull()
    expect(normalizeCodeforcesHandle("a".repeat(25))).toBeNull()
    expect(normalizeCodeforcesHandle("two words")).toBeNull()
    expect(normalizeCodeforcesHandle("bad/handle")).toBeNull()
    expect(normalizeCodeforcesHandle("bad?handle")).toBeNull()
    expect(normalizeCodeforcesHandle(null)).toBeNull()
    expect(normalizeCodeforcesHandle(42)).toBeNull()
  })

  it("does not strip an internal @ or corrupt legitimate identifiers", () => {
    expect(normalizeCodeforcesHandle("algo@queen")).toBeNull()
    expect(normalizeCodeforcesHandle("__tourist__")).toBe("__tourist__")
  })
})

describe("handle helpers", () => {
  it("builds a lower-case uniqueness key without changing the stored handle", () => {
    expect(codeforcesHandleKey("Tourist")).toBe("tourist")
    expect(codeforcesProfileUrl("a b")).toBe("https://codeforces.com/profile/a%20b")
  })
})
