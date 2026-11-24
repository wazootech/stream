import assert from "node:assert/strict"
import { test } from "node:test"
import { applyCommand } from "./commands.ts"
import { MAX_ALERTS } from "./commands/alerts.ts"
import { defaultState, UsageError } from "./state.ts"

const NOW = 1_700_000_000_000
const run = (argv: string[], state = defaultState(), now = NOW) =>
  applyCommand(state, argv, now)

test("alert: queues a follow with its name and detail", () => {
  const { state, message } = run(["alert", "follow", "Ada"])
  assert.equal(state.alerts.length, 1)
  assert.deepEqual(state.alerts[0], {
    id: NOW,
    kind: "follow",
    name: "Ada",
    detail: "",
    at: NOW,
  })
  assert.match(message, /follow from Ada/)

  const next = run(["alert", "raid", "Grace", "42", "viewers"], state, NOW + 1)
  assert.equal(next.state.alerts[1].detail, "42 viewers")
})

test("alert: aliases map onto the five kinds", () => {
  const kinds = ["follower", "subscribe", "resub", "bits", "gift", "RAID"].map(
    (kind) => run(["alert", kind, "x"]).state.alerts[0].kind,
  )
  assert.deepEqual(kinds, ["follow", "sub", "sub", "cheer", "gift", "raid"])
})

test("alert: ids always increase, even within one millisecond", () => {
  let { state } = run(["alert", "follow", "a"])
  ;({ state } = run(["alert", "follow", "b"], state))
  ;({ state } = run(["alert", "follow", "c"], state))
  const ids = state.alerts.map((a) => a.id)
  assert.deepEqual(ids, [NOW, NOW + 1, NOW + 2])
})

test("alert: only the newest alerts are kept", () => {
  let state = defaultState()
  for (let i = 0; i < MAX_ALERTS + 5; i++) {
    ;({ state } = run(["alert", "follow", `user${i}`], state))
  }
  assert.equal(state.alerts.length, MAX_ALERTS)
  assert.equal(state.alerts.at(-1)?.name, `user${MAX_ALERTS + 4}`)
})

test("alert: long names and details are cut down", () => {
  const { state } = run(["alert", "sub", "n".repeat(100), "d".repeat(200)])
  assert.equal(state.alerts[0].name.length, 40)
  assert.equal(state.alerts[0].detail.length, 80)
})

test("alert: test queues one of each kind, clear empties the list", () => {
  const { state } = run(["alert", "test"])
  assert.deepEqual(
    state.alerts.map((a) => a.kind),
    ["follow", "sub", "gift", "raid", "cheer"],
  )
  assert.deepEqual(run(["alert", "clear"], state).state.alerts, [])
})

test("alert: a missing kind or name is a usage error", () => {
  assert.throws(() => run(["alert"]), UsageError)
  assert.throws(() => run(["alert", "nonsense", "x"]), UsageError)
  assert.throws(() => run(["alert", "follow"]), UsageError)
})

test("reset clears alerts along with the rest of the session", () => {
  const { state } = run(["alert", "follow", "Ada"])
  assert.deepEqual(run(["reset"], state).state.alerts, [])
})
