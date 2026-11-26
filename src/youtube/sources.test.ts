import assert from "node:assert/strict"
import { test } from "node:test"
import { ApiError, createApi } from "./api.ts"
import { chatSource, IDLE_MS } from "./chat.ts"
import { apiError, fakeFetch } from "./fake.ts"
import type { Reply } from "./fake.ts"
import { subscriberSource } from "./subscribers.ts"

const SINCE = Date.parse("2026-01-01T12:00:00Z")
const BEFORE = "2026-01-01T11:59:00Z"
const AFTER = "2026-01-01T12:01:00Z"

const live = { items: [{ snippet: { liveChatId: "chat-1" } }] }
const member = (id: string, publishedAt = AFTER) => ({
  id,
  snippet: { type: "newSponsorEvent", publishedAt },
  authorDetails: { displayName: id },
})

function chat(replies: Reply[]) {
  const { fetch, calls } = fakeFetch(replies)
  const api = createApi(fetch, async () => "token")
  return { source: chatSource({ api, since: SINCE, minMs: 10_000 }), calls, api }
}

const names = (result: { cards: { name: string }[] }) =>
  result.cards.map((card) => card.name)

test("chat: waits cheaply while nothing is live", async () => {
  const { source, calls, api } = chat([{ items: [] }])
  assert.deepEqual(await source.poll(), { cards: [], waitMs: IDLE_MS })
  assert.equal(calls[0].url.pathname, "/youtube/v3/liveBroadcasts")
  assert.equal(calls[0].url.searchParams.get("broadcastStatus"), "active")
  assert.equal(api.unitsUsed(), 1)
})

test("chat: skips history, pages forward, and never repeats an event", async () => {
  const { source, calls, api } = chat([
    live,
    { items: [member("old", BEFORE), member("a")], nextPageToken: "p2" },
    { items: [member("a"), member("b")], nextPageToken: "p3" },
  ])
  assert.deepEqual(names(await source.poll()), ["a"])
  assert.deepEqual(names(await source.poll()), ["b"])
  assert.equal(calls[1].url.pathname, "/youtube/v3/liveChat/messages")
  assert.equal(calls[1].url.searchParams.get("liveChatId"), "chat-1")
  assert.equal(calls[1].url.searchParams.has("pageToken"), false)
  assert.equal(calls[2].url.searchParams.get("pageToken"), "p2")
  assert.equal(api.unitsUsed(), 11)
})

test("chat: honors pollingIntervalMillis but never goes below the floor", async () => {
  const { source } = chat([
    live,
    { pollingIntervalMillis: 25_000 },
    { pollingIntervalMillis: 2_000 },
  ])
  assert.equal((await source.poll()).waitMs, 25_000)
  assert.equal((await source.poll()).waitMs, 10_000)
})

test("chat: an offline stream slows down, then resumes from its page", async () => {
  const { source, calls } = chat([
    live,
    { offlineAt: AFTER, nextPageToken: "p2" },
    live,
    { items: [member("back")] },
  ])
  assert.equal((await source.poll()).waitMs, IDLE_MS)
  assert.deepEqual(names(await source.poll()), ["back"])
  assert.equal(calls[3].url.searchParams.get("pageToken"), "p2")
})

test("chat: an ended chat is not picked up again", async () => {
  const ended = { id: "end", snippet: { type: "chatEndedEvent", publishedAt: AFTER } }
  const next = { items: [...live.items, { snippet: { liveChatId: "chat-2" } }] }
  const { source, calls } = chat([
    live,
    { items: [member("last"), ended], nextPageToken: "p2" },
    next,
    {},
  ])
  assert.deepEqual(names(await source.poll()), ["last"])
  await source.poll()
  assert.equal(calls[3].url.searchParams.get("liveChatId"), "chat-2")
  assert.equal(calls[3].url.searchParams.has("pageToken"), false)
})

test("chat: liveChatEnded goes back to waiting, other errors surface", async () => {
  const { source } = chat([live, apiError(403, "liveChatEnded"), live])
  assert.deepEqual(await source.poll(), { cards: [], waitMs: IDLE_MS })
  assert.deepEqual(await source.poll(), { cards: [], waitMs: IDLE_MS })

  const limited = chat([live, apiError(403, "rateLimitExceeded"), live, {}])
  await assert.rejects(limited.source.poll(), ApiError)
  await limited.source.poll()
  assert.equal(limited.calls[2].url.pathname, "/youtube/v3/liveBroadcasts")
})

test("chat: a rejected page token is dropped for the next try", async () => {
  const { source, calls } = chat([
    live,
    { nextPageToken: "stale" },
    apiError(400, "pageTokenInvalid"),
    {},
  ])
  await source.poll()
  await assert.rejects(source.poll(), ApiError)
  await source.poll()
  assert.equal(calls[3].url.searchParams.has("pageToken"), false)
})

const subscriber = (name: string, publishedAt = AFTER) => ({
  id: `sub-${name}`,
  snippet: { publishedAt },
  subscriberSnippet: { title: name, channelId: `channel-${name}` },
})

test("subscribers: only new ones, oldest first, each once", async () => {
  const { fetch, calls } = fakeFetch([
    { items: [subscriber("b"), subscriber("a"), subscriber("old", BEFORE)] },
    { items: [subscriber("c"), subscriber("b")] },
  ])
  const api = createApi(fetch, async () => "token")
  const source = subscriberSource({ api, since: SINCE, everyMs: 60_000 })
  const first = await source.poll()
  assert.deepEqual(names(first), ["a", "b"])
  assert.equal(first.cards[0].kind, "sub")
  assert.equal(first.waitMs, 60_000)
  assert.deepEqual(names(await source.poll()), ["c"])
  assert.equal(calls[0].url.searchParams.get("myRecentSubscribers"), "true")
  assert.equal(api.unitsUsed(), 2)
})

test("api: a 401 refreshes the token once", async () => {
  const { fetch, calls } = fakeFetch([apiError(401, "authError"), { items: [] }])
  const api = createApi(fetch, async (force) => (force ? "new" : "old"))
  await api.get("channels", { part: "snippet", mine: "true" })
  assert.deepEqual(
    calls.map((call) => new Headers(call.init?.headers).get("authorization")),
    ["Bearer old", "Bearer new"],
  )
})
