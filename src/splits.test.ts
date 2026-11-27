import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { applyCommand } from "./commands.ts"
import { formatSplit, taskMs } from "./splits.ts"
import { defaultState, loadState, statePaths } from "./state.ts"
import type { State } from "./state.ts"

const SEC = 1000
const at = (state: State, seconds: number, ...argv: string[]) =>
  applyCommand(state, argv, seconds * SEC).state

function three(): State {
  let state = defaultState()
  for (const name of ["one", "two", "three"]) state = at(state, 0, "task", "add", name)
  return state
}
const times = (state: State, seconds: number) =>
  state.tasks.map((_, i) => taskMs(state, i, seconds * SEC) / SEC)

test("nothing is timed until the splits start", () => {
  const state = at(three(), 50, "task", "done", "1")
  assert.deepEqual(times(state, 90), [0, 0, 0])
})

test("each finished task keeps the time since the last split", () => {
  let state = at(three(), 100, "task", "start")
  assert.deepEqual(times(state, 130), [30, 0, 0])
  state = at(state, 160, "task", "done", "1")
  state = at(state, 200, "task", "done", "2")
  assert.deepEqual(times(state, 210), [60, 40, 10])
  state = at(state, 230, "task", "done", "3")
  assert.equal(state.splitFrom, null)
  assert.deepEqual(times(state, 999), [60, 40, 30])
})

test("paused time is not counted", () => {
  let state = at(three(), 0, "task", "start")
  state = at(state, 20, "task", "pause")
  assert.deepEqual(times(state, 500), [20, 0, 0])
  state = at(state, 500, "task", "start")
  state = at(state, 510, "task", "done", "1")
  assert.deepEqual(times(state, 510), [30, 0, 0])
})

test("reopening or removing a task keeps time where it was spent", () => {
  let state = at(three(), 0, "task", "start")
  state = at(state, 10, "task", "done", "1")
  state = at(state, 25, "task", "undo", "1")
  assert.deepEqual(times(state, 30), [15, 15, 0])
  state = at(state, 30, "task", "rm", "1")
  assert.deepEqual(times(state, 40), [25, 0])
})

test("starting twice, or with nothing left, changes nothing", () => {
  const running = at(three(), 0, "task", "start")
  assert.equal(at(running, 5, "task", "start").splitFrom, 0)
  const empty = at(defaultState(), 0, "task", "start")
  assert.equal(empty.splitFrom, null)
  assert.equal(at(running, 9, "task", "clear").splitFrom, null)
})

test("formatSplit switches to hours", () => {
  assert.equal(formatSplit(65_900), "1:05")
  assert.equal(formatSplit(3_661_000), "1:01:01")
})

test("tasks saved before splits load with no time", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "stream-splits-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const old = { tasks: [{ text: "old", done: false }] }
  writeFileSync(statePaths(dir).json, JSON.stringify(old))
  const state = loadState(dir)
  assert.equal(state.tasks[0].ms, 0)
  assert.equal(state.splitFrom, null)
})
