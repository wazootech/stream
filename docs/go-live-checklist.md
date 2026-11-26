# Go-live checklist

## Before

- [ ] OBS Video is `1920x1080`, and the collection is **Wazoo Stream**.
- [ ] **Mic/Aux is unmuted** and the meter moves when you talk. (OBS's default
      collection starts with it muted.)
- [ ] Speak into the mic and check desktop audio sits clearly below your voice.
- [ ] Webcam and Display sources show the right devices.
- [ ] `npm run session -- alert test` plays five cards in OBS, then
      `npm run session -- alert clear`.
- [ ] Music source points at the StreamBeats playlist (see [`music.md`](music.md)).
- [ ] OBS records in Hybrid MP4 or MKV with tracks 1 and 2, and the disk has room.
- [ ] Notifications off: phone silent, OS Do Not Disturb on, chat apps closed.
- [ ] A separate browser profile for streaming, with only what you need open.
- [ ] Session plan filled in and loaded into the HUD (see
      [`session-plan.md`](session-plan.md)).
- [ ] Water within reach. Fidget tool within reach.
- [ ] **Manage Broadcast** in OBS: title as `<what> | Wazoo`, category, visibility, and
      the made-for-kids answer. Use **Unlisted** for tests.
- [ ] Start on **Starting Soon** with a 5 minute timer
      (`npm run session -- timer 5 "Starting soon"`).

## During

- [ ] **Start Recording** along with **Start Streaming**.
- [ ] Switch to **Main** and say the plan out loud.
- [ ] One block at a time: `npm run session -- timer 45 "Block 1"`.
- [ ] Break at every block end: `npm run session -- break`, then **Break**.
- [ ] Settle predictions and check off tasks as they happen. The HUD is your own
      progress bar too.
- [ ] If you can't think of anything to say, open [`when-stuck.md`](when-stuck.md).

## After

- [ ] Give a quick recap on air before you go offline.
- [ ] Say when the next session is.
- [ ] Stop the stream, then stop the recording.
- [ ] Check that the archive and the local recording both play.
- [ ] `npm run session -- reset` so the next session starts clean.
- [ ] Jot down one thing that worked and one thing to change.

## Movement and focus

Plan the movement instead of fighting it. A named five-minute **Break** at each block
end gives you permission to get up and gives viewers something to watch. A standing
desk, a walking segment, or a quiet fidget tool all help. Shorter streams are fine while
you build the habit. Forty-five to sixty minutes beats an exhausting three hours.
