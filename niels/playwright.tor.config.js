import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'tor.spec.js',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-tor',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-tor',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-tor',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
