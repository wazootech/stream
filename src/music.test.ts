import assert from "node:assert/strict"
import { test } from "node:test"
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

test("reset clears the music line", () => {
  const { state } = run(["music", "TheFatRat - Windfall"])
  assert.equal(run(["reset"], state).state.music, null)
})
