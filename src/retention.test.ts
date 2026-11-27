import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { expire, RETENTION_MS } from "./retention.ts"
import { defaultState, loadState, statePaths } from "./state.ts"
import type { State } from "./state.ts"

const NOW = Date.now()

function withViewers(...ages: number[]): State {
  return {
    ...defaultState(),
    alerts: ages.map((age, i) => ({
      id: i + 1,
      kind: "sub",
      name: `alert-${age}`,
      detail: "",
      at: NOW - age,
    })),
    chat: ages.map((age, i) => ({
      id: `m${i}`,
      by: `c${i}`,
      name: `chat-${age}`,
      text: "hi",
      at: NOW - age,
    })),
  }
}

test("alerts and chat go at 30 days, and newer ones stay", () => {
  const state = withViewers(RETENTION_MS + 1, RETENTION_MS, RETENTION_MS - 1, 0)
  const kept = expire(state, NOW)
  assert.deepEqual(
    kept.alerts.map((a) => a.id),
    [3, 4],
  )
  assert.deepEqual(
    kept.chat.map((c) => c.id),
    ["m2", "m3"],
  )
})

test("nothing to drop returns the same state", () => {
  const state = withViewers(0)
  assert.equal(expire(state, NOW), state)
})

test("a line saved without a time is dropped", () => {
  const state = withViewers(0)
  delete (state.chat[0] as { at?: number }).at
  assert.deepEqual(expire(state, NOW).chat, [])
})

test("loading deletes expired names from both saved files", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "stream-retention-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const { json, js } = statePaths(dir)
  writeFileSync(json, JSON.stringify(withViewers(RETENTION_MS + 1, 0)))

  const state = loadState(dir)
  assert.equal(state.alerts.length, 1)
  assert.equal(state.chat.length, 1)
  for (const path of [json, js]) {
    const text = readFileSync(path, "utf8")
    assert.ok(!text.includes(`-${RETENTION_MS + 1}`), path)
    assert.ok(text.includes("chat-0"), path)
  }
})
