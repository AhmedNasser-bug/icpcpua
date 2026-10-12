import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/recruitment/Role3DCanvas", () => ({
  Role3DCanvas: ({ role }: { role: string }) => (
    <div data-testid="role-canvas" data-role={role} />
  ),
}))

import RecruitmentLandingPage from "@/app/(site)/recruitment/page"
import { rolesData, type RoleId } from "@/data/recruitment/roles"

const CARD_SPECS: Array<[RoleId, RegExp]> = [
  ["instructor", /View Instructor Spec Sheet/],
  ["ops-pr", /View PR Spec Sheet/],
  ["hr", /View HR Spec Sheet/],
  ["design-dev", /View Dev Spec Sheet/],
  ["marketing", /View Marketing Spec Sheet/],
]

describe("RecruitmentLandingPage", () => {
  it("renders exactly five specialization cards", () => {
    const { container } = render(<RecruitmentLandingPage />)

    expect(screen.getByText("05 SPECIALIZATIONS")).toBeTruthy()
    expect(container.querySelectorAll("#roles > div")).toHaveLength(5)
  })

  it("derives every card badge, 3D role and spec link from the role registry", () => {
    render(<RecruitmentLandingPage />)

    for (const [role, linkName] of CARD_SPECS) {
      const link = screen.getByRole("link", { name: linkName })
      expect(link.getAttribute("href"), role).toBe(`/specs/${role}`)

      const card = link.closest(".group") as HTMLElement
      expect(within(card).getByText(rolesData[role].levelBadge), role).toBeTruthy()
      expect(within(card).getByTestId("role-canvas").getAttribute("data-role"), role).toBe(role)
    }
  })
})
