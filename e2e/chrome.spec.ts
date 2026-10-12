import { test, expect } from "./fixtures"

test.describe("site chrome", () => {
  test("navbar dropdown navigates to a directory", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: "Toggle explore directory menu" }).click()
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    await expect(menu.getByText("COMMUNITY HUBS & ARCHIVES")).toBeVisible()

    await menu.getByRole("link", { name: /FAQ/ }).click()

    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.getByRole("heading", { name: "FREQUENTLY ASKED QUESTIONS." })).toBeVisible()
  })

  test("footer links navigate to real pages", async ({ page }) => {
    await page.goto("/")
    const footer = page.locator("footer")

    await footer.getByRole("link", { name: "Hall of Fame (Legends)" }).click()
    await expect(page).toHaveURL(/\/hall-of-fame$/)
    await expect(page.getByRole("heading", { name: "LEGENDS." })).toBeVisible()

    await footer.getByRole("link", { name: "Instructor Blueprint" }).click()
    await expect(page).toHaveURL(/\/specs\/instructor$/)
    await expect(page.getByRole("heading", { name: "THE INSTRUCTOR (TECHNICAL)" })).toBeVisible()
  })

  test("external community links expose their destination", async ({ page }) => {
    await page.goto("/")
    const footer = page.locator("footer")

    await expect(footer.getByRole("link", { name: /Codeforces Group & Gyms/ })).toHaveAttribute(
      "href",
      "https://codeforces.com"
    )
    await expect(footer.getByRole("link", { name: /Discord Headquarters/ })).toHaveAttribute(
      "href",
      "https://discord.gg"
    )
    await expect(footer.getByRole("link", { name: /Open Source GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com"
    )
  })

  test.describe("mobile menu", () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test("opens and navigates", async ({ page }) => {
      await page.goto("/")

      await page.getByRole("button", { name: "Toggle menu" }).click()

      const eventsLink = page.getByRole("link", { name: /^EVENTS & SESSIONS/ })
      await expect(eventsLink).toBeVisible()
      await eventsLink.click()

      await expect(page).toHaveURL(/\/events$/)
      await expect(page.getByRole("heading", { name: "EVENTS & TRAINING" })).toBeVisible()
    })
  })
})
