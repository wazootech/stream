import { ApiError } from "./api.ts"
import type { Api } from "./api.ts"
import { chatCard } from "./events.ts"
import type { Card, ChatMessage } from "./events.ts"
import { dedupe } from "./source.ts"
import type { Source } from "./source.ts"

/** How often to look for a live broadcast when there isn't one. */
export const IDLE_MS = 60_000
const GONE = ["liveChatEnded", "liveChatDisabled", "liveChatNotFound"]

interface Broadcasts {
  items?: { snippet?: { liveChatId?: string } }[]
}

interface Messages {
  items?: ChatMessage[]
  nextPageToken?: string
  pollingIntervalMillis?: number
  offlineAt?: string
}

/**
 * Finds the owner's live broadcast and follows its chat. Only events published
 * at or after `since` become cards, so chat history is never replayed.
 */
export function chatSource(options: {
  api: Api
  since: number
  minMs: number
  log?: (line: string) => void
}): Source {
  const { api, since, minMs, log = () => {} } = options
  const first = dedupe()
  const ended = new Set<string>()
  let chatId: string | undefined
  let pageToken: string | undefined
  let searching = true

  async function discover(): Promise<boolean> {
    const found = await api.get<Broadcasts>("liveBroadcasts", {
      part: "snippet",
      broadcastStatus: "active",
      broadcastType: "all",
    })
    const next = found.items
      ?.map((item) => item.snippet?.liveChatId)
      .find((id) => id && !ended.has(id))
    if (!next) return false
    if (next !== chatId) {
      pageToken = undefined
      log("Live broadcast found. Watching its chat.")
    }
    chatId = next
    searching = false
    return true
  }

  const fresh = (items: ChatMessage[]): Card[] =>
    items.flatMap((message) => {
      if (!(Date.parse(message.snippet.publishedAt) >= since)) return []
      const card = chatCard(message)
      return card && first(message.id) ? [card] : []
    })

  function end(cards: Card[]) {
    if (chatId) ended.add(chatId)
    searching = true
    log("Live chat ended. Waiting for the next broadcast.")
    return { cards, waitMs: IDLE_MS }
  }

  return {
    name: "chat",
    baseMs: minMs,
    async poll() {
      if (searching && !(await discover())) return { cards: [], waitMs: IDLE_MS }
      let page: Messages
      try {
        page = await api.get<Messages>("liveChat/messages", {
          liveChatId: chatId as string,
          part: "snippet,authorDetails",
          maxResults: "2000",
          ...(pageToken && { pageToken }),
        })
      } catch (error) {
        if (!(error instanceof ApiError)) throw error
        if (GONE.includes(error.reason)) return end([])
        if (error.reason === "pageTokenInvalid") pageToken = undefined
        // Otherwise check the chat is still the live one before trying again.
        else searching = true
        throw error
      }
      pageToken = page.nextPageToken ?? pageToken
      const items = page.items ?? []
      const cards = fresh(items)
      if (items.some((item) => item.snippet.type === "chatEndedEvent")) {
        return end(cards)
      }
      // Offline: check again slowly. The same chat resumes from its page token.
      if (page.offlineAt) {
        searching = true
        return { cards, waitMs: IDLE_MS }
      }
      return { cards, waitMs: Math.max(page.pollingIntervalMillis ?? 0, minMs) }
    },
  }
}
