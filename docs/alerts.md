# Alerts

A transparent overlay that shows a card at the top of the screen for follows, subs,
gifted subs, raids, and cheers. It is the **Alerts** source, layered on top of every
scene, so it works on Starting Soon, Break, and Ending as well as Main and Focus.

## What it does today

The overlay plays whatever you queue, one card at a time (six seconds each, in order).
**It does not watch YouTube.** A follow only appears if you queue it. That keeps the kit
free of credentials, but it means the automatic part is still open (see below).

```sh
npm run session -- alert follow Ada
npm run session -- alert sub Grace "Tier 1, 3 months"
npm run session -- alert gift Linus "5 subs"
npm run session -- alert raid Margaret "42 viewers"
npm run session -- alert cheer Alan "100 bits"
npm run session -- alert test      # one of each, to rehearse
npm run session -- alert clear
```

Aliases: `follower`, `subscribe`, `resub`, `bits`. Names are cut at 40 characters and
details at 80. Cards use plain text only, so a hostile username can't inject HTML.

## Rehearse before going live

1. Run `npm run session -- alert test` with the collection loaded in OBS. Five cards
   should play in a row.
2. Or preview one design in any browser, no OBS needed: open
   `overlays/alerts.html?demo=raid` (also `follow`, `sub`, `gift`, `cheer`).

A reloaded source does not replay old alerts, so a refresh during a stream is safe.

## YouTube wording

The cards were written for Twitch. `sub` prints "New subscriber", which fits a new
YouTube subscriber. The other cards say follower, gifted subs, raid, and bits, which are
not YouTube terms, so leave them unused until the wording changes.

## Getting alerts automatically

Something has to turn YouTube events into `alert ...` commands. Two options:

- **A hosted alert box.** StreamElements and Streamlabs each give you a browser source
  URL that reacts to real events. Add it in OBS by hand and keep that URL out of git,
  because it contains a private token. It runs alongside this overlay, or instead of it.
- **A small bridge** that reads the YouTube Live API and calls the same CLI. It needs
  Google API credentials and your sign-in. It isn't built.

While you decide, watch chat and the activity feed in YouTube Studio, and type
`alert sub <name>` for the moments worth a card.

## Keep it safe on stream

Never put a token, an alert-box URL, or an OAuth client secret in this repo. Local
credentials belong in your secrets manager.
