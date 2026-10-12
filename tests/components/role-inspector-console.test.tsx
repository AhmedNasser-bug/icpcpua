import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/recruitment/Role3DCanvas", () => ({
  Role3DCanvas: ({
    role,
    wireframeOnly,
    autoRotate,
  }: {
    role: string
    wireframeOnly?: boolean
    autoRotate?: boolean
  }) => (
    <div
      data-testid="role-canvas"
      data-role={role}
      data-wireframe={String(Boolean(wireframeOnly))}
      data-spin={String(Boolean(autoRotate))}
    />
  ),
}))

import { RoleInspectorConsole } from "@/components/recruitment/RoleInspectorConsole"

describe("RoleInspectorConsole", () => {
  it("lists every committee as a selector tab", () => {
    render(<RoleInspectorConsole />)

    for (const title of [
      "The Instructor",
      "Operations & PR",
      "HR / Monitoring",
      "Design / Dev",
      "Specialised Marketing",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(title) })).toBeTruthy()
    }
  })

  it("starts on the instructor dossier with the derived spec link", () => {
    render(<RoleInspectorConsole />)

    expect(screen.getByText("BINARY_TREE_TRAVERSAL_v4")).toBeTruthy()
    expect(screen.getByText("99% RUNTIME OPTIMIZATION")).toBeTruthy()
    expect(screen.getByTestId("role-canvas").getAttribute("data-role")).toBe("instructor")
    expect(screen.getByRole("link", { name: /INSPECT THE INSTRUCTOR DOSSIER/ }).getAttribute("href")).toBe(
      "/specs/instructor"
    )
  })

  it("swaps the telemetry and dossier link when another role is selected", () => {
    render(<RoleInspectorConsole />)

    fireEvent.click(screen.getByRole("button", { name: /Operations & PR/ }))

    expect(screen.getByText("RADAR_PHASED_ARRAY_2.4GHZ")).toBeTruthy()
    expect(screen.getByText("ENGAGEMENT VELOCITY")).toBeTruthy()
    expect(screen.getByTestId("role-canvas").getAttribute("data-role")).toBe("ops-pr")
    expect(screen.getByRole("link", { name: /INSPECT OPERATIONS & PR DOSSIER/ }).getAttribute("href")).toBe(
      "/specs/ops-pr"
    )
    expect(screen.getByRole("link", { name: /BROWSE ALL 5 CARDS IN GRID/ }).getAttribute("href")).toBe("#roles")
  })

  it("toggles the spin and wireframe controls", () => {
    render(<RoleInspectorConsole />)

    expect(screen.getByTestId("role-canvas").getAttribute("data-spin")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "SPIN: ON" }))
    expect(screen.getByRole("button", { name: "SPIN: OFF" })).toBeTruthy()
    expect(screen.getByTestId("role-canvas").getAttribute("data-spin")).toBe("false")

    expect(screen.getByTestId("role-canvas").getAttribute("data-wireframe")).toBe("false")
    fireEvent.click(screen.getByRole("button", { name: "WIREFRAME: OFF" }))
    expect(screen.getByRole("button", { name: "WIREFRAME: ACTIVE" })).toBeTruthy()
    expect(screen.getByTestId("role-canvas").getAttribute("data-wireframe")).toBe("true")
  })
})
