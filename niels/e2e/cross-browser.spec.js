import { test, expect, chromium, firefox, webkit } from '@playwright/test';

/**
 * Cross-browser fingerprint stability tests.
 *
 * Launches 3 browser engines in 3 modes:
 *   - Direct:   localhost dev server (baseline)
 *   - Proxy:    SOCKS5 through external URL (catches Firefox ETP)
 *   - Private:  simulated private browsing (Firefox fingerprint protection,
 *               Chromium incognito args, WebKit fresh context)
 *
 * All combinations must produce the same device ID.
 */

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:5173/';
const PROXY_URL = process.env.PROXY_URL || 'https://demo.bingo-barry.nl/';
const PROXY_SERVER = process.env.PROXY_SERVER || 'socks5://localhost:1080';
const AUTH_CREDENTIALS = { username: 'demo', password: 'karbonkel' };
const HASH_TIMEOUT = 15_000;

async function collectHashes(page) {
  await page.locator('#device-id').waitFor({ timeout: HASH_TIMEOUT });
  await page.locator('#fingerprint-hash').waitFor({ timeout: HASH_TIMEOUT });
  return {
    browserHash: (await page.locator('#fingerprint-hash').textContent()).trim(),
    deviceId: (await page.locator('#device-id').textContent()).trim(),
  };
}

test.describe('Device ID — All Combinations', () => {
  test('device ID is identical across 3 engines × 3 modes (direct, proxy, private)', async () => {
    const results = [];

    // --- Chromium ---
    {
      // Direct
      const browser = await chromium.launch();
      const directCtx = await browser.newContext();
      const directPage = await directCtx.newPage();
      await directPage.goto(LOCAL_URL);
      results.push({ engine: 'Chromium', mode: 'direct', ...(await collectHashes(directPage)) });
      await directCtx.close();

      // Proxy
      const proxyCtx = await browser.newContext({
        proxy: { server: PROXY_SERVER },
        httpCredentials: AUTH_CREDENTIALS,
      });
      const proxyPage = await proxyCtx.newPage();
      await proxyPage.goto(PROXY_URL);
      results.push({ engine: 'Chromium', mode: 'proxy', ...(await collectHashes(proxyPage)) });
      await proxyCtx.close();
      await browser.close();

      // Private (Chromium --incognito flag — contexts are already OTR,
      // but the flag enables any incognito-specific code paths)
      const privateBrowser = await chromium.launch({ args: ['--incognito'] });
      const privateCtx = await privateBrowser.newContext();
      const privatePage = await privateCtx.newPage();
      await privatePage.goto(LOCAL_URL);
      results.push({ engine: 'Chromium', mode: 'private', ...(await collectHashes(privatePage)) });
      await privateCtx.close();
      await privateBrowser.close();
    }

    // --- Firefox ---
    {
      // Direct
      const browser = await firefox.launch();
      const directCtx = await browser.newContext();
      const directPage = await directCtx.newPage();
      await directPage.goto(LOCAL_URL);
      results.push({ engine: 'Firefox', mode: 'direct', ...(await collectHashes(directPage)) });
      await directCtx.close();

      // Proxy
      const proxyCtx = await browser.newContext({
        proxy: { server: PROXY_SERVER },
        httpCredentials: AUTH_CREDENTIALS,
      });
      const proxyPage = await proxyCtx.newPage();
      await proxyPage.goto(PROXY_URL);
      results.push({ engine: 'Firefox', mode: 'proxy', ...(await collectHashes(proxyPage)) });
      await proxyCtx.close();
      await browser.close();

      // Private (enable Firefox fingerprinting protection — same protections
      // that activate in real Firefox private browsing: canvas noise,
      // WebGL noise, hardware spoofing, font restriction)
      const privateBrowser = await firefox.launch({
        firefoxUserPrefs: {
          'privacy.fingerprintingProtection': true,
          'privacy.fingerprintingProtection.pbmode': true,
        },
      });
      const privateCtx = await privateBrowser.newContext();
      const privatePage = await privateCtx.newPage();
      await privatePage.goto(LOCAL_URL);
      results.push({ engine: 'Firefox', mode: 'private', ...(await collectHashes(privatePage)) });
      await privateCtx.close();
      await privateBrowser.close();
    }

    // --- WebKit ---
    {
      // Direct
      const browser = await webkit.launch();
      const directCtx = await browser.newContext();
      const directPage = await directCtx.newPage();
      await directPage.goto(LOCAL_URL);
      results.push({ engine: 'WebKit', mode: 'direct', ...(await collectHashes(directPage)) });
      await directCtx.close();

      // Proxy
      const proxyCtx = await browser.newContext({
        proxy: { server: PROXY_SERVER },
        httpCredentials: AUTH_CREDENTIALS,
      });
      const proxyPage = await proxyCtx.newPage();
      await proxyPage.goto(PROXY_URL);
      results.push({ engine: 'WebKit', mode: 'proxy', ...(await collectHashes(proxyPage)) });
      await proxyCtx.close();

      // Private (WebKit has ITP built-in; fresh context is the closest
      // approximation — no additional launch flags available)
      const privateCtx = await browser.newContext();
      const privatePage = await privateCtx.newPage();
      await privatePage.goto(LOCAL_URL);
      results.push({ engine: 'WebKit', mode: 'private', ...(await collectHashes(privatePage)) });
      await privateCtx.close();
      await browser.close();
    }

    // Print all results for debugging
    console.log('\n  Device ID Results (9 combinations):');
    console.log('  ─────────────────────────────────────────────');
    for (const r of results) {
      console.log(`  ${r.engine.padEnd(10)} ${r.mode.padEnd(8)} → ${r.deviceId}`);
    }
    console.log('  ─────────────────────────────────────────────\n');

    // All device IDs must be identical
    const referenceHash = results[0].deviceId;
    for (const r of results.slice(1)) {
      expect(
        r.deviceId,
        `${r.engine} (${r.mode}) device ID "${r.deviceId}" differs from Chromium (direct) "${referenceHash}"`
      ).toBe(referenceHash);
    }
  });

  test('browser fingerprint is stable across normal and private contexts', async () => {
    // Chromium: normal vs --incognito should give the same browser hash
    {
      const browser = await chromium.launch();
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(LOCAL_URL);
      const normal = await collectHashes(page);
      await ctx.close();
      await browser.close();

      const privateBrowser = await chromium.launch({ args: ['--incognito'] });
      const pCtx = await privateBrowser.newContext();
      const pPage = await pCtx.newPage();
      await pPage.goto(LOCAL_URL);
      const priv = await collectHashes(pPage);
      await pCtx.close();
      await privateBrowser.close();

      expect(normal.browserHash, 'Chromium: browser hash differs in incognito').toBe(priv.browserHash);
      expect(normal.deviceId, 'Chromium: device ID differs in incognito').toBe(priv.deviceId);
    }

    // Firefox: normal vs fingerprint-protected should give the same
    // device ID (browser hash may differ due to canvas noise)
    {
      const browser = await firefox.launch();
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(LOCAL_URL);
      const normal = await collectHashes(page);
      await ctx.close();
      await browser.close();

      const privateBrowser = await firefox.launch({
        firefoxUserPrefs: {
          'privacy.fingerprintingProtection': true,
          'privacy.fingerprintingProtection.pbmode': true,
        },
      });
      const pCtx = await privateBrowser.newContext();
      const pPage = await pCtx.newPage();
      await pPage.goto(LOCAL_URL);
      const priv = await collectHashes(pPage);
      await pCtx.close();
      await privateBrowser.close();

      // Device ID MUST match (our whole point)
      expect(
        normal.deviceId,
        'Firefox: device ID differs with fingerprint protection enabled'
      ).toBe(priv.deviceId);

      // Browser hash: log if different (canvas noise may cause it)
      if (normal.browserHash !== priv.browserHash) {
        console.log(`  Note: Firefox browser hash differs with fingerprint protection`);
        console.log(`    Normal:  ${normal.browserHash}`);
        console.log(`    Private: ${priv.browserHash}`);
      }
    }
  });
});
