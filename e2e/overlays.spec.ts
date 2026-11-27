// End to end: a click in the dashboard shows up on what OBS draws.
import { expect, send, test } from "./fixtures.ts"

test("goal and splits reach the HUD", async ({ stream }) => {
  const hud = await stream.overlay("hud.html?layout=strip")
  const page = stream.dashboard
  await send(page, "goal", "Ship the dock")
  await send(page, "task add", "write tests")
  await send(page, "task add", "merge")
  await expect(hud.locator("#goal")).toHaveText("Ship the dock")
  await expect(hud.locator("#splits li .name")).toHaveText(["write tests", "merge"])

  await page.getByRole("button", { name: "Start splits" }).click()
  await expect(hud.locator("#splits li.current .time")).toHaveText(/^0:0\d$/)
  await page.getByRole("button", { name: "write tests" }).click()
  await expect(hud.locator("#splits li.done .name")).toHaveText("write tests")
  await expect(hud.locator("#splits li.current .name")).toHaveText("merge")
})

test("the HUD timer appears only while one is set", async ({ stream }) => {
  const hud = await stream.overlay("hud.html?layout=compact")
  await expect(hud.locator("#timer")).toBeHidden()
  await stream.dashboard.locator('form[data-command="timer"] button').click()
  await expect(hud.locator("#clock")).toHaveText(/^2[45]:\d\d$/)
  await stream.dashboard.getByRole("button", { name: "Stop" }).click()
  await expect(hud.locator("#timer")).toBeHidden()
})

test("chat test and clear reach the on-screen chat", async ({ stream }) => {
  const chat = await stream.overlay("chat.html")
  const section = stream.dashboard.locator("section", {
    has: stream.dashboard.getByRole("heading", { name: "Chat on screen" }),
  })
  await section.getByRole("button", { name: "Test" }).click()
  await expect(chat.locator("#lines b").first()).toHaveText("ExampleViewer")
  await section.getByRole("button", { name: "Clear" }).click()
  await expect(chat.locator("#lines .empty")).toBeVisible()
})

test("a test alert shows a card", async ({ stream }) => {
  // The page must be open first: it does not replay alerts saved before it.
  const alerts = await stream.overlay("alerts.html")
  await alerts.waitForFunction(() => window.STREAM_STATE !== undefined)
  const section = stream.dashboard.locator("section", {
    has: stream.dashboard.getByRole("heading", { name: "Alerts" }),
  })
  await section.getByRole("button", { name: "Test" }).click()
  await expect(alerts.locator("#alert")).toHaveClass(/show/)
  await expect(alerts.locator("#name")).toHaveText("ExampleSubscriber")
})

test("the music label reaches the break screen", async ({ stream }) => {
  const screen = await stream.overlay("screen.html?mode=break")
  await expect(screen.locator("#music")).toHaveText(/StreamBeats - Electric/)
  await stream.dashboard.getByRole("button", { name: "Off" }).click()
  await expect(screen.locator("#music")).toBeHidden()
})

test("typed text is never treated as markup", async ({ stream }) => {
  const hud = await stream.overlay("hud.html?layout=strip")
  const hostile = '<img src=x onerror="window.pwned=true">'
  await send(stream.dashboard, "goal", hostile)
  await send(stream.dashboard, "task add", hostile)
  for (const page of [stream.dashboard, hud]) {
    await expect(page.getByText(hostile).first()).toBeVisible()
    await expect(page.locator("img")).toHaveCount(0)
    expect(await page.evaluate(() => "pwned" in window)).toBe(false)
  }
})

test("the HUD timer bar spans its label and clock", async ({ stream }) => {
  const hud = await stream.overlay("hud.html?layout=strip")
  const page = stream.dashboard
  for (const label of ["Go", "A rather long focus block label"]) {
    await page.getByLabel("Timer label").fill(label)
    await page.locator('form[data-command="timer"] button').click()
    await expect(hud.locator("#timer-label")).toHaveText(label)
    const [start, end, bar] = await Promise.all(
      ["#timer-label", "#clock", "#timer .bar"].map(async (selector) => {
        return (await hud.locator(selector).boundingBox())!
      }),
    )
    expect(bar.x).toBeCloseTo(start.x, 0)
    expect(bar.x + bar.width).toBeCloseTo(end.x + end.width, 0)
  }
})
