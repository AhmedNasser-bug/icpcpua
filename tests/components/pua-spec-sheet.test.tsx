import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PuaSpecSheet } from "@/components/pua-spec-sheet"
import { rolesData } from "@/data/recruitment/roles"

const instructor = rolesData.instructor

describe("PuaSpecSheet", () => {
  it("renders the role identity and every anchor section", () => {
    const { container } = render(<PuaSpecSheet data={instructor} roleKey="instructor" />)

    expect(screen.getByText(instructor.roleId)).toBeTruthy()
    expect(screen.getByText(instructor.roleTitle)).toBeTruthy()
    expect(screen.getByText(instructor.arabicTitle)).toBeTruthy()
    expect(screen.getByText(instructor.description, { exact: false })).toBeTruthy()
    for (const anchor of ["mission", "contract", "handbook", "faq", "blueprint"]) {
      expect(container.querySelector(`#${anchor}`), `#${anchor}`).toBeTruthy()
    }
  })

  it("links the TOP OF SPEC control to an existing top anchor", () => {
    const { container } = render(<PuaSpecSheet data={instructor} roleKey="instructor" />)

    expect(container.querySelector("#top")).toBeTruthy()
    expect(container.querySelector('a[href="#top"]')).toBeTruthy()
  })

  it("links to every committee spec in the blueprint navigator", () => {
    const { container } = render(<PuaSpecSheet data={instructor} roleKey="instructor" />)

    for (const roleId of Object.keys(rolesData)) {
      expect(
        container.querySelector(`a[href="/specs/${roleId}"]`),
        `/specs/${roleId}`
      ).toBeTruthy()
    }
  })

  it("highlights only the navigator entry for the active role key", () => {
    const { container } = render(<PuaSpecSheet data={rolesData["ops-pr"]} roleKey="ops-pr" />)

    for (const roleId of Object.keys(rolesData)) {
      const link = container.querySelector(`a[href="/specs/${roleId}"]`) as HTMLElement
      if (roleId === "ops-pr") {
        expect(link.className, "ops-pr").toContain("ring-2")
      } else {
        expect(link.className, roleId).not.toContain("ring-2")
      }
    }
  })

  it("highlights the technical alias as its own entry, not the instructor entry", () => {
    const { container } = render(<PuaSpecSheet data={rolesData.technical} roleKey="technical" />)

    const technical = container.querySelector('a[href="/specs/technical"]') as HTMLElement
    const instructorLink = container.querySelector('a[href="/specs/instructor"]') as HTMLElement
    expect(technical.className).toContain("ring-2")
    expect(instructorLink.className).not.toContain("ring-2")
  })

  it("switches the section copy to Arabic when the language toggles", () => {
    render(<PuaSpecSheet data={instructor} roleKey="instructor" />)

    expect(screen.getByText("MISSION & IMPACT")).toBeTruthy()

    fireEvent.click(screen.getByText("عربي"))

    expect(screen.getByText("المهمة والأثر")).toBeTruthy()
    expect(screen.queryByText("MISSION & IMPACT")).toBeNull()
  })

  it("reveals a handbook answer when its FAQ row is expanded", () => {
    const faq = instructor.handbook.faq[0]
    render(<PuaSpecSheet data={instructor} roleKey="instructor" />)

    expect(screen.queryByText(faq.a.en)).toBeNull()

    const question = screen.getByText(faq.q.en)
    fireEvent.click(question.closest("button")!)

    expect(screen.getByText(faq.a.en)).toBeTruthy()
  })
})
