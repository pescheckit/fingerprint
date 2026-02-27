import { defineConfig } from '@playwright/test';

/**
 * Config for the cross-browser hash stability tests.
 *
 * Tests manage their own browser instances (launching Chromium, Firefox,
 * and WebKit within a single test), so we run as a single project.
 *
 * Requirements:
 *   - Vite dev server on port 5173 (started automatically via webServer)
 *   - SOCKS5 proxy on localhost:1080 (ssh -D 1080 bingo-barry.nl)
 *   - demo.bingo-barry.nl reachable through the proxy
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'cross-browser.spec.js',
  timeout: 120_000,
  use: {
    headless: true,
  },
  webServer: {
    command: 'npx vite --port 5173',
    port: 5173,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'cross-browser', use: {} },
  ],
});
