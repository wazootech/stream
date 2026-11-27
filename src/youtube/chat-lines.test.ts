import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import type { TestContext } from "node:test"
import { applyCommand } from "../commands.ts"
import { MAX_CHAT } from "../commands/chat.ts"
import { defaultState, loadState, UsageError } from "../state.ts"
import { chatUpdate, clearChat, showChat } from "./chat-lines.ts"
import type { ChatMessage } from "./events.ts"
import { parseOptions } from "./options.ts"

const message = (id: string, type: string, extra: object = {}): ChatMessage => ({
  id,
  snippet: { type, publishedAt: "2026-11-27T18:00:00Z", ...extra },
  authorDetails: { displayName: `viewer ${id}` },
})
const said = (id: string, text: string, by = `channel-${id}`) =>
  message(id, "textMessageEvent", { displayMessage: text, authorChannelId: by })

function tempDir(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), "stream-chat-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test("only text messages become lines, on one trimmed line", () => {
  const { lines } = chatUpdate([
    said("a", "  hello\n there "),
    said("b", "   "),
    message("c", "superChatEvent", { displayMessage: "$5" }),
    said("d", "x".repeat(500)),
  ])
  assert.deepEqual(
    lines.map((line) => line.id),
    ["a", "d"],
  )
  assert.equal(lines[0].text, "hello there")
  assert.equal(lines[1].text.length, 200)
})

test("removed messages and banned people leave the screen", (t) => {
  const dir = tempDir(t)
  showChat(
    chatUpdate([said("a", "one"), said("b", "two", "troll"), said("c", "three")]),
    dir,
  )
  showChat(
    chatUpdate([
      message("a", "tombstone"),
      message("x", "userBannedEvent", {
        userBannedDetails: { bannedUserDetails: { channelId: "troll" } },
      }),
    ]),
    dir,
  )
  assert.deepEqual(
    loadState(dir).chat.map((line) => line.id),
    ["c"],
  )
})

test("the saved chat keeps the newest lines, without repeats, until cleared", (t) => {
  const dir = tempDir(t)
  const many = Array.from({ length: MAX_CHAT + 5 }, (_, i) => said(`m${i}`, "hi"))
  showChat(chatUpdate(many), dir)
  showChat(chatUpdate(many.slice(-2)), dir)
  const { chat } = loadState(dir)
  assert.equal(chat.length, MAX_CHAT)
  assert.equal(chat.at(-1)?.id, `m${MAX_CHAT + 4}`)
  clearChat(dir)
  assert.deepEqual(loadState(dir).chat, [])
})

test("chat test and clear drive the same screen; reset empties it", () => {
  const { state } = applyCommand(defaultState(), ["chat", "test"])
  assert.ok(state.chat.length > 0)
  assert.deepEqual(applyCommand(state, ["chat", "clear"]).state.chat, [])
  assert.deepEqual(applyCommand(state, ["reset"]).state.chat, [])
  assert.throws(() => applyCommand(state, ["chat"]), UsageError)
})

test("on-screen chat is opt-in", () => {
  assert.equal(parseOptions([]).showChat, false)
  assert.equal(parseOptions(["--show-chat"]).showChat, true)
})
