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
  | "chat"
  | "chatSmall"
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
  const { backdrop, display, webcam, game, hud, hudBar } = parts
  const { chat, chatSmall, starting, onBreak, music } = parts
  const full: Place = { x: 0, y: 0, w: W, h: H }
  // A small camera in the bottom right, just above the goal and timer bar.
  const corner: Place = { x: W - 408, y: H - 360, w: 384, h: 216 }
  const left = W - SIDE
  const top = H - 270
  // Shared by the Main layouts: your screen, the goal strip, and the camera.
  const main: [Json, Place][] = [
    [backdrop, full],
    [display, { x: 0, y: 0, w: left, h: top }],
    [hud, { x: 0, y: top, w: left, h: 270 }],
    [webcam, { x: left, y: 0, w: SIDE, h: 270 }],
  ]
  // The waiting and break screens leave this column free.
  const aside: Place = { x: left, y: 135, w: SIDE, h: 810 }
  const focus: [Json, Place][] = [
    [backdrop, full],
    [display, { x: 0, y: 0, w: W, h: H - 120 }],
    [hudBar, { x: 0, y: H - 120, w: W, h: 120 }],
  ]
  return {
    "Starting Soon": [
      [music, full],
      [backdrop, full],
      [starting, full],
      [chat, aside],
    ],
    Main: [...main, [chat, { x: left, y: 270, w: SIDE, h: H - 270 }]],
    Focus: focus,
    "Focus + Cam": [...focus, [webcam, corner]],
    // Main's layout, with the game as a second camera-sized picture at the bottom.
    "Main + Game": [
      ...main,
      [chatSmall, { x: left, y: 270, w: SIDE, h: H - 570 }],
      [game, { x: left, y: H - 300, w: SIDE, h: 300 }],
    ],
    "Game Focus": [
      [backdrop, full],
      [game, { x: 0, y: 0, w: W, h: H - 120 }],
      [webcam, corner],
      [hudBar, { x: 0, y: H - 120, w: W, h: 120 }],
    ],
    Break: [
      [music, full],
      [backdrop, full],
      [onBreak, full],
      [chat, aside],
    ],
  }
}
