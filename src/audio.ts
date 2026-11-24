import { source } from "./obs.ts"
import type { Json } from "./obs.ts"

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
