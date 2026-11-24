# Music

Background music for the dead stretches: waiting before you go live, and
breaks. Spoken-word segments stay music-free so your voice is the show.

## Read this first: the license gap

TheFatRat's [copyright page](https://www.thefatrat.com/copyright) says every
song on his [downloads page](https://www.thefatrat.com/downloads) is free to
use and free to download, and that everything else is not. But his
[terms](https://www.thefatrat.com/terms-and-conditions) describe the binding
license as covering videos uploaded to YouTube. They don't mention live
streaming or Twitch, and they reserve any other kind of use. Live performance
appears only in the non-binding overview.

So Twitch isn't explicitly covered. The playlist below is a sensible starting
point, not a cleared one. Before relying on it:

1. Use the contact in the Terms page (Section 10) to ask whether live Twitch
   streams and their VODs are allowed, and keep the reply.
2. Until you hear back, keep music on its own audio track and out of the VOD
   (see below).

## Credit line

His terms say the description must carry this line, or the use isn't covered:

```
Music: TheFatRat <TITLE> <YouTube link to the song on TheFatRat's channel>
```

Spell the name exactly (`TheFatRat`, not "The Fat Rat" or "FatRat"). Put the
line in a `!music` chat command and in the channel panel, and look up each
song's link on his channel. Links aren't in this file because they haven't been
verified.

## The playlist

Titles come from the downloads page. Moods and vocals are from memory of the
catalog, not from listening, and the page shows no track lengths. Give each one
a listen and move tracks around before you commit to the order.

### Starting Soon (energy builds, about 15 minutes)

Upbeat and mostly instrumental, so chat has something to feel while the
countdown runs.

| #   | Track         | Notes                |
| --- | ------------- | -------------------- |
| 1   | Windfall      | Light, good opener   |
| 2   | Time Lapse    | Steady, easy to talk over |
| 3   | Xenogenesis   | Builds                |
| 4   | Unity         | Peak energy           |
| 5   | Jackpot       | Playful |
| 6   | Infinite Power | Closer into the stream |

### Break (calm, 5 minutes)

Slower, so you can stand, stretch, and drink water without a wall of sound.

| #   | Track      | Notes                         |
| --- | ---------- | ----------------------------- |
| 1   | Prelude    | Cinematic, gentle             |
| 2   | Elegy      | Slow                          |
| 3   | Reminiscence | Quiet, reflective          |
| 4   | Solitude   | Low energy                    |

Titles with vocals (for example Fly Away, Monody, Never Be Alone) are left out
on purpose. Vocals compete with your voice once you come back on mic.

If a track turns out to be a poor fit, swap it for another from the downloads
page. Tracks with a featured artist or a remix credit, such as
`Whisper (feat. Reptythm)` or the remixes, may involve other rights holders, so
skip them unless you've confirmed they're covered.

## Setup in OBS

- Add the music as its own source (a Media Source playing the playlist, or
  your player's output) so it has its own mixer fader.
- In **Advanced Audio Properties**, put the music on a track that isn't the one
  Twitch uses for the VOD. This keeps it live but out of saved VODs.
- Keep it well below the mic. A level around -30 to -24 dB under your voice
  works for a bed.
- Mute it when you start talking in Main or Focus.

The scene collection from `npm run build` does not include a music source yet.
Add it by hand until it's generated.

## Checklist

- [ ] Every track is on TheFatRat's downloads page
- [ ] Credit line and `!music` command are set
- [ ] Reply from the artist's contact on file about Twitch (or music kept off
      the VOD track)
- [ ] Music is on its own track and muted when you speak
