import { describe, expect, it } from "vitest"
import { rolesData, type RoleData, type RoleId } from "@/data/recruitment/roles"

const REGISTERED_ROLE_IDS: RoleId[] = [
  "instructor",
  "technical",
  "ops-pr",
  "hr",
  "marketing",
  "design-dev",
]

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const LEVEL_BADGE = /^LVL_\d{2}$/

function expectBilingual(value: { en: string; ar: string }, context: string) {
  expect(value.en.trim(), `${context} (en)`).not.toBe("")
  expect(value.ar.trim(), `${context} (ar)`).not.toBe("")
}

function expectRoleShape(role: RoleData, context: string) {
  expect(role.roleId.trim(), `${context} roleId`).not.toBe("")
  expect(role.roleTitle.trim(), `${context} roleTitle`).not.toBe("")
  expect(role.arabicTitle.trim(), `${context} arabicTitle`).not.toBe("")
  expect(role.levelBadge, `${context} levelBadge`).toMatch(LEVEL_BADGE)
  expect(role.version.trim(), `${context} version`).not.toBe("")
  expect(role.issued.trim(), `${context} issued`).not.toBe("")
  expect(role.location.trim(), `${context} location`).not.toBe("")
  expect(role.description.trim(), `${context} description`).not.toBe("")
  expect(role.themeColor, `${context} themeColor`).toMatch(HEX_COLOR)
  expect(role.themeText, `${context} themeText`).toMatch(HEX_COLOR)
  if (role.antiGoalColor !== undefined) {
    expect(role.antiGoalColor, `${context} antiGoalColor`).toMatch(HEX_COLOR)
  }

  expect(role.sellingPoints.length, `${context} sellingPoints`).toBeGreaterThan(0)
  role.sellingPoints.forEach((point, index) => {
    expect(point.trim(), `${context} sellingPoints[${index}]`).not.toBe("")
  })

  expect(role.owns.length, `${context} owns`).toBeGreaterThan(0)
  role.owns.forEach((item, index) => {
    expect(item.trim(), `${context} owns[${index}]`).not.toBe("")
  })

  expect(role.metrics.length, `${context} metrics`).toBeGreaterThan(0)
  role.metrics.forEach((metric, index) => {
    expect(metric.value.trim(), `${context} metrics[${index}].value`).not.toBe("")
    expect(metric.label.trim(), `${context} metrics[${index}].label`).not.toBe("")
  })

  expect(role.antiGoals.length, `${context} antiGoals`).toBeGreaterThan(0)
  role.antiGoals.forEach((item, index) => {
    expect(item.trim(), `${context} antiGoals[${index}]`).not.toBe("")
  })

  expect(role.problemsSolved.length, `${context} problemsSolved`).toBeGreaterThan(0)
  role.problemsSolved.forEach((item, index) => {
    expectBilingual(item.title, `${context} problemsSolved[${index}].title`)
    expectBilingual(item.desc, `${context} problemsSolved[${index}].desc`)
  })

  expect(role.impact.length, `${context} impact`).toBeGreaterThan(0)
  role.impact.forEach((item, index) => {
    expectBilingual(item.title, `${context} impact[${index}].title`)
    expectBilingual(item.desc, `${context} impact[${index}].desc`)
  })

  expectBilingual(role.handbook.vision, `${context} handbook.vision`)

  expect(role.handbook.rolesDistribution.length, `${context} handbook.rolesDistribution`).toBeGreaterThan(0)
  role.handbook.rolesDistribution.forEach((item, index) => {
    expectBilingual(item.title, `${context} rolesDistribution[${index}].title`)
    expectBilingual(item.desc, `${context} rolesDistribution[${index}].desc`)
  })

  expect(role.handbook.responsibilities.length, `${context} handbook.responsibilities`).toBeGreaterThan(0)
  role.handbook.responsibilities.forEach((item, index) => {
    expectBilingual(item.title, `${context} responsibilities[${index}].title`)
    expectBilingual(item.desc, `${context} responsibilities[${index}].desc`)
  })

  expect(role.handbook.dosAndDonts.avoid.length, `${context} dosAndDonts.avoid`).toBeGreaterThan(0)
  role.handbook.dosAndDonts.avoid.forEach((item, index) => {
    expectBilingual(item, `${context} dosAndDonts.avoid[${index}]`)
  })

  expect(role.handbook.dosAndDonts.prefer.length, `${context} dosAndDonts.prefer`).toBeGreaterThan(0)
  role.handbook.dosAndDonts.prefer.forEach((item, index) => {
    expectBilingual(item, `${context} dosAndDonts.prefer[${index}]`)
  })

  expect(role.handbook.faq.length, `${context} handbook.faq`).toBeGreaterThan(0)
  role.handbook.faq.forEach((item, index) => {
    expectBilingual(item.q, `${context} handbook.faq[${index}].q`)
    expectBilingual(item.a, `${context} handbook.faq[${index}].a`)
  })
}

describe("rolesData registry", () => {
  it("registers exactly the six expected role keys", () => {
    expect(Object.keys(rolesData)).toEqual(REGISTERED_ROLE_IDS)
  })

  it.each(REGISTERED_ROLE_IDS)("provides complete structural metadata for %s", (roleKey) => {
    const role = rolesData[roleKey]
    expect(role, `rolesData["${roleKey}"]`).toBeDefined()
    expectRoleShape(role, roleKey)
  })

  it("keeps the technical role sharing the instructor identity metadata", () => {
    const sharedKeys = [
      "roleId",
      "roleTitle",
      "arabicTitle",
      "levelBadge",
      "version",
      "issued",
      "location",
      "description",
      "sellingPoints",
      "owns",
      "metrics",
      "antiGoals",
      "themeColor",
      "themeText",
      "antiGoalColor",
      "handbook",
    ] as const

    for (const key of sharedKeys) {
      expect(rolesData.technical[key], `technical.${key}`).toEqual(rolesData.instructor[key])
    }
  })

  it("keeps level badges unique across the five distinct committees", () => {
    const committeeKeys: RoleId[] = ["instructor", "ops-pr", "hr", "marketing", "design-dev"]
    const badges = committeeKeys.map((key) => rolesData[key].levelBadge)
    expect(new Set(badges).size).toBe(badges.length)
  })

  it("aligns each numeric role id with its level badge", () => {
    for (const roleKey of REGISTERED_ROLE_IDS) {
      const role = rolesData[roleKey]
      const numericSuffix = role.roleId.split("-").at(-1)
      expect(role.levelBadge, `${roleKey} levelBadge vs ${role.roleId}`).toBe(`LVL_${numericSuffix}`)
    }
  })
})
