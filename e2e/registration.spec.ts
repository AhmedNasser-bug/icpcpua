import { test, expect } from "./fixtures"

test.describe("admissions waitlist", () => {
  test("submits the waitlist form and confirms priority access", async ({ page }) => {
    await page.goto("/join")

    await page
      .getByLabel("Email address for waitlist notification")
      .fill("student@pua.edu.eg")
    await page.getByLabel("University ID (optional)").fill("202300481")
    await page.getByRole("button", { name: /JOIN WAITLIST/ }).click()

    await expect(page.getByText("YOU'RE FIRST IN LINE!")).toBeVisible()
    await expect(page.getByText("WAITLIST CONFIRMED // PRIORITY PASS LOCKED")).toBeVisible()
    await expect(page.getByText("student@pua.edu.eg")).toBeVisible()

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
    )
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      email: "student@pua.edu.eg",
      universityId: "202300481",
      referralCode: "",
    })
  })

  test("keeps the referral scout code attached to the waitlist entry", async ({ page }) => {
    await page.goto("/join?ref=SCOUT-01")

    await expect(page.getByText(/INVITED BY SCOUT:/)).toBeVisible()
    await expect(page.getByText("SCOUT-01")).toBeVisible()

    await page
      .getByLabel("Email address for waitlist notification")
      .fill("referred@pua.edu.eg")
    await page.getByRole("button", { name: /JOIN WAITLIST/ }).click()

    await expect(page.getByText("YOU'RE FIRST IN LINE!")).toBeVisible()

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pua_icpc_waitlist") || "[]")
    )
    expect(saved[0]).toMatchObject({
      email: "referred@pua.edu.eg",
      referralCode: "SCOUT-01",
    })
  })
})
