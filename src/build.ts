import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { BRAND } from "./brand.ts"
import { buildSceneCollection, CANVAS } from "./scenes.ts"
import { loadState, overlaysDir, saveState, statePaths } from "./state.ts"

const { values } = parseArgs({ options: { out: { type: "string" } } })

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = resolve(values.out ?? join(root, "dist", BRAND.collectionFile))

// Overlays read `state.js`; create it on first build so the pages never 404.
if (!existsSync(statePaths().js)) saveState(loadState())

const collection = buildSceneCollection({ overlaysDir })
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(collection, null, 4) + "\n")

console.log(`Wrote ${out}`)
console.log(
  `\nNext:\n` +
    `  1. OBS > Settings > Video: set Base and Output to ${CANVAS.width}x${CANVAS.height}.\n` +
    `  2. OBS > Scene Collection > Import, then pick that file.\n` +
    `  3. Pick your camera in the "Webcam" source and your screens in "Display" and "Game Screen".\n` +
    `  4. Add chat for yourself: connect YouTube in Settings > Stream, then open chat from Docks.\n`,
)
