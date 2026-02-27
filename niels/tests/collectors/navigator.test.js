import { describe, it, expect, afterEach } from 'vitest';
import { NavigatorCollector } from '../../src/collectors/navigator.js';
import { Collector } from '../../src/collector.js';

describe('NavigatorCollector', () => {
  let collector;

  // Helper to define a navigator property for a single test.
  // Returns a restore function.
  function stubNavigator(prop, value) {
    const desc = Object.getOwnPropertyDescriptor(globalThis.navigator, prop);
    Object.defineProperty(globalThis.navigator, prop, {
      value,
      configurable: true,
      writable: true,
    });
    return () => {
      if (desc) {
        Object.defineProperty(globalThis.navigator, prop, desc);
      } else {
        delete globalThis.navigator[prop];
      }
    };
  }

  const restorers = [];

  function stub(prop, value) {
    restorers.push(stubNavigator(prop, value));
  }

  afterEach(() => {
    while (restorers.length) restorers.pop()();
  });

  it('extends Collector with correct name and description', () => {
    collector = new NavigatorCollector();
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('navigator');
    expect(collector.description).toBe('Browser and device properties');
  });

  it('collects all expected keys', async () => {
    collector = new NavigatorCollector();
    const result = await collector.collect();
    const expectedKeys = [
      'userAgent', 'platform', 'languages', 'hardwareConcurrency',
      'deviceMemory', 'vendor', 'cookieEnabled', 'doNotTrack',
      'pdfViewerEnabled', 'maxTouchPoints',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('reads userAgent and platform correctly', async () => {
    stub('userAgent', 'TestAgent/1.0');
    stub('platform', 'TestPlatform');

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.userAgent).toBe('TestAgent/1.0');
    expect(result.platform).toBe('TestPlatform');
  });

  it('copies the languages array (not a reference)', async () => {
    const langs = ['en-US', 'nl'];
    stub('languages', langs);

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.languages).toEqual(['en-US', 'nl']);
    expect(result.languages).not.toBe(langs);
  });

  it('reads hardware properties', async () => {
    stub('hardwareConcurrency', 8);
    stub('deviceMemory', 16);

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.hardwareConcurrency).toBe(8);
    expect(result.deviceMemory).toBe(16);
  });

  it('reads vendor and boolean flags', async () => {
    stub('vendor', 'Google Inc.');
    stub('cookieEnabled', true);
    stub('pdfViewerEnabled', false);

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.vendor).toBe('Google Inc.');
    expect(result.cookieEnabled).toBe(true);
    expect(result.pdfViewerEnabled).toBe(false);
  });

  it('reads doNotTrack and maxTouchPoints', async () => {
    stub('doNotTrack', '1');
    stub('maxTouchPoints', 5);

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.doNotTrack).toBe('1');
    expect(result.maxTouchPoints).toBe(5);
  });

  it('returns null for missing deviceMemory (e.g. Firefox)', async () => {
    // Ensure deviceMemory is not present
    const desc = Object.getOwnPropertyDescriptor(globalThis.navigator, 'deviceMemory');
    if (desc) {
      Object.defineProperty(globalThis.navigator, 'deviceMemory', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      restorers.push(() => Object.defineProperty(globalThis.navigator, 'deviceMemory', desc));
    }

    collector = new NavigatorCollector();
    const result = await collector.collect();
    expect(result.deviceMemory).toBeNull();
  });

  it('returns correct data types', async () => {
    stub('userAgent', 'Mozilla/5.0');
    stub('platform', 'Linux x86_64');
    stub('languages', ['en']);
    stub('hardwareConcurrency', 4);
    stub('deviceMemory', 8);
    stub('vendor', 'Google Inc.');
    stub('cookieEnabled', true);
    stub('doNotTrack', '1');
    stub('pdfViewerEnabled', true);
    stub('maxTouchPoints', 0);

    collector = new NavigatorCollector();
    const result = await collector.collect();

    expect(typeof result.userAgent).toBe('string');
    expect(typeof result.platform).toBe('string');
    expect(Array.isArray(result.languages)).toBe(true);
    expect(typeof result.hardwareConcurrency).toBe('number');
    expect(typeof result.deviceMemory).toBe('number');
    expect(typeof result.vendor).toBe('string');
    expect(typeof result.cookieEnabled).toBe('boolean');
    expect(typeof result.doNotTrack).toBe('string');
    expect(typeof result.pdfViewerEnabled).toBe('boolean');
    expect(typeof result.maxTouchPoints).toBe('number');
  });
});
