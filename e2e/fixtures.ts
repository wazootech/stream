// A real dashboard on a free port with throwaway state, so tests never touch the
// live session. The overlay pages are copied next to that state, as OBS sees them.
import { cpSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { pathToFileURL } from "node:url"
import { test as base, expect } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import { createDashboardServer, listenLocal } from "../src/dashboard/server.ts"
import { defaultState, loadState, overlaysDir, saveState } from "../src/state.ts"
import type { State } from "../src/state.ts"

export interface Stream {
  /** The dashboard, already open and connected. */
  dashboard: Page
  /** What is saved right now. */
  state(): State
  /** Opens an overlay page the way an OBS browser source does. */
  overlay(file: string): Promise<Page>
  stopServer(): void
}

export const test = base.extend<{ stream: Stream }>({
  stream: async ({ page, context }, use) => {
    const dir = mkdtempSync(join(tmpdir(), "stream-e2e-"))
    cpSync(overlaysDir, dir, {
      recursive: true,
      filter: (path) => !basename(path).startsWith("state."),
    })
    saveState(defaultState(), dir)
    const server = createDashboardServer({ stateDir: dir })
    const { port } = await listenLocal(server, 0)
    const stopServer = () => {
      server.closeAllConnections()
      server.close()
    }
    const crashes: Error[] = []
    context.on("weberror", (event) => crashes.push(event.error()))

    await page.goto(`http://127.0.0.1:${port}/`)
    await expect(page.locator("#message")).toHaveText("Connected.")
    await use({
      dashboard: page,
      state: () => loadState(dir),
      async overlay(file) {
        const [name, query] = file.split("?")
        const url = pathToFileURL(join(dir, name)).href
        const overlay = await context.newPage()
        await overlay.setViewportSize({ width: 1920, height: 1080 })
        await overlay.goto(query ? `${url}?${query}` : url)
        return overlay
      },
      stopServer,
    })
    stopServer()
    rmSync(dir, { recursive: true, force: true })
    expect(crashes, "no page may throw").toEqual([])
  },
})

/** Fills one of the dashboard's single-field forms and submits it. */
export async function send(page: Page, command: string, text: string) {
  const form: Locator = page.locator(`form[data-command="${command}"]`)
  await form.getByRole("textbox").fill(text)
  await form.locator("button").click()
}

export { expect }
