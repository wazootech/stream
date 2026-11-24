# Music

Background music for the dead stretches: waiting before you go live, and during breaks.
Spoken-word segments stay music-free so your voice is the show.

## Read this first: the license gap

TheFatRat's [copyright page](https://www.thefatrat.com/copyright) says every song on his
[downloads page](https://www.thefatrat.com/downloads) is free to use and free to
download, and that everything else is not. But his
[terms](https://www.thefatrat.com/terms-and-conditions) describe the binding license as
covering videos uploaded to YouTube. They don't mention live streaming or Twitch, and
they reserve any other kind of use. Live performance appears only in the non-binding
overview.

So Twitch isn't explicitly covered. The playlist below is a sensible starting point, not
a cleared one. Before relying on it:

1. Use the contact in the Terms page (Section 10) to ask whether live Twitch streams and
   their VODs are allowed, and keep the reply.
2. Until you hear back, keep music on its own audio track and out of the VOD (see
   below).

## Credit line

His terms say the description must carry this line, or the use isn't covered:

```
Music: TheFatRat <TITLE> <YouTube link to the song on TheFatRat's channel>
```

Spell the name exactly (`TheFatRat`, not "The Fat Rat" or "FatRat"). Put the line in a
`!music` chat command and in the channel panel, and look up each song's link on his
channel. Links aren't in this file because they haven't been verified.

## The playlist

Titles come from the downloads page. Moods and vocals are from memory of the catalog,
not from listening, and the page shows no track lengths. Give each one a listen and move
tracks around before you commit to the order.

### Starting Soon (energy builds, about 15 minutes)

Upbeat and mostly instrumental, so chat has something to feel while the countdown runs.

| #   | Track          | Notes                     |
| --- | -------------- | ------------------------- |
| 1   | Windfall       | Light, good opener        |
| 2   | Time Lapse     | Steady, easy to talk over |
| 3   | Xenogenesis    | Builds                    |
| 4   | Unity          | Peak energy               |
| 5   | Jackpot        | Playful                   |
| 6   | Infinite Power | Closer into the stream    |

### Break (calm, 5 minutes)

Slower, so you can stand, stretch, and drink water without a wall of sound.

| #   | Track        | Notes             |
| --- | ------------ | ----------------- |
| 1   | Prelude      | Cinematic, gentle |
| 2   | Elegy        | Slow              |
| 3   | Reminiscence | Quiet, reflective |
| 4   | Solitude     | Low energy        |

Titles with vocals (for example Fly Away, Monody, Never Be Alone) are left out on
purpose. Vocals compete with your voice once you come back on mic.

If a track turns out to be a poor fit, swap it for another from the downloads page.
Tracks with a featured artist or a remix credit, such as `Whisper (feat. Reptythm)` or
the remixes, may involve other rights holders, so skip them unless you've confirmed
they're covered.

## Setup in OBS

The collection from `npm run build` already has a **Music** source (an OBS Media Source)
on the **Starting Soon** and **Break** scenes only, so it never plays under your voice
in Main or Focus.

- **Pick the file.** Open the Music source's properties and choose a licensed audio
  file. It loops. For a real playlist, swap it for a VLC Video Source (VLC has to be
  installed) with the same name and the same audio settings.
- **Keep it off the VOD.** The source is mixed onto audio track 1 only, at 25% volume.
  In **Settings > Stream** (for Twitch), turn on the VOD track so viewers' saved VODs
  use track 2, which has no music. Check this in **Advanced Audio Properties**: Music
  should have only track 1 ticked.
- **Show what's playing** on the waiting and break screens:

  ```sh
  npm run session -- music "TheFatRat - Windfall"
  npm run session -- music off
  ```

  This is the on-screen line only. The full credit with the YouTube link still goes in
  your channel panel and a `!music` chat command.

I haven't tested the Music source in OBS itself. If OBS rejects it or the track routing
looks wrong, fix it by hand and tell me what you see.

## Checklist

- [ ] Every track is on TheFatRat's downloads page
- [ ] Credit line and `!music` command are set
- [ ] Reply from the artist's contact on file about Twitch (or music kept off the VOD
      track)
- [ ] The Music source points at a file, and only track 1 is ticked
- [ ] Twitch VOD track is on in Settings > Stream
