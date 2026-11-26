import type { AlertKind } from "../state.ts"

/** An alert waiting to be queued on the overlay. */
export interface Card {
  kind: AlertKind
  name: string
  detail: string
}

interface Paid {
  amountDisplayString?: string
  userComment?: string
  superStickerMetadata?: { altText?: string }
}

/** The parts of a `liveChatMessage` resource that cards are made from. */
export interface ChatMessage {
  id: string
  snippet: {
    type: string
    publishedAt: string
    superChatDetails?: Paid
    superStickerDetails?: Paid
    newSponsorDetails?: { memberLevelName?: string; isUpgrade?: boolean }
    memberMilestoneChatDetails?: {
      memberMonth?: number
      memberLevelName?: string
      userComment?: string
    }
    membershipGiftingDetails?: {
      giftMembershipsCount?: number
      giftMembershipsLevelName?: string
    }
  }
  authorDetails?: { displayName?: string }
}

const join = (separator: string, ...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(separator)

const count = (n: number | undefined, noun: string) =>
  n ? `${n} ${noun}${n === 1 ? "" : "s"}` : undefined

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim()

/** One line of text, with a stand-in when YouTube sends no name. */
export function cleanName(name: string | undefined): string {
  return oneLine(name ?? "") || "Someone"
}

function describe(snippet: ChatMessage["snippet"]): [AlertKind, string] | null {
  switch (snippet.type) {
    case "superChatEvent": {
      const paid = snippet.superChatDetails
      return ["superchat", join(": ", paid?.amountDisplayString, paid?.userComment)]
    }
    case "superStickerEvent": {
      const paid = snippet.superStickerDetails
      const alt = paid?.superStickerMetadata?.altText
      return ["sticker", join(": ", paid?.amountDisplayString, alt)]
    }
    case "newSponsorEvent": {
      const { memberLevelName: level, isUpgrade } = snippet.newSponsorDetails ?? {}
      const upgrade = join(" to ", "Upgraded", level)
      return ["member", isUpgrade ? upgrade : (level ?? "")]
    }
    case "memberMilestoneChatEvent": {
      const m = snippet.memberMilestoneChatDetails
      const tenure = join(", ", count(m?.memberMonth, "month"), m?.memberLevelName)
      return ["milestone", join(": ", tenure, m?.userComment)]
    }
    case "membershipGiftingEvent": {
      const g = snippet.membershipGiftingDetails
      const amount = count(g?.giftMembershipsCount, "membership")
      return ["gift", join(", ", amount, g?.giftMembershipsLevelName)]
    }
    // giftMembershipReceivedEvent is left out on purpose: one gifting purchase
    // sends one per recipient, and the gifting card already covers them.
    default:
      return null
  }
}

/** The card for a chat message, or null when the message doesn't get one. */
export function chatCard(message: ChatMessage): Card | null {
  const card = describe(message.snippet)
  if (!card) return null
  const [kind, detail] = card
  const name = cleanName(message.authorDetails?.displayName)
  return { kind, name, detail: oneLine(detail) }
}
