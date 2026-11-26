import type { Api } from "./api.ts"
import { cleanName } from "./events.ts"
import type { Card } from "./events.ts"
import { dedupe } from "./source.ts"
import type { Source } from "./source.ts"

interface Subscriptions {
  items?: {
    id: string
    snippet?: { publishedAt?: string }
    subscriberSnippet?: { title?: string; channelId?: string }
  }[]
}

/**
 * New subscribers since `since`. YouTube only lists people whose subscriptions
 * are public, so many new subscribers never appear here.
 */
export function subscriberSource(options: {
  api: Api
  since: number
  everyMs: number
}): Source {
  const { api, since, everyMs } = options
  const first = dedupe()
  return {
    name: "subscribers",
    baseMs: everyMs,
    async poll() {
      const page = await api.get<Subscriptions>("subscriptions", {
        part: "snippet,subscriberSnippet",
        myRecentSubscribers: "true",
        maxResults: "50",
      })
      const cards: Card[] = (page.items ?? [])
        .toReversed() // Newest first from YouTube; play them oldest first.
        .filter((item) => Date.parse(item.snippet?.publishedAt ?? "") >= since)
        .filter((item) => first(item.subscriberSnippet?.channelId ?? item.id))
        .map((item) => ({
          kind: "sub",
          name: cleanName(item.subscriberSnippet?.title),
          detail: "",
        }))
      return { cards, waitMs: everyMs }
    },
  }
}
