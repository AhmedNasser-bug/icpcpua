import { describe, expect, it, vi } from "vitest"
import { rolesData, type RoleId } from "@/data/recruitment/roles"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

import { RoleSpecPage, roleSpecParams } from "@/components/recruitment/RoleSpecPage"
import { PuaSpecSheet } from "@/components/pua-spec-sheet"

describe("roleSpecParams", () => {
  it("generates a param entry for every registered role", () => {
    expect(roleSpecParams()).toEqual(Object.keys(rolesData).map((role) => ({ role })))
  })

  it("covers the six routed role ids without omission or duplication", () => {
    const params = roleSpecParams().map((entry) => entry.role)
    expect(params).toEqual([
      "instructor",
      "technical",
      "ops-pr",
      "hr",
      "marketing",
      "design-dev",
    ])
    expect(new Set(params).size).toBe(Object.keys(rolesData).length)
  })
})

describe("RoleSpecPage", () => {
  it.each(Object.keys(rolesData) as RoleId[])(
    "renders the spec sheet with the registry data for %s",
    async (role) => {
      const element = await RoleSpecPage({ role })

      expect(element.type).toBe(PuaSpecSheet)
      expect(element.props.data).toBe(rolesData[role])
    }
  )

  it("renders the technical alias with the shared instructor identity", async () => {
    const element = await RoleSpecPage({ role: "technical" })

    expect(element.props.data).toBe(rolesData.technical)
    expect(element.props.data.roleId).toBe(rolesData.instructor.roleId)
    expect(element.props.data.levelBadge).toBe(rolesData.instructor.levelBadge)
  })

  it("triggers notFound for an unknown role", async () => {
    await expect(RoleSpecPage({ role: "unknown-role" })).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
