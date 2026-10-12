import { describe, expect, it } from "vitest"
import {
  CONTEST_LOGISTICS_FAQ,
  CORE_FAQ_ITEMS,
  OFFICIAL_COMMUNITY_LINKS,
  type FaqItemData,
} from "@/data/faq"

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

function expectNonEmpty(value: string, context: string) {
  expect(value.trim(), context).not.toBe("")
}

function expectAnswer(answer: FaqItemData["answer"]["en"], context: string) {
  expectNonEmpty(answer.intro, `${context}.intro`)
  answer.points?.forEach((point, index) => {
    expectNonEmpty(point.label, `${context}.points[${index}].label`)
    expectNonEmpty(point.text, `${context}.points[${index}].text`)
  })
}

describe("CORE_FAQ_ITEMS", () => {
  it("contains the nine published questions numbered in order", () => {
    expect(CORE_FAQ_ITEMS.length).toBe(9)
    expect(CORE_FAQ_ITEMS.map((item) => item.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("uses unique ids and numbers", () => {
    const ids = CORE_FAQ_ITEMS.map((item) => item.id)
    const numbers = CORE_FAQ_ITEMS.map((item) => item.number)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(numbers).size).toBe(numbers.length)
    ids.forEach((id, index) => expectNonEmpty(id, `items[${index}].id`))
  })

  it.each(CORE_FAQ_ITEMS.map((item) => [item.id, item] as const))(
    "provides bilingual question and answer content for %s",
    (_id, item) => {
      expectNonEmpty(item.badge.en, `${item.id}.badge.en`)
      expectNonEmpty(item.badge.ar, `${item.id}.badge.ar`)
      if (item.badgeColor !== undefined) {
        expect(item.badgeColor, `${item.id}.badgeColor`).toMatch(HEX_COLOR)
      }
      expectNonEmpty(item.question.en, `${item.id}.question.en`)
      expectNonEmpty(item.question.ar, `${item.id}.question.ar`)
      expectAnswer(item.answer.en, `${item.id}.answer.en`)
      expectAnswer(item.answer.ar, `${item.id}.answer.ar`)
    }
  )

  it("keeps every link complete and well formed", () => {
    const links = CORE_FAQ_ITEMS.flatMap((item) => item.links ?? [])
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expectNonEmpty(link.label.en, "link.label.en")
      expectNonEmpty(link.label.ar, "link.label.ar")
      expect(link.url).toMatch(/^https?:\/\//)
      expect(["whatsapp", "discord", "web"]).toContain(link.type)
    }
  })
})

describe("CONTEST_LOGISTICS_FAQ", () => {
  it("contains three entries with unique ids", () => {
    expect(CONTEST_LOGISTICS_FAQ.length).toBe(3)
    const ids = CONTEST_LOGISTICS_FAQ.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(CONTEST_LOGISTICS_FAQ.map((item) => [item.id, item] as const))(
    "provides complete bilingual logistics content for %s",
    (_id, item) => {
      expectNonEmpty(item.badge, `${item.id}.badge`)
      expectNonEmpty(item.qEn, `${item.id}.qEn`)
      expectNonEmpty(item.qAr, `${item.id}.qAr`)
      expectNonEmpty(item.aEn, `${item.id}.aEn`)
      expectNonEmpty(item.aAr, `${item.id}.aAr`)
    }
  )
})

describe("OFFICIAL_COMMUNITY_LINKS", () => {
  it("exposes https links for every channel", () => {
    for (const [name, url] of Object.entries(OFFICIAL_COMMUNITY_LINKS)) {
      expect(url, name).toMatch(/^https:\/\//)
    }
  })
})
