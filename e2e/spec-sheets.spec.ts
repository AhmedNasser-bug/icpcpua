import { test, expect } from "./fixtures"

const OTHER_ROLES = ["instructor", "technical", "hr", "marketing", "design-dev"]

test.describe("role spec sheets", () => {
  test("highlights only its own navigator entry", async ({ page }) => {
    await page.goto("/specs/ops-pr")

    const blueprint = page.locator("#blueprint")
    await expect(blueprint.locator('a[href="/specs/ops-pr"]')).toHaveClass(/ring-2/)

    for (const role of OTHER_ROLES) {
      await expect(blueprint.locator(`a[href="/specs/${role}"]`)).not.toHaveClass(/ring-2/)
    }
  })

  test("TOP OF SPEC scrolls back to the top", async ({ page }) => {
    await page.goto("/specs/ops-pr")

    const topLink = page.getByRole("link", { name: "TOP OF SPEC" })
    await topLink.scrollIntoViewIfNeeded()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    await topLink.click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })

  test("language toggle switches the copy", async ({ page }) => {
    await page.goto("/specs/ops-pr")

    await expect(page.getByText("MISSION & IMPACT").first()).toBeVisible()

    await page.getByRole("button", { name: "عربي" }).click()

    await expect(page.getByText("المهمة والأثر").first()).toBeVisible()
    await expect(page.getByText("MISSION & IMPACT")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "ENGLISH" })).toBeVisible()
  })
})
