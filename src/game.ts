import { source } from "./obs.ts"
import type { Json } from "./obs.ts"

/**
 * The second monitor, where games run. Like **Display**, which monitor it shows
 * is picked in OBS, because monitor IDs are machine-specific. Everything on that
 * screen is visible on stream.
 */
export function gameSource(): Json {
  return source("monitor_capture", "Game Screen", {
    monitor: 1,
    method: 0,
    capture_cursor: true,
  })
}
