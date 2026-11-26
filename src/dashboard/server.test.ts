import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { test } from "node:test"
import { loadState, statePaths } from "../state.ts"
import { readAsset } from "./static.ts"
import { startDashboard } from "./testing.ts"

test("a command is saved for the CLI and the overlays", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  const reply = await command({ argv: ["goal", "Ship the dock"] })
  assert.equal(reply.status, 200)
  const body = JSON.parse(reply.text)
  assert.equal(body.message, "Goal: Ship the dock")
  assert.match(body.status, /Goal: Ship the dock/)
  assert.equal(loadState(stateDir).goal, "Ship the dock")
  assert.match(readFileSync(statePaths(stateDir).js, "utf8"), /Ship the dock/)
})

test("every button on the page maps to a command that works", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  const setup = [
    ["title", "Late Night"],
    ["timer", "25", "Block 1"],
    ["break", "5"],
    ["task", "add", "<img src=x onerror=boom>"],
    ["predict", "it builds"],
    ["music", "Artist - Title"],
  ]
  const html = readAsset("/")?.body.toString("utf8") ?? ""
  const buttons = [...html.matchAll(/<button[^>]*?data-command="([^"]+)"/g)]
  const clicks = buttons.map((match) => match[1].split(" "))
  assert.ok(clicks.some((argv) => argv[0] === "reset"))

  for (const argv of [...setup, ...clicks]) {
    // "hit" settles the prediction, so put another on air before "miss".
    if (argv[1] === "miss") await command({ argv: ["predict", "again"] })
    const reply = await command({ argv })
    assert.equal(reply.status, 200, `${argv.join(" ")}: ${reply.text}`)
  }
  assert.equal(loadState(stateDir).title, "Late Night")
})

test("state and status are readable without writing anything", async (t) => {
  const { send, command, stateDir } = await startDashboard(t)
  await command({ argv: ["goal", "read me"] })
  const before = readFileSync(statePaths(stateDir).json, "utf8")

  const reply = await send({ path: "/api/state?t=1" })
  assert.equal(JSON.parse(reply.text).state.goal, "read me")
  assert.equal((await command({ argv: ["status"] })).status, 200)
  assert.equal(readFileSync(statePaths(stateDir).json, "utf8"), before)
})

test("a task button refuses to act on a renumbered list", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  await command({ argv: ["task", "add", "first"] })
  await command({ argv: ["task", "add", "second"] })

  const rm = { argv: ["task", "rm", "1"], expect: "first" }
  assert.equal((await command(rm)).status, 200)
  assert.equal((await command(rm)).status, 409)
  assert.deepEqual(
    loadState(stateDir).tasks.map((task) => task.text),
    ["second"],
  )
})

test("usage errors and malformed bodies are 400s that change nothing", async (t) => {
  const { command, stateDir } = await startDashboard(t)
  const bad = [
    "not json",
    "null",
    {},
    { argv: [] },
    { argv: "goal x" },
    { argv: ["goal", 5] },
    { argv: Array(9).fill("x") },
    { argv: ["goal", "x"], expect: 1 },
    { argv: ["goal"] },
    { argv: ["timer", "soon"] },
    { argv: ["frobnicate"] },
  ]
  for (const payload of bad) {
    const reply = await command(payload)
    assert.equal(reply.status, 400, JSON.stringify(payload))
    assert.ok(JSON.parse(reply.text).error)
  }
  assert.equal(loadState(stateDir).goal, "")
})

test("a broken state file is a 500 that hides details", async (t) => {
  const { send, stateDir } = await startDashboard(t)
  t.mock.method(console, "error", () => {})
  writeFileSync(statePaths(stateDir).json, "{ nope")
  const reply = await send({ path: "/api/state" })
  assert.equal(reply.status, 500)
  assert.doesNotMatch(reply.text, /nope|SyntaxError/)
})
