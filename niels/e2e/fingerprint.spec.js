import { test, expect } from '@playwright/test';

test.describe('Browser Fingerprint', () => {
  test('displays a 64-character hex hash', async ({ page }) => {
    await page.goto('/');

    const hashEl = page.locator('#fingerprint-hash');
    await expect(hashEl).toBeVisible({ timeout: 10_000 });

    const hash = await hashEl.textContent();
    expect(hash).toBeTruthy();
    expect(hash.trim()).toMatch(/^[a-f0-9]{64}$/);
  });

  test('hash is stable across reloads', async ({ page }) => {
    await page.goto('/');

    const hashEl = page.locator('#fingerprint-hash');
    await expect(hashEl).toBeVisible({ timeout: 10_000 });
    const firstHash = (await hashEl.textContent()).trim();

    await page.reload();
    await expect(hashEl).toBeVisible({ timeout: 10_000 });
    const secondHash = (await hashEl.textContent()).trim();

    expect(firstHash).toBe(secondHash);
  });

  test('renders signal groups', async ({ page }) => {
    await page.goto('/');

    const groups = page.locator('.signal-group');
    await expect(groups.first()).toBeVisible({ timeout: 10_000 });

    const count = await groups.count();
    expect(count).toBeGreaterThan(0);
  });

  test('signal groups contain signal rows with labels and values', async ({ page }) => {
    await page.goto('/');

    const rows = page.locator('.signal-row');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verify the first row has both a label and a value
    const firstRow = rows.first();
    await expect(firstRow.locator('.signal-label')).toBeVisible();
    await expect(firstRow.locator('.signal-value')).toBeVisible();
  });
});
