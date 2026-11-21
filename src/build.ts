import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { buildSceneCollection, CANVAS } from "./scenes.ts";
import { loadState, overlaysDir, saveState, statePaths } from "./state.ts";

const { values } = parseArgs({ options: { out: { type: "string" } } });

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(values.out ?? join(root, "dist", "fartlabs-stream.scenes.json"));

// Overlays read `state.js`; create it on first build so the pages never 404.
if (!existsSync(statePaths().js)) saveState(loadState());

const collection = buildSceneCollection({ overlaysDir });
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(collection, null, 4) + "\n");

console.log(`Wrote ${out}`);
console.log(
  `\nNext:\n` +
    `  1. OBS > Settings > Video: set Base and Output to ${CANVAS.width}x${CANVAS.height}.\n` +
    `  2. OBS > Scene Collection > Import, then pick that file.\n` +
    `  3. Pick your camera in the "Webcam" source and your screen in "Display".\n` +
    `  4. Add chat for yourself: OBS > Docks > Twitch Chat (nothing on stream).\n`,
);
