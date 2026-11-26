# Simulcasting (later)

The stream runs on YouTube only for now. Twitch stays a potential second target once the
YouTube routine feels easy. Nothing here is set up or tested.

## Before adding Twitch

Check these against the current
[Simulcasting Guidelines](https://help.twitch.tv/s/article/simulcasting-guidelines),
because they can change:

- The Twitch experience must be at least as good as on other platforms.
- Don't use Twitch (panels, titles, chat commands, and similar) to send viewers to
  another live stream.
- Don't show merged chat or other cross-platform activity on the Twitch stream. This
  also applies to a hosted alert box that combines platforms.
- An agreement with Twitch that requires exclusivity overrides all of this.

## Setup sketch

- Create the Twitch account and turn on two-factor authentication.
- Send the second stream with a plugin such as
  [Aitum Multistream](https://aitum-tv.com/multistream/index.html) (check that it
  supports your OBS version), or a relay service such as
  [Restream](https://restream.io/pricing).
- With a plugin, each extra platform uses more upload bandwidth.
- Music is on audio track 1 only. Send track 2 anywhere the music isn't cleared (see
  [`music.md`](music.md)).
- Review the channel copy and alert wording for both platforms.
