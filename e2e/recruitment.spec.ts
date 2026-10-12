import { test, expect } from "./fixtures"

test.describe("recruitment role cards", () => {
  // Five concurrent SwiftShader scenes need more than the default budget.
  test.slow()

  test("mounts a live WebGL canvas for each of the five cards", async ({ page }) => {
    const runtimeErrors: string[] = []

    page.on("pageerror", (error) => runtimeErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error" && /webgl|context lost/i.test(message.text())) {
        runtimeErrors.push(message.text())
      }
    })

    await page.goto("/recruitment")

    const cards = page.locator("#roles > div")
    await expect(cards).toHaveCount(5)

    for (let i = 0; i < 5; i++) {
      const canvas = cards.nth(i).locator("canvas")
      await canvas.scrollIntoViewIfNeeded()
      await expect(canvas).toBeVisible()

      const box = await canvas.boundingBox()
      expect(box?.width ?? 0).toBeGreaterThan(0)
      expect(box?.height ?? 0).toBeGreaterThan(0)

      const contextAlive = await canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement
        const gl = canvasElement.getContext("webgl2") ?? canvasElement.getContext("webgl")
        return gl !== null && !gl.isContextLost()
      })
      expect(contextAlive, `card ${i + 1} owns a live WebGL context`).toBe(true)
    }

    // The inspector console canvas also mounts through the lazy loader and
    // must survive a role switch, which unmounts and remounts it.
    const consoleCanvas = page.locator("main > div canvas").first()
    await consoleCanvas.scrollIntoViewIfNeeded()
    await expect(consoleCanvas).toBeVisible()

    const isCanvasAlive = (element: Element) => {
      const canvasElement = element as HTMLCanvasElement
      const gl = canvasElement.getContext("webgl2") ?? canvasElement.getContext("webgl")
      return gl !== null && !gl.isContextLost()
    }

    expect(await consoleCanvas.evaluate(isCanvasAlive), "console owns a live WebGL context").toBe(true)

    await page.getByRole("button", { name: /Operations & PR/ }).click()
    await expect(consoleCanvas).toBeVisible()
    expect(await consoleCanvas.evaluate(isCanvasAlive), "console survives a role switch").toBe(true)

    expect(runtimeErrors).toEqual([])
  })
})
