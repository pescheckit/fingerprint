import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'proxy.spec.js',
  fullyParallel: false,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-proxy',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-proxy',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-proxy',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
