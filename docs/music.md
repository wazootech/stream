# Music

Background music for the dead stretches: waiting before you go live, and during breaks.
Spoken-word segments stay music-free so your voice is the show.

## What we use

[StreamBeats by Harris Heller, _Electric_](https://streambeats.bandcamp.com/album/electric):
30 lofi tracks, about 71 minutes.

The [StreamBeats license](https://streambeats.com/licensing/), read on 2026-11-25:

- Covers syncing the tracks with video on Twitch, YouTube, podcasts, or equivalent
  platforms. It doesn't name YouTube live streams separately.
- Allows monetized videos and requires no credit.
- Doesn't allow remixing or sampling, re-uploading to music services, or redistributing
  tracks on their own. Keep the audio files out of this repo.
- Lists separate licensing for games, movies, and TV shows.

## How we downloaded it

1. On the album page, choose **Buy Digital Album**, enter `0`, and choose **download to
   your computer**.
2. Bandcamp asks for an email address and zip code to send the free download link, and
   adds that address to the StreamBeats mailing list (you can unsubscribe).
3. Download the MP3 ZIP (about 133 MB).

## Setup

1. Extract the MP3s outside the repo, for example to
   `%USERPROFILE%\Music\StreamBeats\Electric`.
2. Rename them to names without spaces, such as `01_Twinkle_Tunes.mp3`.
3. In the same folder, write `playlist.ffconcat`: a first line of
   `ffconcat version 1.0`, then a `file <name>` line and a `duration <seconds>` line for
   each track (`ffprobe` reports the duration).
4. In OBS, open the **Music** source's properties and choose `playlist.ffconcat`. It
   loops, and needs no VLC.
5. Label it on screen:

   ```sh
   npm run session -- music "StreamBeats - Electric"
   npm run session -- music off
   ```

## How it's routed

The **Music** source is on **Starting Soon** and **Break** only, on audio track 1 at 25%
volume. The stream sends track 1. Record tracks 1 and 2 so you can edit with the
music-free track 2.

It sits below the **Backdrop** layer on purpose: the MP3s carry cover art, which OBS
would otherwise draw over the screen.

## Checklist

- [ ] The Music source points at the playlist, and only track 1 is ticked
- [ ] An unlisted test stream shows no copyright claim in YouTube Studio
