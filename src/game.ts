import { source } from "./obs.ts"
import type { Json } from "./obs.ts"

/** OBS window selector, "title:class:executable". Change it to capture another game. */
export const GAME_WINDOW = "World of Warcraft:waApplication Window:Wow.exe"

/**
 * Captures only the game's own window, so nothing else on the screen shows.
 * Desktop Audio already carries the game's sound.
 */
export function gameSource(): Json {
  return source("game_capture", "Game Window", {
    capture_mode: "window",
    window: GAME_WINDOW,
    priority: 2, // match by executable, so a changed title still attaches
    capture_cursor: true,
  })
}
