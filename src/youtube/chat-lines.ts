import { MAX_CHAT } from "../commands/chat.ts"
import { loadState, saveState } from "../state.ts"
import type { ChatLine } from "../state.ts"
import { cleanName } from "./events.ts"
import type { ChatMessage } from "./events.ts"

const MAX_TEXT = 200

/** What one page of chat changes on screen. */
export interface ChatUpdate {
  lines: ChatLine[]
  /** Message ids that moderation removed. */
  removed: string[]
  /** Channel ids of people banned from the chat. */
  banned: string[]
}

/** Reads new messages and moderation actions out of a page of chat. */
export function chatUpdate(messages: ChatMessage[]): ChatUpdate {
  const update: ChatUpdate = { lines: [], removed: [], banned: [] }
  for (const { id, snippet, authorDetails } of messages) {
    if (snippet.type === "textMessageEvent") {
      const text = (snippet.displayMessage ?? "").replace(/\s+/g, " ").trim()
      if (!text) continue
      update.lines.push({
        id,
        by: snippet.authorChannelId ?? "",
        name: cleanName(authorDetails?.displayName),
        text: text.slice(0, MAX_TEXT),
      })
    } else if (snippet.type === "tombstone") update.removed.push(id)
    else if (snippet.type === "messageDeletedEvent") {
      const gone = snippet.messageDeletedDetails?.deletedMessageId
      if (gone) update.removed.push(gone)
    } else if (snippet.type === "userBannedEvent") {
      const who = snippet.userBannedDetails?.bannedUserDetails?.channelId
      if (who) update.banned.push(who)
    }
  }
  return update
}

/** Applies an update to the saved chat, newest last. */
export function showChat(update: ChatUpdate, dir?: string): void {
  const { lines, removed, banned } = update
  if (lines.length + removed.length + banned.length === 0) return
  const state = loadState(dir)
  const seen = new Set(state.chat.map((line) => line.id))
  const chat = [...state.chat, ...lines.filter((line) => !seen.has(line.id))]
    .filter((line) => !removed.includes(line.id) && !banned.includes(line.by))
    .slice(-MAX_CHAT)
  saveState({ ...state, chat }, dir)
}

/** Empties the on-screen chat, so a new run never shows an old one. */
export function clearChat(dir?: string): void {
  saveState({ ...loadState(dir), chat: [] }, dir)
}
