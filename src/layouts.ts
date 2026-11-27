import type { Json, Place } from "./obs.ts"

/** Width of the right-hand column in the layouts based on Main. */
export const SIDE = 480

/** The sources a layout can place. */
export type Parts = Record<
  | "backdrop"
  | "display"
  | "webcam"
  | "game"
  | "hud"
  | "hudBar"
  | "starting"
  | "onBreak"
  | "music",
  Json
>

/** Every scene, bottom layer first. The Alerts layer is added on top of each. */
export function layouts(
  parts: Parts,
  W: number,
  H: number,
): Record<string, [Json, Place][]> {
  const { backdrop, display, webcam, game, hud, hudBar, starting, onBreak, music } =
    parts
  const full: Place = { x: 0, y: 0, w: W, h: H }
  return {
    "Starting Soon": [
      [music, full],
      [backdrop, full],
      [starting, full],
    ],
    Main: [
      [backdrop, full],
      [display, { x: 0, y: 0, w: W - SIDE, h: H }],
      [webcam, { x: W - SIDE, y: 0, w: SIDE, h: 270 }],
      [hud, { x: W - SIDE, y: 270, w: SIDE, h: H - 270 }],
    ],
    Focus: [
      [backdrop, full],
      [display, { x: 0, y: 0, w: W, h: H - 120 }],
      [hudBar, { x: 0, y: H - 120, w: W, h: 120 }],
    ],
    // Main's layout, with the game as a second screen under the main one.
    "Main + Game": [
      [backdrop, full],
      [display, { x: 0, y: 0, w: W - SIDE, h: H - 270 }],
      [game, { x: (W - SIDE - 480) / 2, y: H - 270, w: 480, h: 270 }],
      [webcam, { x: W - SIDE, y: 0, w: SIDE, h: 270 }],
      [hud, { x: W - SIDE, y: 270, w: SIDE, h: H - 270 }],
    ],
    "Game Focus": [
      [backdrop, full],
      [game, { x: 0, y: 0, w: W, h: H - 120 }],
      [webcam, { x: W - 408, y: H - 360, w: 384, h: 216 }],
      [hudBar, { x: 0, y: H - 120, w: W, h: 120 }],
    ],
    Break: [
      [music, full],
      [backdrop, full],
      [onBreak, full],
    ],
  }
}
