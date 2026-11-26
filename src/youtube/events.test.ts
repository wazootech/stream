import assert from "node:assert/strict"
import { test } from "node:test"
import { chatCard } from "./events.ts"
import type { ChatMessage } from "./events.ts"

const message = (
  type: string,
  details: Partial<ChatMessage["snippet"]> = {},
  displayName = "Ada",
): ChatMessage => ({
  id: "m1",
  snippet: { type, publishedAt: "2026-01-01T00:00:00Z", ...details },
  authorDetails: { displayName },
})

const detail = (type: string, details: Partial<ChatMessage["snippet"]>) =>
  chatCard(message(type, details))?.detail

test("events: a Super Chat shows its amount and message", () => {
  const card = chatCard(
    message("superChatEvent", {
      superChatDetails: { amountDisplayString: "$5.00", userComment: "hi\n there" },
    }),
  )
  assert.deepEqual(card, { kind: "superchat", name: "Ada", detail: "$5.00: hi there" })
  const silent = { superChatDetails: { amountDisplayString: "$1.00" } }
  assert.equal(detail("superChatEvent", silent), "$1.00")
})

test("events: a Super Sticker shows its amount and description", () => {
  const superStickerDetails = {
    amountDisplayString: "$2.00",
    superStickerMetadata: { altText: "a waving cat" },
  }
  const card = chatCard(message("superStickerEvent", { superStickerDetails }))
  assert.equal(card?.kind, "sticker")
  assert.equal(card?.detail, "$2.00: a waving cat")
})

test("events: new members and upgrades", () => {
  const joined = { newSponsorDetails: { memberLevelName: "Crew" } }
  assert.equal(chatCard(message("newSponsorEvent", joined))?.kind, "member")
  assert.equal(detail("newSponsorEvent", joined), "Crew")
  const upgrade = { memberLevelName: "Captain", isUpgrade: true }
  assert.equal(
    detail("newSponsorEvent", { newSponsorDetails: upgrade }),
    "Upgraded to Captain",
  )
  assert.equal(
    detail("newSponsorEvent", { newSponsorDetails: { isUpgrade: true } }),
    "Upgraded",
  )
  assert.equal(detail("newSponsorEvent", {}), "")
})

test("events: member milestones show months, level, and message", () => {
  const memberMilestoneChatDetails = {
    memberMonth: 6,
    memberLevelName: "Crew",
    userComment: "still here",
  }
  const full = { memberMilestoneChatDetails }
  assert.equal(chatCard(message("memberMilestoneChatEvent", full))?.kind, "milestone")
  assert.equal(detail("memberMilestoneChatEvent", full), "6 months, Crew: still here")
  const bare = { memberMilestoneChatDetails: { memberMonth: 1 } }
  assert.equal(detail("memberMilestoneChatEvent", bare), "1 month")
})

test("events: gifted memberships show the count", () => {
  const membershipGiftingDetails = {
    giftMembershipsCount: 5,
    giftMembershipsLevelName: "Crew",
  }
  const gifting = { membershipGiftingDetails }
  assert.equal(chatCard(message("membershipGiftingEvent", gifting))?.kind, "gift")
  assert.equal(detail("membershipGiftingEvent", gifting), "5 memberships, Crew")
  const one = { membershipGiftingDetails: { giftMembershipsCount: 1 } }
  assert.equal(detail("membershipGiftingEvent", one), "1 membership")
})

test("events: other chat messages get no card", () => {
  for (const type of [
    "textMessageEvent",
    "giftMembershipReceivedEvent",
    "giftEvent",
    "userBannedEvent",
    "tombstone",
    "chatEndedEvent",
  ]) {
    assert.equal(chatCard(message(type)), null, type)
  }
})

test("events: a missing name gets a stand-in", () => {
  assert.equal(chatCard(message("newSponsorEvent", {}, "  "))?.name, "Someone")
})
