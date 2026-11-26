# Test stream

How to test without an audience. Start with a local recording, then try a Private
stream.

> **Warning:** YouTube's
> [encoder streaming help](https://support.google.com/youtube/answer/2907883?hl=en) says
> that on the **Start live streaming now** path, you are live as soon as the encoder
> starts, notifications are sent, and the default privacy for adult accounts is
> **public**. Set the privacy before you start streaming.

## Recording only

Click **Start Recording** in OBS, not **Start Streaming**. Nothing goes to YouTube. Stop
the recording and play the file to check picture and sound.

## Private stream

[Private videos](https://support.google.com/youtube/answer/157177?hl=en&co=GENIE.Platform%3DDesktop)
can be seen only by you and people you choose, and don't show in subscriber feeds.

1. Make sure live streaming is enabled for the channel. The first activation can take 24
   hours.
2. In OBS, open **Settings > Stream**, choose YouTube, click **Connect Account**, and
   pick **Wazoo Ethan**.
3. Open **Manage Broadcast** _before_ streaming. Set privacy to **Private** and answer
   the made-for-kids question.
4. Confirm the broadcast says **Private**.
5. Start streaming, and start recording.
6. Watch the stream in the Live Control Room in YouTube Studio.
7. Stop the stream and the recording, then check that the archive on YouTube and the
   local file both play.

## Chat commands

Test [chat commands](chat-commands.md) on a later **Unlisted** stream, which anyone with
the link can watch.

Nightbot's [setup guide](https://docs.nightbot.tv/setup) says that on YouTube it only
joins when you are live and the stream is public. That suggests it won't join an
Unlisted or Private stream, but neither has been tested. If Nightbot stays silent on the
Unlisted stream, the commands still need a test on a public one.

Watch **Live Chat**, not Top Chat. Nightbot's
[troubleshooting page](https://docs.nightbot.tv/troubleshooting) lists this for YouTube.
