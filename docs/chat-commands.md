# Chat commands

[Nightbot](https://nightbot.tv) is set up for chat commands on the
[Wazoo Ethan (@WazooEthan)](https://www.youtube.com/@WazooEthan) YouTube channel. It has
not been tested on a live stream yet.

## Setup

Done on 2026-11-25:

- Nightbot joined the Wazoo Ethan channel.
- It was added in YouTube Studio as a moderator. Its setup dialog asks for a managing
  moderator; we chose a standard moderator for least privilege.

Nightbot only joins when there is a stream to join. Its setup dialog says it only joins
active streams, and its [setup guide](https://docs.nightbot.tv/setup), read on
2026-11-25, says that on YouTube you must be live and the stream must be public.

## Commands

All four are custom commands with the user level **Everyone**. The replies are exact.

`!discord`

```text
Join the Wazoo Discord: https://discord.gg/wpaavgRMAE
```

`!github`

```text
Wazoo on GitHub: https://github.com/wazootech
```

`!setup`

```text
My setup: ASUS Vivobook 14 Flip, Kinesis Freestyle2 keyboard, Glorious Model D mouse, and OBS for broadcasting.
```

`!socials`

```text
Discord: discord.gg/wpaavgRMAE | GitHub: github.com/wazootech | X: x.com/wazootech | LinkedIn: linkedin.com/company/wazootech | IG: instagram.com/wazootech | wazoo.dev
```

## Changing a command

Manage commands in the Nightbot dashboard, then update this page to match. Nightbot's
[`!commands` help page](https://docs.nightbot.tv/commands/commands) also describes
adding and editing commands from chat. We haven't tried that on YouTube.

To test the commands, see [`test-stream.md`](test-stream.md#chat-commands).
