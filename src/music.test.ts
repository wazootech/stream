import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { BRAND } from "./brand.ts"
import { applyCommand } from "./commands.ts"
import { defaultState, UsageError } from "./state.ts"

const run = (argv: string[], state = defaultState()) => applyCommand(state, argv, 0)

test("music: sets the line and clears it with off", () => {
  const { state, message } = run(["music", "TheFatRat", "-", "Windfall"])
  assert.equal(state.music, "TheFatRat - Windfall")
  assert.match(message, /Now playing: TheFatRat - Windfall/)
  assert.equal(run(["music", "off"], state).state.music, null)
})

test("music: a missing track is a usage error, and long text is cut", () => {
  assert.throws(() => run(["music"]), UsageError)
  assert.equal(run(["music", "x".repeat(300)]).state.music?.length, 120)
})

test("the music label is on by default, and a reset restores it", () => {
  assert.equal(defaultState().music, BRAND.musicLabel)
  const { state } = run(["music", "off"])
  assert.equal(state.music, null)
  assert.equal(run(["reset"], state).state.music, BRAND.musicLabel)
})

test("the dashboard's preset button shows the default label", () => {
  const page = readFileSync(new URL("../dashboard/index.html", import.meta.url), "utf8")
  assert.ok(page.includes(`data-command="music ${BRAND.musicLabel}"`))
})
