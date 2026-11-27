import { expect, send, test } from "./fixtures.ts"

test("setting the goal and title saves them and shows them", async ({ stream }) => {
  const page = stream.dashboard
  await send(page, "goal", "Review open PRs")
  await send(page, "title", "Late Night")
  await expect(page.locator("#now-goal")).toHaveText("Review open PRs")
  await expect(page.locator("#now-title")).toHaveText("Late Night")
  await expect(page.locator('form[data-command="goal"] input')).toHaveValue("")
  expect(stream.state()).toMatchObject({
    goal: "Review open PRs",
    title: "Late Night",
  })
})

test("tasks are added, split, paused, reopened, and removed", async ({ stream }) => {
  const page = stream.dashboard
  await send(page, "task add", "first")
  await send(page, "task add", "second")
  await page.getByRole("button", { name: "Start splits" }).click()
  await expect.poll(() => stream.state().splitFrom).not.toBeNull()

  const first = page.getByRole("button", { name: "first", exact: true })
  await first.click()
  await expect(page.locator("#tasks li.done")).toHaveText(/first/)
  expect(stream.state().tasks[0].ms).toBeGreaterThan(0)

  await page.getByRole("button", { name: "Pause" }).click()
  await expect.poll(() => stream.state().splitFrom).toBeNull()

  await first.click()
  await expect(page.locator("#tasks li.done")).toHaveCount(0)
  await page.getByRole("button", { name: "Remove task 1" }).click()
  await expect(page.locator("#tasks li")).toHaveText([/second/])
  expect(stream.state().tasks.map((task) => task.text)).toEqual(["second"])
})

test("clearing tasks needs a confirmation", async ({ stream }) => {
  const page = stream.dashboard
  await send(page, "task add", "keep me")
  const clear = page.getByRole("button", { name: "Clear tasks", exact: true })
  const confirm = page.getByRole("button", { name: "Confirm clear tasks" })
  await expect(confirm).toBeHidden()

  await clear.click()
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(confirm).toBeHidden()
  expect(stream.state().tasks).toHaveLength(1)

  await clear.click()
  await confirm.click()
  await expect(page.locator("#tasks li")).toHaveText("No tasks yet.")
  expect(stream.state().tasks).toEqual([])
})

test("a double click on reset backs out instead of resetting", async ({ stream }) => {
  const page = stream.dashboard
  await send(page, "goal", "do not lose this")
  await page.getByRole("button", { name: "Reset session" }).dblclick()
  await expect(page.getByRole("button", { name: "Reset session" })).toBeVisible()
  expect(stream.state().goal).toBe("do not lose this")

  await page.getByRole("button", { name: "Reset session" }).click()
  await page.getByRole("button", { name: "Confirm reset" }).click()
  await expect(page.locator("#now-goal")).toHaveText("(no goal yet)")
  expect(stream.state().goal).toBe("")
})

test("the timer and break start and stop", async ({ stream }) => {
  const page = stream.dashboard
  const stop = page.getByRole("button", { name: "Stop" })
  await expect(stop).toBeDisabled()

  await page.getByLabel("Timer minutes").fill("10")
  await page.getByLabel("Timer label").fill("Deep work")
  await page.locator('form[data-command="timer"] button').click()
  await expect(page.locator("#now-timer")).toHaveText("Deep work")
  await expect(page.locator("#clock")).toHaveText(/^(10:00|09:5\d)$/)

  await page.getByRole("button", { name: "Break", exact: true }).click()
  await expect(page.locator("#now-timer")).toHaveText("Break")
  await stop.click()
  await expect(page.locator("#clock")).toHaveText("--:--")
  expect(stream.state().timer).toBeNull()
})

test("the chat, alert, and music buttons work", async ({ stream }) => {
  const page = stream.dashboard
  const card = (title: string) =>
    page.locator("section", { has: page.getByRole("heading", { name: title }) })

  await card("Chat on screen").getByRole("button", { name: "Test" }).click()
  await expect.poll(() => stream.state().chat.length).toBeGreaterThan(0)
  await card("Chat on screen").getByRole("button", { name: "Clear" }).click()
  await expect.poll(() => stream.state().chat.length).toBe(0)

  await card("Alerts").getByRole("button", { name: "Test" }).click()
  await expect(page.locator("#alert-count")).toHaveText(/^7 recent alerts/)
  await card("Alerts").getByRole("button", { name: "Clear" }).click()
  await expect(page.locator("#alert-count")).toHaveText(/^0 recent alerts/)

  await card("Music label").getByRole("button", { name: "Off" }).click()
  await expect(page.locator("#now-music")).toHaveText("(hidden)")
  await card("Music label")
    .getByRole("button", { name: /StreamBeats/ })
    .click()
  await expect(page.locator("#now-music")).toHaveText("StreamBeats - Electric")
})

test("a stopped server is reported on the page", async ({ stream }) => {
  stream.stopServer()
  await expect(stream.dashboard.locator("#message")).toHaveText(/not responding/)
})

test("the page fits a narrow dock without sideways scrolling", async ({ stream }) => {
  const page = stream.dashboard
  await send(page, "task add", "a".repeat(120))
  await page.setViewportSize({ width: 300, height: 800 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test("typing ahead of a slow save is not wiped", async ({ stream }) => {
  const page = stream.dashboard
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route("**/api/command", async (route) => {
    await gate
    await route.continue()
  })
  const input = page.getByRole("textbox", { name: "Task" })
  await send(page, "task add", "first")
  await input.fill("second")
  release()
  await expect(page.locator("#tasks li")).toHaveText([/first/])
  await expect(input).toHaveValue("second")
})
