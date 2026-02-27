import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceWorkerStorage } from '../../src/persistence/service-worker-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

describe('ServiceWorkerStorage', () => {
  let storage;
  let cacheStore;
  let originalCaches;

  beforeEach(() => {
    cacheStore = {};
    const fakeCache = {
      put: async (url, response) => {
        cacheStore[url] = response;
      },
      match: async (url) => {
        return cacheStore[url] || undefined;
      },
    };

    originalCaches = globalThis.caches;
    globalThis.caches = {
      open: async () => fakeCache,
    };

    storage = new ServiceWorkerStorage();
  });

  afterEach(() => {
    if (originalCaches !== undefined) {
      globalThis.caches = originalCaches;
    } else {
      delete globalThis.caches;
    }
  });

  it('extends StorageMechanism with name "serviceWorker"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('serviceWorker');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-sw-uuid');
    const result = await storage.read();
    expect(result).toBe('test-sw-uuid');
  });

  it('read() returns null when no value is stored', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('isAvailable() returns true when caches API exists', async () => {
    expect(await storage.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when caches is undefined', async () => {
    delete globalThis.caches;
    const s = new ServiceWorkerStorage();
    expect(await s.isAvailable()).toBe(false);
  });
});
