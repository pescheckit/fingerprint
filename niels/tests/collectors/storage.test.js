import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageCollector } from '../../src/collectors/storage.js';
import { Collector } from '../../src/collector.js';

describe('StorageCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new StorageCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('storage');
    expect(collector.description).toBe('Storage and feature detection');
    expect(collector.crossBrowserKeys).toEqual([]);
  });

  it('collects all expected keys', async () => {
    const result = await collector.collect();
    const expectedKeys = [
      'localStorage', 'sessionStorage', 'indexedDB', 'openDatabase',
      'cookieEnabled', 'cookieWritable', 'serviceWorker', 'webWorker',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('returns boolean values for all keys', async () => {
    const result = await collector.collect();
    for (const [key, value] of Object.entries(result)) {
      expect(typeof value, `${key} should be a boolean`).toBe('boolean');
    }
  });

  it('detects localStorage availability', async () => {
    const result = await collector.collect();
    // In the vitest (jsdom/node) environment localStorage may or may not exist;
    // the important thing is the value is a boolean.
    expect(typeof result.localStorage).toBe('boolean');
  });

  it('detects sessionStorage availability', async () => {
    const result = await collector.collect();
    expect(typeof result.sessionStorage).toBe('boolean');
  });

  it('detects indexedDB availability', async () => {
    const result = await collector.collect();
    expect(typeof result.indexedDB).toBe('boolean');
  });

  it('detects openDatabase availability', async () => {
    const result = await collector.collect();
    // openDatabase is Chromium-only; in Node/jsdom it should be false
    expect(result.openDatabase).toBe(false);
  });

  it('detects webWorker availability', async () => {
    const result = await collector.collect();
    expect(typeof result.webWorker).toBe('boolean');
  });

  describe('when storage APIs throw (e.g. private browsing)', () => {
    let originalLocalStorage;
    let originalSessionStorage;

    beforeEach(() => {
      originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
      originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
    });

    afterEach(() => {
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
      }
      if (originalSessionStorage) {
        Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
      }
    });

    it('returns false for localStorage when it throws', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new DOMException('Access denied');
        },
        configurable: true,
      });

      const result = await collector.collect();
      expect(result.localStorage).toBe(false);
    });

    it('returns false for sessionStorage when it throws', async () => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        get() {
          throw new DOMException('Access denied');
        },
        configurable: true,
      });

      const result = await collector.collect();
      expect(result.sessionStorage).toBe(false);
    });
  });

  describe('when navigator properties are missing', () => {
    let originalNavigator;

    beforeEach(() => {
      originalNavigator = globalThis.navigator;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it('returns false for cookieEnabled when navigator is absent', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const result = await collector.collect();
      expect(result.cookieEnabled).toBe(false);
      expect(result.serviceWorker).toBe(false);
    });
  });

  describe('when openDatabase exists', () => {
    let originalOpenDatabase;

    beforeEach(() => {
      originalOpenDatabase = globalThis.openDatabase;
    });

    afterEach(() => {
      if (originalOpenDatabase !== undefined) {
        globalThis.openDatabase = originalOpenDatabase;
      } else {
        delete globalThis.openDatabase;
      }
    });

    it('returns true for openDatabase when the function exists', async () => {
      globalThis.openDatabase = function () {};

      const result = await collector.collect();
      expect(result.openDatabase).toBe(true);
    });
  });
});
