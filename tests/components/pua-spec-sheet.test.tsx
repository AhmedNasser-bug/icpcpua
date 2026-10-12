import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PuaSpecSheet } from "@/components/pua-spec-sheet"
import { rolesData } from "@/data/recruitment/roles"

const instructor = rolesData.instructor

describe("PuaSpecSheet", () => {
  it("renders the role identity and every anchor section", () => {
    const { container } = render(<PuaSpecSheet data={instructor} />)

    expect(screen.getByText(instructor.roleId)).toBeTruthy()
    expect(screen.getByText(instructor.roleTitle)).toBeTruthy()
    expect(screen.getByText(instructor.arabicTitle)).toBeTruthy()
    expect(screen.getByText(instructor.description, { exact: false })).toBeTruthy()
    for (const anchor of ["mission", "contract", "handbook", "faq", "blueprint"]) {
      expect(container.querySelector(`#${anchor}`), `#${anchor}`).toBeTruthy()
    }
  })

  it("links the TOP OF SPEC control to an existing top anchor", () => {
    const { container } = render(<PuaSpecSheet data={instructor} />)

    expect(container.querySelector("#top")).toBeTruthy()
    expect(container.querySelector('a[href="#top"]')).toBeTruthy()
  })

  it("links to every committee spec in the blueprint navigator", () => {
    const { container } = render(<PuaSpecSheet data={instructor} />)

    for (const roleId of Object.keys(rolesData)) {
      expect(
        container.querySelector(`a[href="/specs/${roleId}"]`),
        `/specs/${roleId}`
      ).toBeTruthy()
    }
  })

  it("switches the section copy to Arabic when the language toggles", () => {
    render(<PuaSpecSheet data={instructor} />)

    expect(screen.getByText("MISSION & IMPACT")).toBeTruthy()

    fireEvent.click(screen.getByText("عربي"))

    expect(screen.getByText("المهمة والأثر")).toBeTruthy()
    expect(screen.queryByText("MISSION & IMPACT")).toBeNull()
  })

  it("reveals a handbook answer when its FAQ row is expanded", () => {
    const faq = instructor.handbook.faq[0]
    render(<PuaSpecSheet data={instructor} />)

    expect(screen.queryByText(faq.a.en)).toBeNull()

    const question = screen.getByText(faq.q.en)
    fireEvent.click(question.closest("button")!)

    expect(screen.getByText(faq.a.en)).toBeTruthy()
  })
})
