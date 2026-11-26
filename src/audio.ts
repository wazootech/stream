import { source } from "./obs.ts"
import type { Json } from "./obs.ts"

/**
 * Background music: an OBS Media Source you point at a licensed file. It is
 * mixed onto track 1 alone, so track 2 stays music-free for editing, and
 * sits well under the voice.
 */
export function musicSource(): Json {
  return source(
    "ffmpeg_source",
    "Music",
    {
      is_local_file: true,
      local_file: "",
      looping: true,
      restart_on_activate: false,
      close_when_inactive: false,
    },
    { mixers: 1, volume: 0.25 },
  )
}

export function audio(
  id: string,
  name: string,
  volume: number,
  hotkeyPrefix: string,
  extra: Json = {},
): Json {
  return source(
    id,
    name,
    { device_id: "default" },
    {
      mixers: 255,
      volume,
      hotkeys: {
        [`${hotkeyPrefix}.mute`]: [],
        [`${hotkeyPrefix}.unmute`]: [],
        [`${hotkeyPrefix}.push-to-mute`]: [],
        [`${hotkeyPrefix}.push-to-talk`]: [],
      },
      ...extra,
    },
  )
}

/** Mic chain: denoise, level the peaks, then a safety limiter. */
export function micFilters(): Json[] {
  const filter = (id: string, name: string, settings: Json) =>
    source(id, name, settings, { mixers: 255 })
  return [
    filter("noise_suppress_filter_v2", "Noise Suppression", {
      method: "rnnoise",
    }),
    filter("compressor_filter", "Compressor", {
      ratio: 4.0,
      threshold: -18.0,
      attack_time: 6.0,
      release_time: 60.0,
      output_gain: 3.0,
    }),
    filter("limiter_filter", "Limiter", { threshold: -2.0, release_time: 60.0 }),
  ]
}
