# stream

OBS scenes, live overlays, and session templates for the Wazoo stream, live on YouTube
as [Wazoo Ethan (@WazooEthan)](https://www.youtube.com/@WazooEthan).

Owner: [@EthanThatOneKid](https://github.com/EthanThatOneKid). Set up, check, test, and
build with
`npm ci && npm run format:check && npm run lint && npm run check && npm test && npm run build`.

The overlays show what's on the bench, a countdown, a task checklist, and a running
prediction score. A tiny CLI updates them from the terminal you're already in, so
keeping the stream readable never means alt-tabbing through OBS.

## Quick start

Requires Node 22.18+ (TypeScript runs natively; there is no build step for the code, and
no runtime dependencies).

```sh
npm install
npm run build        # writes dist/wazoo-stream.scenes.json for this machine
```

Then in OBS:

1. **Settings > Video**: set Base and Output resolution to `1920x1080`. The layouts are
   drawn for 16:9, which is what YouTube expects.
2. **Scene Collection > Import**, and choose `dist/wazoo-stream.scenes.json`.
3. In the **Webcam** source pick your camera; in **Display** pick your screen.
4. **Settings > Stream**: choose YouTube, **Connect Account**, and pick the **Wazoo
   Ethan** channel. Open chat from the **Docks** menu so it stays off stream.
5. **Settings > Output** (Advanced mode): record in Hybrid MP4 or MKV with audio tracks
   1 and 2. Track 2 has no music, which makes editing clips easier.
6. Make sure the **Mic/Aux** meter moves and is not muted.

The collection embeds absolute paths to `overlays/`, so re-run `npm run build` and
re-import if you move the repo. `dist/` is gitignored for that reason.

## Scenes

| Scene             | Use it for                                                     |
| ----------------- | -------------------------------------------------------------- |
| **Starting Soon** | Countdown and today's tasks while you set up.                  |
| **Main**          | Default scene: screen, webcam, and the HUD sidebar.            |
| **Focus**         | Screen-first, with a slim goal and timer bar along the bottom. |
| **Game**          | One game window, a small webcam, and the goal and timer bar.   |
| **Break**         | Big countdown plus a rotating "stand up, drink water" nudge.   |

An **Alerts** layer sits on top of all five scenes and shows follow, sub, gift, raid,
and cheer cards (see [`docs/alerts.md`](docs/alerts.md)). It plays what you queue with
`npm run session -- alert ...`; it doesn't watch YouTube.

A **Music** source plays on Starting Soon and Break only, on audio track 1. We use a
free StreamBeats album (see [`docs/music.md`](docs/music.md)).
`npm run session -- music "Artist - Title"` shows a label on screen.

The mic chain is noise suppression, a compressor, and a limiter. Desktop audio sits
below the mic.

The **Game** scene captures only the World of Warcraft window. To capture something
else, change `GAME_WINDOW` in `src/game.ts` or pick the window in the source's
properties.

## Running a session

```sh
npm run session -- goal "Ship the OBS kit"
npm run session -- task add "Write the HUD"
npm run session -- timer 45 "Block 1"
npm run session -- predict "The import works first try"
npm run session -- predict hit
npm run session -- task done 1
npm run session -- alert follow Ada
npm run session -- break           # 5 minutes, then switch to Break
npm run session -- status
```

Run `npm run session -- help` for everything. A shell alias like
`alias session='npm --prefix ~/path/to/stream run --silent session --'` makes it
`session goal "..."`. The overlays pick up changes within about two seconds.

## Docs

- [`docs/persona.md`](docs/persona.md): who Ethan from Wazoo is, what the stream is, and
  what's on the bench.
- [`docs/session-plan.md`](docs/session-plan.md): fill-in template for the two minutes
  before you go live.
- [`docs/when-stuck.md`](docs/when-stuck.md): what to say when you have nothing to say.
- [`docs/go-live-checklist.md`](docs/go-live-checklist.md): before, during, and after.
- [`docs/channel-panels.md`](docs/channel-panels.md): description, links, schedule, and
  rules.
- [`docs/alerts.md`](docs/alerts.md): follow, sub, gift, raid, and cheer cards, and how
  to rehearse them.
- [`docs/simulcasting.md`](docs/simulcasting.md): Twitch as a possible second target
  later.
- [`docs/music.md`](docs/music.md): background music for waiting and breaks, with the
  license notes.
- [`docs/chat-commands.md`](docs/chat-commands.md): Nightbot commands in YouTube chat.
- [`docs/test-stream.md`](docs/test-stream.md): how to test privately.

## Development

```sh
npm run format:check  # prettier
npm run lint          # eslint
npm run check         # tsc: type-checks src/ and the overlay scripts
npm test               # node:test
```

Overlay pages are plain JavaScript checked by `tsc` through `// @ts-check` and the
shared `State` type, because OBS browser sources load `file://` pages and can't run
`.ts` or ES modules. They read `overlays/state.js`, which the CLI writes; that file and
`state.json` are gitignored.

## License

MIT.
