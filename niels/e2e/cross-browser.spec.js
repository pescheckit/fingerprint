import { test, expect, chromium, firefox, webkit } from '@playwright/test';

/**
 * Cross-browser fingerprint stability tests.
 *
 * Launches 3 browser engines (Chromium, Firefox, WebKit) in 2 modes each:
 *   - Direct:  localhost dev server (no proxy)
 *   - Proxy:   SOCKS5 through external URL (catches Firefox ETP, real-world caching, etc.)
 *
 * All 6 combinations must produce the same cross-browser hash.
 */

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:5173/';
const PROXY_URL = process.env.PROXY_URL || 'https://demo.bingo-barry.nl/';
const PROXY_SERVER = process.env.PROXY_SERVER || 'socks5://localhost:1080';
const AUTH_CREDENTIALS = { username: 'demo', password: 'karbonkel' };
const HASH_TIMEOUT = 15_000;

const ENGINES = [
  { name: 'Chromium', launcher: chromium },
  { name: 'Firefox', launcher: firefox },
  { name: 'WebKit', launcher: webkit },
];

async function collectCrossBrowserHash(page) {
  await page.locator('#cross-browser-hash').waitFor({ timeout: HASH_TIMEOUT });
  return (await page.locator('#cross-browser-hash').textContent()).trim();
}

test.describe('Cross-Browser Hash — All 6 Combinations', () => {
  test('cross-browser hash is identical across 3 engines × 2 modes', async () => {
    const results = [];

    for (const { name, launcher } of ENGINES) {
      const browser = await launcher.launch();

      // --- Mode 1: Direct (localhost) ---
      const directCtx = await browser.newContext();
      const directPage = await directCtx.newPage();
      await directPage.goto(LOCAL_URL);
      const directHash = await collectCrossBrowserHash(directPage);
      await directCtx.close();

      results.push({ engine: name, mode: 'direct', hash: directHash });

      // --- Mode 2: Proxy (external URL via SOCKS5) ---
      const proxyCtx = await browser.newContext({
        proxy: { server: PROXY_SERVER },
        httpCredentials: AUTH_CREDENTIALS,
      });
      const proxyPage = await proxyCtx.newPage();
      await proxyPage.goto(PROXY_URL);
      const proxyHash = await collectCrossBrowserHash(proxyPage);
      await proxyCtx.close();

      results.push({ engine: name, mode: 'proxy', hash: proxyHash });

      await browser.close();
    }

    // Print all results for debugging
    console.log('\n  Cross-Browser Hash Results:');
    console.log('  ─────────────────────────────────────────────');
    for (const r of results) {
      console.log(`  ${r.engine.padEnd(10)} ${r.mode.padEnd(8)} → ${r.hash}`);
    }
    console.log('  ─────────────────────────────────────────────\n');

    // All 6 hashes must be identical
    const referenceHash = results[0].hash;
    for (const r of results.slice(1)) {
      expect(
        r.hash,
        `${r.engine} (${r.mode}) hash "${r.hash}" differs from Chromium (direct) "${referenceHash}"`
      ).toBe(referenceHash);
    }
  });

  test('browser fingerprint is stable across contexts within each engine', async () => {
    // Verifies incognito-like stability: two separate contexts in the
    // same engine should produce the same browser AND cross-browser hash.
    for (const { name, launcher } of ENGINES) {
      const browser = await launcher.launch();

      const ctx1 = await browser.newContext();
      const page1 = await ctx1.newPage();
      await page1.goto(LOCAL_URL);
      await page1.locator('#fingerprint-hash').waitFor({ timeout: HASH_TIMEOUT });
      const hash1 = (await page1.locator('#fingerprint-hash').textContent()).trim();
      const cross1 = (await page1.locator('#cross-browser-hash').textContent()).trim();
      await ctx1.close();

      const ctx2 = await browser.newContext();
      const page2 = await ctx2.newPage();
      await page2.goto(LOCAL_URL);
      await page2.locator('#fingerprint-hash').waitFor({ timeout: HASH_TIMEOUT });
      const hash2 = (await page2.locator('#fingerprint-hash').textContent()).trim();
      const cross2 = (await page2.locator('#cross-browser-hash').textContent()).trim();
      await ctx2.close();

      await browser.close();

      expect(hash1, `${name}: browser hash not stable across contexts`).toBe(hash2);
      expect(cross1, `${name}: cross-browser hash not stable across contexts`).toBe(cross2);
    }
  });
});
