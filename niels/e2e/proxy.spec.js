import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.FINGERPRINT_URL || 'https://demo.bingo-barry.nl/';
const PROXY_SERVER = process.env.PROXY_SERVER || 'socks5://localhost:1080';
const IP_CHECK_URL = 'https://api.ipify.org?format=json';
const AUTH_CREDENTIALS = { username: 'demo', password: 'karbonkel' };

test.describe('SOCKS5 Proxy Fingerprint Comparison', () => {
  test('proxy is actually routing traffic through a different IP', async ({ browser }) => {
    // Get direct IP
    const directContext = await browser.newContext();
    const directPage = await directContext.newPage();
    await directPage.goto(IP_CHECK_URL);
    const directIP = await directPage.evaluate(() => document.body.innerText);
    await directContext.close();

    // Get proxied IP
    const proxiedContext = await browser.newContext({
      proxy: { server: PROXY_SERVER },
    });
    const proxiedPage = await proxiedContext.newPage();
    await proxiedPage.goto(IP_CHECK_URL);
    const proxiedIP = await proxiedPage.evaluate(() => document.body.innerText);
    await proxiedContext.close();

    console.log(`Direct IP:  ${directIP}`);
    console.log(`Proxied IP: ${proxiedIP}`);

    expect(directIP).not.toBe(proxiedIP);
  });

  test('fingerprint is identical with and without proxy', async ({ browser }) => {
    // Direct connection — no proxy
    const directContext = await browser.newContext({
      httpCredentials: AUTH_CREDENTIALS,
    });
    const directPage = await directContext.newPage();
    await directPage.goto(TARGET_URL);
    await directPage.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 15000 });
    const directHash = await directPage.textContent('#fingerprint-hash');
    await directContext.close();

    // Proxied connection — through SOCKS5
    const proxiedContext = await browser.newContext({
      proxy: { server: PROXY_SERVER },
      httpCredentials: AUTH_CREDENTIALS,
    });
    const proxiedPage = await proxiedContext.newPage();
    await proxiedPage.goto(TARGET_URL);
    await proxiedPage.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 15000 });
    const proxiedHash = await proxiedPage.textContent('#fingerprint-hash');
    await proxiedContext.close();

    console.log(`Direct hash:  ${directHash}`);
    console.log(`Proxied hash: ${proxiedHash}`);

    expect(directHash).toBe(proxiedHash);
  });

  test('all signal groups load through proxy', async ({ browser }) => {
    const context = await browser.newContext({
      proxy: { server: PROXY_SERVER },
      httpCredentials: AUTH_CREDENTIALS,
    });
    const page = await context.newPage();
    await page.goto(TARGET_URL);
    await page.waitForSelector('#fingerprint-hash:not(:empty)', { timeout: 15000 });

    const groups = await page.locator('.signal-group').count();
    expect(groups).toBeGreaterThanOrEqual(5);

    await context.close();
  });
});
