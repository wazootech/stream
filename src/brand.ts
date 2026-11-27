// Every brand string in one place. Rebranding the stream means editing this
// file (plus the palette in overlays/session.css and the copy in docs/).
export const BRAND = {
  /** Name of the OBS scene collection. */
  collectionName: "Wazoo Stream",
  /** Title shown on the overlays until `session title` sets one. */
  defaultTitle: "Wazoo Live",
  /** Music label shown until `session music` changes it; a reset restores it. */
  musicLabel: "StreamBeats - Electric",
  /** File written by `npm run build`. */
  collectionFile: "wazoo-stream.scenes.json",
  /** Backdrop color behind the scenes (Wazoo "void"), as [r, g, b]. */
  backdropRgb: [0x04, 0x04, 0x04],
} as const
