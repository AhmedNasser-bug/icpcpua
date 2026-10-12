import type { Page } from "@playwright/test"
import { test, expect } from "./fixtures"

const REGISTER_ENDPOINT = "**/api/trainees/register"

const TRAINEE = {
  id: "202300481",
  fullName: "Ahmed Nasser",
  universityId: "202300481",
  email: "ahmed@example.com",
  phone: "01000000000",
  academicYear: "Year 2",
  track: "level_2",
  codeforcesHandle: "ahmed_cp",
  status: "active",
  pointsTotal: 10,
}

async function fillJoinForm(page: Page) {
  await page.getByPlaceholder("e.g. Ahmed Khalid").fill("Ahmed Nasser")
  await page.getByPlaceholder("e.g. 202300481").fill("202300481")
  await page.getByPlaceholder("you@pua.edu.eg").fill("ahmed@example.com")
  await page.getByPlaceholder("01012345678").fill("01000000000")
  await page.getByTitle("Academic Year").selectOption("Year 2")
  await page.getByTitle("Training Track").selectOption("level_2")
  await page.getByPlaceholder("tourist").fill("ahmed_cp")
}

test.describe("trainee registration", () => {
  test("submits the join form and shows the awarded points", async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined

    await page.route(REGISTER_ENDPOINT, async (route) => {
      requestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Trainee registered successfully! +10 welcome points added to your leaderboard standing.",
          trainee: TRAINEE,
        }),
      })
    })

    await page.goto("/join")
    await fillJoinForm(page)
    await page.getByRole("button", { name: /SUBMIT REGISTRATION/ }).click()

    await expect(page.getByRole("heading", { name: "YOU'RE IN THE SQUAD!" })).toBeVisible()
    await expect(page.getByText("+10 POINTS AWARDED")).toBeVisible()
    await expect(page.getByText(/Cadet Ahmed Nasser \(Uni ID: 202300481\)/)).toBeVisible()

    expect(requestBody).toEqual({
      fullName: "Ahmed Nasser",
      universityId: "202300481",
      email: "ahmed@example.com",
      phone: "01000000000",
      academicYear: "Year 2",
      track: "level_2",
      codeforcesHandle: "ahmed_cp",
    })
  })

  test("stays on the form and shows the API error", async ({ page }) => {
    await page.route(REGISTER_ENDPOINT, (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "A trainee with this University ID is already registered in the system.",
        }),
      })
    )

    await page.goto("/join")
    await fillJoinForm(page)
    await page.getByRole("button", { name: /SUBMIT REGISTRATION/ }).click()

    await expect(
      page.getByText("A trainee with this University ID is already registered in the system.")
    ).toBeVisible()
    await expect(page.getByRole("button", { name: /SUBMIT REGISTRATION/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "YOU'RE IN THE SQUAD!" })).toHaveCount(0)
  })
})
