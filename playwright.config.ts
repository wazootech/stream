import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    // About the width of an OBS dock.
    viewport: { width: 360, height: 900 },
    // CI downloads Playwright's Chromium. Locally, use an installed browser so
    // nothing extra is downloaded; set PW_CHANNEL=chrome where Edge is missing.
    channel: process.env.CI ? undefined : (process.env.PW_CHANNEL ?? "msedge"),
    trace: "retain-on-failure",
  },
})
