import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import type { TestContext } from "node:test"
import { MAX_ALERTS } from "../commands/alerts.ts"
import { loadState } from "../state.ts"
import { ApiError } from "./api.ts"
import { runBridge, verdict } from "./bridge.ts"
import type { Card } from "./events.ts"
import { SetupError } from "./files.ts"
import { OAuthError } from "./oauth.ts"
import { parseOptions } from "./options.ts"
import { queueCards } from "./queue.ts"
import type { PollResult, Source } from "./source.ts"

const card = (name: string): Card => ({ kind: "sub", name, detail: "" })
const quota = new ApiError(403, "quotaExceeded")

/** A source that plays back results and errors, noting when it was polled. */
function scripted(name: string, steps: (PollResult | Error)[], clock: { now: number }) {
  const polledAt: number[] = []
  const source: Source = {
    name,
    baseMs: 1000,
    async poll() {
      polledAt.push(clock.now)
      const step = steps.shift() ?? quota
      if (step instanceof Error) throw step
      return step
    },
  }
  return { source, polledAt }
}

function run(sources: Source[], clock: { now: number }) {
  const emitted: string[] = []
  const done = runBridge({
    sources,
    emit: (cards) => {
      emitted.push(...cards.map((c) => c.name))
      return []
    },
    log: () => {},
    now: () => clock.now,
    sleep: async (ms) => void (clock.now += ms),
  })
  return { done, emitted }
}

test("bridge: waits as asked, backs off on errors, stops on quota", async () => {
  const clock = { now: 0 }
  const { source, polledAt } = scripted(
    "chat",
    [
      { cards: [card("a")], waitMs: 5000 },
      new TypeError("fetch failed"),
      new ApiError(503, "backendError"),
      { cards: [card("b")], waitMs: 5000 },
    ],
    clock,
  )
  const { done, emitted } = run([source], clock)
  await assert.rejects(done, quota)
  assert.deepEqual(polledAt, [0, 5000, 7000, 11_000, 16_000])
  assert.deepEqual(emitted, ["a", "b"])
})

test("bridge: queues cards already read when another source stops it", async () => {
  const clock = { now: 0 }
  const good = scripted("chat", [{ cards: [card("a")], waitMs: 1000 }], clock)
  const bad = scripted("subscribers", [quota], clock)
  const { done, emitted } = run([good.source, bad.source], clock)
  await assert.rejects(done, quota)
  assert.deepEqual(emitted, ["a"])
})

test("bridge: a forbidden source is turned off and the rest carry on", async () => {
  const clock = { now: 0 }
  const off = scripted(
    "subscribers",
    [new ApiError(403, "subscriptionForbidden")],
    clock,
  )
  await run([off.source], clock).done
  assert.deepEqual(off.polledAt, [0])
})

test("bridge: which errors stop, disable, or retry", () => {
  assert.equal(verdict(new SetupError("x")), "stop")
  assert.equal(verdict(new OAuthError("invalid_grant")), "stop")
  assert.equal(verdict(new OAuthError("http_503")), "retry")
  assert.equal(verdict(new ApiError(401, "authError")), "stop")
  assert.equal(verdict(new ApiError(403, "accessNotConfigured")), "stop")
  assert.equal(verdict(new ApiError(403, "liveStreamingNotEnabled")), "disable")
  assert.equal(verdict(new ApiError(403, "rateLimitExceeded")), "retry")
})

function tempDir(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), "stream-youtube-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test("queue: writes cards through the alert command, a batch at a time", (t) => {
  const dir = tempDir(t)
  const cards = Array.from({ length: MAX_ALERTS + 3 }, (_, i) => card(`user${i}`))
  const rest = queueCards(cards, dir, () => {})
  assert.equal(rest.length, 3)
  assert.equal(loadState(dir).alerts[0].name, "user0")
  assert.deepEqual(
    queueCards(rest, dir, () => {}),
    [],
  )
  const { alerts } = loadState(dir)
  assert.equal(alerts.at(-1)?.name, `user${MAX_ALERTS + 2}`)
  assert.ok(alerts.every((a, i) => i === 0 || a.id > alerts[i - 1].id))
})

test("queue: a viewer named like a subcommand is still just a name", (t) => {
  const dir = tempDir(t)
  queueCards([card("clear"), card("test")], dir, () => {})
  assert.deepEqual(
    loadState(dir).alerts.map((a) => a.name),
    ["clear", "test"],
  )
})

test("options: defaults, floors, and turning subscribers off", () => {
  assert.deepEqual(parseOptions([]), {
    command: "watch",
    chatMs: 10_000,
    subscriberMs: 60_000,
    showChat: false,
  })
  const custom = parseOptions(["--chat-seconds", "20", "--subscriber-seconds", "0"])
  assert.equal(custom.chatMs, 20_000)
  assert.equal(custom.subscriberMs, 0)
  assert.equal(parseOptions(["login"]).command, "login")
  assert.throws(() => parseOptions(["--chat-seconds", "1"]), /at least 5/)
  assert.throws(() => parseOptions(["--nope"]), /npm run youtube/)
  assert.throws(() => parseOptions(["dance"]), /Unknown command/)
})
