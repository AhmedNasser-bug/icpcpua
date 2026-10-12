import type { Page } from "@playwright/test"
import { test, expect } from "./fixtures"

test.beforeEach(async ({ page }) => {
  // The calendar renders from fixed data, but pinning "today" keeps the spec
  // deterministic while leaving timers and animations running.
  await page.clock.setFixedTime(new Date("2023-10-04T12:00:00Z"))
})

async function goToMonth(page: Page, label: "Previous month" | "Next month", times: number) {
  for (let i = 0; i < times; i++) {
    await page.getByRole("button", { name: label }).click()
  }
}

test.describe("events calendar", () => {
  test("navigates months and hides events outside the shown month", async ({ page }) => {
    await page.goto("/events")

    await expect(page.getByRole("heading", { name: "OCTOBER 2023" })).toBeVisible()

    await goToMonth(page, "Next month", 1)
    await expect(page.getByRole("heading", { name: "NOVEMBER 2023" })).toBeVisible()
    await expect(page.locator(".calendar-cell button")).toHaveCount(0)

    await goToMonth(page, "Previous month", 1)
    await expect(page.getByRole("heading", { name: "OCTOBER 2023" })).toBeVisible()
    await expect(page.locator(".calendar-cell button")).toHaveCount(5)

    await goToMonth(page, "Previous month", 1)
    await expect(page.getByRole("heading", { name: "SEPTEMBER 2023" })).toBeVisible()
  })

  test("places an event on the correct day", async ({ page }) => {
    await page.goto("/events")

    // Both bootcamp days share the same truncated calendar label.
    const bootcampCells = page.locator(".calendar-cell").filter({ hasText: "Graph Theory…" })
    await expect(bootcampCells).toHaveCount(2)
    await expect(bootcampCells.nth(0).getByText("5", { exact: true })).toBeVisible()
    await expect(bootcampCells.nth(1).getByText("6", { exact: true })).toBeVisible()
  })

  test("shows an empty month with no events", async ({ page }) => {
    await page.goto("/events")

    await goToMonth(page, "Previous month", 3)
    await expect(page.getByRole("heading", { name: "JULY 2023" })).toBeVisible()
    await expect(page.locator(".calendar-cell button")).toHaveCount(0)
  })

  test("routes REGISTER NOW to the join page", async ({ page }) => {
    await page.goto("/events")

    await page.getByRole("button", { name: /ECPC Qualifications/ }).click()
    const registerNow = page.getByRole("link", { name: "REGISTER NOW" })
    await expect(registerNow).toBeVisible()
    await registerNow.click()

    await expect(page).toHaveURL(/\/join$/)
  })
})
