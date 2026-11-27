# Alerts

A transparent overlay that shows a card at the top of the screen for new subscribers,
members, Super Chats, and more. It is the **Alerts** source, layered on top of every
scene, so it works on Starting Soon and Break as well as Main, both Focus scenes, and
both game scenes.

The overlay plays whatever is queued, one card at a time (six seconds each, in order).
Two things queue cards: you, with `npm run session -- alert`, and the
[YouTube bridge](#youtube-bridge), with `npm run youtube`.

## Cards

| Kind        | Card says          | The bridge queues it for                        |
| ----------- | ------------------ | ----------------------------------------------- |
| `sub`       | New subscriber     | A new subscriber with public subscriptions      |
| `member`    | New member         | A new member, or a member who upgrades          |
| `milestone` | Member milestone   | A Member Milestone Chat                         |
| `gift`      | Gifted memberships | A purchase of gifted memberships (one per gift) |
| `superchat` | Super Chat         | A Super Chat, with the amount and message       |
| `sticker`   | Super Sticker      | A Super Sticker, with the amount                |
| `redirect`  | Live Redirect      | Nothing. Queue it by hand.                      |

```sh
npm run session -- alert sub Ada
npm run session -- alert member Grace "Crew"
npm run session -- alert milestone Margaret "6 months"
npm run session -- alert gift Linus "5 memberships"
npm run session -- alert superchat Alan "$5.00: hello"
npm run session -- alert sticker Katherine "$2.00"
npm run session -- alert redirect Dennis "42 viewers"
npm run session -- alert test      # one of each, to rehearse
npm run session -- alert clear
```

Aliases: `subscriber`, `subscribe`, `join` (member), `gifted`, `super`, `supersticker`.
The old Twitch words still work and map to the closest YouTube card: `follow` and
`follower` (`sub`), `resub` (`milestone`), `bits` and `cheer` (`superchat`), and `raid`
(`redirect`).

Names are cut at 40 characters and details at 80. Cards use plain text only, so a
hostile username or message can't inject HTML. Super Chat and milestone messages do
appear on stream as written.

## Rehearse before going live

1. Run `npm run session -- alert test` with the collection loaded in OBS. Seven cards
   should play in a row.
2. Or preview one design in any browser, no OBS needed: open
   `overlays/alerts.html?demo=superchat` (or any kind in the table).

A reloaded source does not replay old alerts, so a refresh during a stream is safe.

## YouTube bridge

`npm run youtube` reads your channel through the YouTube Data API and Live Streaming API
and queues the cards above. It runs on your PC, asks only for read-only access
(`youtube.readonly`), and never posts anything.

### One-time setup

You need the Google account that manages the channel.

1. Open the Google Cloud console's
   [Personal mode onboarding page](https://console.cloud.google.com/auth/overview/personal),
   signed in with that account. Create a project, choose the **Desktop app** application
   type, accept the terms, click **Continue**, then **Download JSON**. The secret can't
   be downloaded again after you close that dialog.
2. In the same project, open **APIs & Services > Library**, find **YouTube Data API
   v3**, and click **Enable**. Skip this and the bridge stops with
   `accessNotConfigured`.
3. Save the downloaded file as `~/.config/wazoo-stream/youtube-client.json`, outside
   this repo. In PowerShell:

   ```powershell
   New-Item -ItemType Directory -Force "$HOME\.config\wazoo-stream"
   Move-Item "$HOME\Downloads\client_secret_*.json" "$HOME\.config\wazoo-stream\youtube-client.json"
   ```

4. Run `npm run youtube -- login`. Your browser opens. Pick the account, then the
   **Wazoo Ethan** channel, and allow read-only access. The terminal prints
   `Channel: <name>`; if it names the wrong channel, run `login` again.

The sign-in is saved as `youtube-token.json` next to the client file. Keep both files
private. To disconnect, delete the token file and remove the app's access in your Google
Account.

**If sign-in is refused.** Personal mode only admits the Google account that created the
app, and Google doesn't say whether that covers a Brand Account channel. If you get
`client_user_mismatch` or can't pick the channel, make a second project with an
**External** audience (**Google Auth Platform > Audience**), then create a **Desktop
app** client under **Clients**. Either leave it in **Testing** and add yourself as a
test user (you sign in again every 7 days), or click **Publish app** (that 7-day limit
only applies to Testing, but Google may show an unverified app warning).

### Each stream

```sh
npm run youtube      # leave it running; Ctrl+C stops it
```

Run it from the same checkout OBS loads the overlays from. Start it before or during the
stream: it waits for a live broadcast, then follows its chat. Only events from after it
started become cards, judged by your PC's clock, so chat history is never replayed.
Anything that happens while it isn't running is missed. The `session` commands work
alongside it.

### What it can't see

- **Most new subscribers.** YouTube lists only people who made their subscriptions
  public, and subscriptions are private by default. The API docs also say the list may
  be limited, and don't say how soon a new subscriber shows up. Each check reads the
  newest 50.
- **Jewel gifts and Live Redirects.** No card is made for Jewel gifts. Queue redirects
  by hand.
- **Gift recipients.** One card per gifting purchase, none per person who receives one.

### Quota

A project gets 10,000 units a day by default, reset at midnight Pacific Time. A chat
read costs 5 units; a broadcast lookup, subscriber check, or channel lookup costs 1.

| State at default settings           | Calls per hour                 | Units per hour |
| ----------------------------------- | ------------------------------ | -------------- |
| Live: chat every 10 s               | 360 chat reads x 5             | 1,800          |
| Live: subscribers every 60 s        | 60 x 1                         | 60             |
| Waiting for a broadcast (both 60 s) | 60 lookups + 60 sub checks x 1 | 120            |

Live use is about 1,860 units an hour, so a day's quota covers about **5.4 hours**, and
a 3 hour stream uses about 5,600. The bridge never polls chat sooner than YouTube's
`pollingIntervalMillis`, and a longer value from YouTube lowers the cost. Retries cost
units too, so errors back off up to five minutes. It stops when the quota is spent, and
prints its own estimate when it exits.

| Option                   | Units per live hour | Hours per day |
| ------------------------ | ------------------- | ------------- |
| `--chat-seconds 5`       | 3,660               | 2.7           |
| default (10)             | 1,860               | 5.4           |
| `--chat-seconds 20`      | 960                 | 10.4          |
| `--subscriber-seconds 0` | 1,800               | 5.6           |

Pass options after `--`, as in `npm run youtube -- --chat-seconds 20`. A slower chat
poll means cards arrive later. Google recommends its streaming method
(`liveChatMessages.streamList`) to save quota; the bridge doesn't use it, because it
needs a gRPC library and this repo has no runtime dependencies.

## Hosted alternative

StreamElements and Streamlabs each give you a browser source URL that reacts to real
events. Add it in OBS by hand and keep that URL out of git, because it contains a
private token. It runs alongside this overlay, or instead of it.

## Chat on screen

`npm run youtube -- --show-chat` also draws new chat messages on the **Chat** sources.
It keeps up to 30 in the local state files and empties them when it starts; `chat clear`
and `reset` empty them too. It removes messages the API reports as deleted and people
reported as banned, but YouTube may not report every removal, so use **Clear** if
something needs to come off screen. Turn on live chat moderation in YouTube Studio.

## Keep it safe on stream

Never put a token, an alert-box URL, or an OAuth client file in this repo, and don't
open those files on screen.
