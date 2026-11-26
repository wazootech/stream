# stream

OBS scenes, overlays, and session templates for the Wazoo stream. See
[`README.md`](README.md) for setup and usage.

## Rules

- **Node + TypeScript only.** Code in `src/` is `.ts`, run directly by Node (22.18+)
  with no build step and no runtime dependencies. Use erasable syntax only: no `enum`,
  `namespace`, or constructor parameter properties.
- **Overlays are plain JS.** `overlays/*.js` run in OBS browser sources over `file://`,
  where ES modules and `fetch` are blocked. Keep them classic scripts with
  `// @ts-check` and JSDoc types, and share types via `overlays/globals.d.ts` and
  `src/state.ts`.
- **The dashboard page is plain JS too.** `dashboard/*.js` are ES modules checked the
  same way, served by `src/dashboard.ts` on loopback only. Keep its Host, Origin,
  content-type, and body-size checks, and add any new file to `src/dashboard/static.ts`.
- **No machine-specific data in git.** The scene collection embeds absolute paths, so it
  is generated into `dist/` (gitignored) by `npm run build`. Live state
  (`overlays/state.js`, `state.json`) is gitignored too. This repo is public.
- **Verify before pushing:**
  `npm run format:check && npm run lint && npm run check && npm test && npm run build`.
- **Layouts target a 1920x1080 canvas.** Change `CANVAS` in `src/scenes.ts` if that ever
  changes, and update the README.
- **Brand strings live in `src/brand.ts`.** The accent color is in
  `overlays/session.css` and the channel copy is in `docs/`. Keep the Wazoo voice plain:
  Ethan from Wazoo, building in public.
- **Family rules apply.** See the
  [Wazoo workspace guide](https://github.com/wazootech/workspace/blob/main/AGENTS.md)
  for code-health, supply-chain, and secret-scan standards.
