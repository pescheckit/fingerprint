import { test, expect } from '@playwright/test';

const TARGET_URL = 'https://fingerprint-3y6.pages.dev/niels/';
const TOR_PROXY = 'socks5://localhost:9050';
const SOCKS_PROXY = process.env.PROXY_SERVER || 'socks5://localhost:1080';
const IP_CHECK_URL = 'https://api.ipify.org?format=json';

test.describe('Tor Proxy Fingerprint Tests', () => {
  test('Tor proxy routes through a different IP than direct and SOCKS5', async ({ browser }) => {
    // Get direct IP
    const directContext = await browser.newContext();
    const directPage = await directContext.newPage();
    await directPage.goto(IP_CHECK_URL);
    const directIP = await directPage.evaluate(() => document.body.innerText);
    await directContext.close();

    // Get Tor IP
    const torContext = await browser.newContext({
      proxy: { server: TOR_PROXY },
    });
    const torPage = await torContext.newPage();
    await torPage.goto(IP_CHECK_URL);
    const torIP = await torPage.evaluate(() => document.body.innerText);
    await torContext.close();

    console.log(`Direct IP: ${directIP}`);
    console.log(`Tor IP:    ${torIP}`);

    expect(directIP).not.toBe(torIP);
  });

  test('fingerprint is identical with and without Tor', async ({ browser }) => {
    // Direct connection
    const directContext = await browser.newContext();
    const directPage = await directContext.newPage();
    await directPage.goto(TARGET_URL);
    await directPage.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 30000 });
    const directHash = await directPage.textContent('#fingerprint-hash');
    await directContext.close();

    // Through Tor
    const torContext = await browser.newContext({
      proxy: { server: TOR_PROXY },
    });
    const torPage = await torContext.newPage();
    await torPage.goto(TARGET_URL);
    await torPage.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 30000 });
    const torHash = await torPage.textContent('#fingerprint-hash');
    await torContext.close();

    console.log(`Direct hash: ${directHash}`);
    console.log(`Tor hash:    ${torHash}`);

    expect(directHash).toBe(torHash);
  });

  test('all signal groups load through Tor', async ({ browser }) => {
    const context = await browser.newContext({
      proxy: { server: TOR_PROXY },
    });
    const page = await context.newPage();
    await page.goto(TARGET_URL);
    await page.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 30000 });

    const groups = await page.locator('.signal-group').count();
    expect(groups).toBeGreaterThanOrEqual(5);

    await context.close();
  });
});
