/**
 * Tor Browser vs Regular Firefox Fingerprint Comparison
 *
 * This test launches the REAL Tor Browser (hardened Firefox fork with
 * anti-fingerprinting patches like resistFingerprinting, letterboxing,
 * canvas blocking, etc.) and compares its fingerprint against regular Firefox.
 *
 * Uses selenium-webdriver + geckodriver (NOT Playwright) because we need
 * to control the actual Tor Browser binary.
 *
 * Usage: node e2e/tor-browser.test.mjs
 *
 * Prerequisites:
 *   - Tor Browser extracted to /tmp/tor-browser/
 *   - geckodriver installed (npm install -D selenium-webdriver geckodriver)
 *   - tor SOCKS proxy running on localhost:9050
 *   - Xvfb or MOZ_HEADLESS=1 if no display is available
 */

import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// ── Configuration ───────────────────────────────────────────────────────────

const TARGET_URL = 'https://fingerprint-3y6.pages.dev/niels/';
const PAGE_TIMEOUT = 60_000; // 60s — Tor is slow
const TOR_BROWSER_DIR = '/tmp/tor-browser';
const TOR_SOCKS_HOST = '127.0.0.1';
const TOR_SOCKS_PORT = 9050;

// ── Helpers ─────────────────────────────────────────────────────────────────

function findTorBrowserBinary() {
  // The Tor Browser bundle extracts to different structures depending on version.
  // Common paths:
  const candidates = [
    path.join(TOR_BROWSER_DIR, 'Browser', 'firefox'),
    path.join(TOR_BROWSER_DIR, 'Browser', 'firefox.real'),
    path.join(TOR_BROWSER_DIR, 'Browser', 'start-tor-browser'),
    // Newer Tor Browser layout
    path.join(TOR_BROWSER_DIR, 'firefox'),
    // If user extracted with different top-level name
    '/tmp/tor-browser_en-US/Browser/firefox',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`  Found Tor Browser binary: ${candidate}`);
      return candidate;
    }
  }

  // Try to find it dynamically
  try {
    const found = execSync(`find /tmp -name "firefox" -path "*/tor*" -type f 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim().split('\n')[0];
    if (found) {
      console.log(`  Found Tor Browser binary via search: ${found}`);
      return found;
    }
  } catch {
    // ignore
  }

  throw new Error(
    `Could not find Tor Browser binary. Looked in:\n${candidates.map(c => '  - ' + c).join('\n')}\n` +
    `Make sure Tor Browser is extracted to ${TOR_BROWSER_DIR}/`
  );
}

function findTorBrowserProfileDir() {
  // Tor Browser ships with a preconfigured profile
  const candidates = [
    path.join(TOR_BROWSER_DIR, 'Browser', 'TorBrowser', 'Data', 'Browser', 'profile.default'),
    path.join(TOR_BROWSER_DIR, 'TorBrowser', 'Data', 'Browser', 'profile.default'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`  Found Tor Browser profile: ${candidate}`);
      return candidate;
    }
  }

  // Try dynamic search
  try {
    const found = execSync(`find /tmp -path "*/TorBrowser/Data/Browser/profile.default" -type d 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim().split('\n')[0];
    if (found) {
      console.log(`  Found Tor Browser profile via search: ${found}`);
      return found;
    }
  } catch {
    // ignore
  }

  console.log('  Warning: Could not find Tor Browser profile directory. Will use custom profile.');
  return null;
}

function findGeckodriver() {
  // First check the local node_modules binary
  const localBin = path.resolve('node_modules', '.bin', 'geckodriver');
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // Check if geckodriver is on PATH
  try {
    const found = execSync('which geckodriver 2>/dev/null', { encoding: 'utf-8' }).trim();
    if (found) return found;
  } catch {
    // ignore
  }

  // Check the geckodriver npm package for the binary
  try {
    const geckodriverPkg = path.resolve('node_modules', 'geckodriver');
    if (fs.existsSync(geckodriverPkg)) {
      // The geckodriver npm package may store the binary in different places
      const pkgJson = JSON.parse(fs.readFileSync(path.join(geckodriverPkg, 'package.json'), 'utf-8'));
      if (pkgJson.bin) {
        const binPath = typeof pkgJson.bin === 'string' ? pkgJson.bin : Object.values(pkgJson.bin)[0];
        const fullPath = path.join(geckodriverPkg, binPath);
        if (fs.existsSync(fullPath)) return fullPath;
      }
    }
  } catch {
    // ignore
  }

  throw new Error(
    'Could not find geckodriver. Install it with: npm install -D geckodriver'
  );
}

function checkDisplay() {
  if (!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
    console.log('  No DISPLAY set — setting MOZ_HEADLESS=1 for headless mode');
    process.env.MOZ_HEADLESS = '1';
  } else {
    console.log(`  DISPLAY=${process.env.DISPLAY || process.env.WAYLAND_DISPLAY}`);
  }
}

async function collectFingerprint(driver, browserName) {
  console.log(`\n  [${browserName}] Navigating to ${TARGET_URL}...`);
  await driver.get(TARGET_URL);

  // Wait for fingerprint hash to be populated
  console.log(`  [${browserName}] Waiting for fingerprint hash...`);
  const hashEl = await driver.wait(
    until.elementLocated(By.css('#fingerprint-hash')),
    PAGE_TIMEOUT,
    `Timed out waiting for #fingerprint-hash element`
  );

  // Wait for the hash to be non-empty
  await driver.wait(async () => {
    const text = await hashEl.getText();
    return text && text.trim().length > 0;
  }, PAGE_TIMEOUT, `Timed out waiting for fingerprint hash to populate`);

  const hash = (await hashEl.getText()).trim();
  console.log(`  [${browserName}] Fingerprint hash: ${hash}`);

  // Also get cross-browser hash if available
  let deviceId = null;
  try {
    const crossEl = await driver.findElement(By.css('#device-id'));
    deviceId = (await crossEl.getText()).trim();
    console.log(`  [${browserName}] Device ID: ${deviceId}`);
  } catch {
    // Element may not exist
  }

  // Collect all signal group data
  console.log(`  [${browserName}] Reading signal groups...`);
  const signalData = await driver.executeScript(() => {
    const groups = document.querySelectorAll('.signal-group');
    const result = [];

    groups.forEach(group => {
      const nameEl = group.querySelector('.signal-group-title h3');
      const statusEl = group.querySelector('.signal-status-badge');
      const isError = statusEl ? statusEl.classList.contains('error') : false;

      const rows = group.querySelectorAll('.signal-row');
      const signals = [];

      rows.forEach(row => {
        const labelEl = row.querySelector('.signal-label');
        const valueEl = row.querySelector('.signal-value');
        signals.push({
          label: labelEl ? labelEl.textContent.trim() : '(unknown)',
          value: valueEl ? valueEl.textContent.trim().substring(0, 200) : '(empty)',
          hasImage: !!row.querySelector('.canvas-preview'),
        });
      });

      result.push({
        name: nameEl ? nameEl.textContent.trim() : '(unnamed)',
        isError,
        signalCount: signals.length,
        signals,
      });
    });

    return result;
  });

  console.log(`  [${browserName}] Found ${signalData.length} signal groups`);

  return { hash, deviceId, signalData };
}

// ── Browser Builders ────────────────────────────────────────────────────────

async function buildTorBrowserDriver(geckodriverPath) {
  const binary = findTorBrowserBinary();
  const profileDir = findTorBrowserProfileDir();

  const options = new firefox.Options();
  options.setBinary(binary);

  // If we found the Tor Browser profile, use it to get all the anti-fingerprinting prefs
  if (profileDir) {
    options.setProfile(profileDir);
  }

  // Critical Tor Browser / anti-fingerprinting preferences
  // These should already be set in the Tor Browser profile, but set them explicitly too
  options.setPreference('network.proxy.type', 1);
  options.setPreference('network.proxy.socks', TOR_SOCKS_HOST);
  options.setPreference('network.proxy.socks_port', TOR_SOCKS_PORT);
  options.setPreference('network.proxy.socks_remote_dns', true);
  options.setPreference('network.proxy.socks_version', 5);
  options.setPreference('privacy.resistFingerprinting', true);
  options.setPreference('webgl.disabled', false); // Tor Browser doesn't fully disable WebGL, it spoofs it

  // Prevent Tor Browser from trying to launch its own tor daemon
  // (we already have tor running on localhost:9050)
  options.setPreference('extensions.torlauncher.start_tor', false);
  options.setPreference('extensions.torlauncher.prompt_at_startup', false);

  // Allow marionette to work
  options.setPreference('marionette.enabled', true);

  // Disable first-run / update dialogs
  options.setPreference('browser.shell.checkDefaultBrowser', false);
  options.setPreference('browser.startup.homepage_override.mstone', 'ignore');
  options.setPreference('datareporting.policy.dataSubmissionEnabled', false);
  options.setPreference('toolkit.telemetry.reportingpolicy.firstRun', false);
  options.setPreference('browser.startup.page', 0);
  options.setPreference('browser.startup.homepage', 'about:blank');

  // Disable safe mode prompts
  options.setPreference('toolkit.startup.max_resumed_crashes', -1);
  options.setPreference('browser.sessionstore.resume_from_crash', false);

  // Set headless if no display
  if (process.env.MOZ_HEADLESS === '1') {
    options.addArguments('--headless');
  }

  const serviceBuilder = new firefox.ServiceBuilder(geckodriverPath);

  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(serviceBuilder)
    .build();

  return driver;
}

async function buildRegularFirefoxDriver(geckodriverPath) {
  const options = new firefox.Options();

  // Disable first-run dialogs for clean comparison
  options.setPreference('browser.shell.checkDefaultBrowser', false);
  options.setPreference('browser.startup.homepage_override.mstone', 'ignore');
  options.setPreference('datareporting.policy.dataSubmissionEnabled', false);
  options.setPreference('browser.startup.page', 0);
  options.setPreference('browser.startup.homepage', 'about:blank');

  // Use Tor SOCKS proxy so the page actually loads (same network path)
  // This ensures both browsers can reach the target URL
  options.setPreference('network.proxy.type', 1);
  options.setPreference('network.proxy.socks', TOR_SOCKS_HOST);
  options.setPreference('network.proxy.socks_port', TOR_SOCKS_PORT);
  options.setPreference('network.proxy.socks_remote_dns', true);
  options.setPreference('network.proxy.socks_version', 5);

  if (process.env.MOZ_HEADLESS === '1') {
    options.addArguments('--headless');
  }

  const serviceBuilder = new firefox.ServiceBuilder(geckodriverPath);

  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(serviceBuilder)
    .build();

  return driver;
}

// ── Comparison Logic ────────────────────────────────────────────────────────

function compareResults(torResult, firefoxResult) {
  const DIVIDER = '='.repeat(80);
  const THIN_DIVIDER = '-'.repeat(80);

  console.log('\n' + DIVIDER);
  console.log(' FINGERPRINT COMPARISON: Tor Browser vs Regular Firefox');
  console.log(DIVIDER);

  // Hash comparison
  console.log('\n  FINGERPRINT HASHES');
  console.log(THIN_DIVIDER);
  console.log(`  Tor Browser:     ${torResult.hash}`);
  console.log(`  Regular Firefox: ${firefoxResult.hash}`);
  console.log(`  Match:           ${torResult.hash === firefoxResult.hash ? 'YES (identical)' : 'NO (different)'}`);

  if (torResult.deviceId || firefoxResult.deviceId) {
    console.log(`\n  DEVICE IDS`);
    console.log(THIN_DIVIDER);
    console.log(`  Tor Browser:     ${torResult.deviceId || 'N/A'}`);
    console.log(`  Regular Firefox: ${firefoxResult.deviceId || 'N/A'}`);
    console.log(`  Match:           ${torResult.deviceId === firefoxResult.deviceId ? 'YES' : 'NO'}`);
  }

  // Build lookup maps
  const torGroups = new Map(torResult.signalData.map(g => [g.name, g]));
  const ffGroups = new Map(firefoxResult.signalData.map(g => [g.name, g]));
  const allGroupNames = [...new Set([...torGroups.keys(), ...ffGroups.keys()])];

  console.log(`\n  SIGNAL GROUP OVERVIEW (${allGroupNames.length} groups)`);
  console.log(THIN_DIVIDER);
  console.log(`  ${'Group'.padEnd(20)} ${'Tor Status'.padEnd(14)} ${'FF Status'.padEnd(14)} ${'Tor Signals'.padEnd(14)} ${'FF Signals'.padEnd(14)}`);
  console.log(`  ${'─'.repeat(20)} ${'─'.repeat(14)} ${'─'.repeat(14)} ${'─'.repeat(14)} ${'─'.repeat(14)}`);

  for (const name of allGroupNames) {
    const tor = torGroups.get(name);
    const ff = ffGroups.get(name);

    const torStatus = tor ? (tor.isError ? 'ERROR' : 'OK') : 'MISSING';
    const ffStatus = ff ? (ff.isError ? 'ERROR' : 'OK') : 'MISSING';
    const torCount = tor ? String(tor.signalCount) : '-';
    const ffCount = ff ? String(ff.signalCount) : '-';

    console.log(`  ${name.padEnd(20)} ${torStatus.padEnd(14)} ${ffStatus.padEnd(14)} ${torCount.padEnd(14)} ${ffCount.padEnd(14)}`);
  }

  // Detailed per-group comparison
  console.log(`\n  DETAILED SIGNAL COMPARISON`);
  console.log(DIVIDER);

  let totalSignals = 0;
  let blockedSignals = 0;
  let differentSignals = 0;
  let identicalSignals = 0;
  let torOnlyErrors = [];

  for (const name of allGroupNames) {
    const tor = torGroups.get(name);
    const ff = ffGroups.get(name);

    console.log(`\n  [${name}]`);
    console.log('  ' + THIN_DIVIDER);

    if (!tor) {
      console.log('    * MISSING in Tor Browser (blocked entirely)');
      blockedSignals += (ff ? ff.signalCount : 0);
      continue;
    }

    if (!ff) {
      console.log('    * MISSING in Regular Firefox');
      continue;
    }

    if (tor.isError && !ff.isError) {
      console.log(`    * ERROR in Tor Browser (blocked by anti-fingerprinting)`);
      if (tor.signals.length > 0) {
        console.log(`    * Error detail: ${tor.signals[0]?.value || 'unknown'}`);
      }
      torOnlyErrors.push(name);
      blockedSignals += ff.signalCount;
      continue;
    }

    if (tor.isError && ff.isError) {
      console.log('    * ERROR in both browsers');
      continue;
    }

    // Compare individual signals
    const torSignals = new Map(tor.signals.map(s => [s.label, s]));
    const ffSignals = new Map(ff.signals.map(s => [s.label, s]));
    const allLabels = [...new Set([...torSignals.keys(), ...ffSignals.keys()])];

    for (const label of allLabels) {
      const torSig = torSignals.get(label);
      const ffSig = ffSignals.get(label);
      totalSignals++;

      if (!torSig) {
        console.log(`    ${label.padEnd(30)} BLOCKED (missing in Tor)`);
        blockedSignals++;
        continue;
      }

      if (!ffSig) {
        console.log(`    ${label.padEnd(30)} TOR-ONLY (not in Firefox)`);
        continue;
      }

      // Compare values
      const torVal = torSig.value;
      const ffVal = ffSig.value;

      if (torSig.hasImage || ffSig.hasImage) {
        // Canvas images: can't easily compare text, note it
        const match = torVal === ffVal ? 'SAME' : 'DIFFERENT';
        console.log(`    ${label.padEnd(30)} [canvas image] ${match}`);
        if (match === 'DIFFERENT') differentSignals++;
        else identicalSignals++;
        continue;
      }

      if (torVal === ffVal) {
        console.log(`    ${label.padEnd(30)} IDENTICAL: ${torVal.substring(0, 60)}`);
        identicalSignals++;
      } else {
        console.log(`    ${label.padEnd(30)} DIFFERENT`);
        console.log(`      Tor: ${torVal.substring(0, 80)}`);
        console.log(`       FF: ${ffVal.substring(0, 80)}`);
        differentSignals++;
      }
    }
  }

  // Summary
  console.log('\n' + DIVIDER);
  console.log(' SUMMARY');
  console.log(DIVIDER);
  console.log(`  Total signal comparisons: ${totalSignals}`);
  console.log(`  Identical signals:        ${identicalSignals}`);
  console.log(`  Different signals:        ${differentSignals}`);
  console.log(`  Blocked/missing in Tor:   ${blockedSignals}`);
  console.log(`  Groups erroring in Tor:   ${torOnlyErrors.length > 0 ? torOnlyErrors.join(', ') : 'none'}`);
  console.log(`  Fingerprint hashes match: ${torResult.hash === firefoxResult.hash ? 'YES' : 'NO'}`);

  if (differentSignals > 0 || blockedSignals > 0) {
    console.log(`\n  Tor Browser's anti-fingerprinting affected ${differentSignals + blockedSignals} out of ${totalSignals} signals.`);
    console.log(`  This shows the browser's privacy protections are actively modifying fingerprint data.`);
  }

  console.log('\n' + DIVIDER + '\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tor Browser vs Regular Firefox — Fingerprint Comparison Test');
  console.log('='.repeat(60));

  // Pre-flight checks
  console.log('\n1. Pre-flight checks...');
  checkDisplay();

  const geckodriverPath = findGeckodriver();
  console.log(`  geckodriver: ${geckodriverPath}`);

  // Test 1: Launch Tor Browser
  console.log('\n2. Launching Tor Browser...');
  let torDriver;
  let torResult;
  try {
    torDriver = await buildTorBrowserDriver(geckodriverPath);
    torResult = await collectFingerprint(torDriver, 'Tor Browser');
  } catch (err) {
    console.error(`  ERROR launching/running Tor Browser: ${err.message}`);
    console.error(err.stack);
    if (torDriver) await torDriver.quit().catch(() => {});
    process.exit(1);
  } finally {
    if (torDriver) await torDriver.quit().catch(() => {});
  }

  // Test 2: Launch Regular Firefox
  console.log('\n3. Launching Regular Firefox...');
  let ffDriver;
  let ffResult;
  try {
    ffDriver = await buildRegularFirefoxDriver(geckodriverPath);
    ffResult = await collectFingerprint(ffDriver, 'Firefox');
  } catch (err) {
    console.error(`  ERROR launching/running Regular Firefox: ${err.message}`);
    console.error(err.stack);
    if (ffDriver) await ffDriver.quit().catch(() => {});
    process.exit(1);
  } finally {
    if (ffDriver) await ffDriver.quit().catch(() => {});
  }

  // Compare
  console.log('\n4. Comparing results...');
  compareResults(torResult, ffResult);

  // Always exit 0 — this is informational
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
