import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:5199',
    // Tablet-in-landscape-ish viewport — the smallest device he'll use
    viewport: { width: 1024, height: 640 },
    hasTouch: true,
    // the app honors prefers-reduced-motion; also keeps elements stable for clicks
    reducedMotion: 'reduce',
    launchOptions:
      process.env.PLAYWRIGHT_CHROMIUM_PATH != null
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {}
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true
  }
})
