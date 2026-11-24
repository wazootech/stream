// Every brand string in one place. Rebranding the stream means editing this
// file (plus the accent color in overlays/session.css and the copy in docs/).
export const BRAND = {
  /** Name of the OBS scene collection. */
  collectionName: "Wazoo Stream",
  /** Title shown on the overlays until `session title` sets one. */
  defaultTitle: "Wazoo Live",
  /** File written by `npm run build`. */
  collectionFile: "wazoo-stream.scenes.json",
} as const;
