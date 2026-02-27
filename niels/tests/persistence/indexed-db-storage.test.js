import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexedDBStorage } from '../../src/persistence/indexed-db-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

// Minimal fake IndexedDB implementation for testing
function createFakeIDB() {
  const stores = {};

  function fakeOpen(name, version) {
    const request = {
      result: null,
      error: null,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    };

    setTimeout(() => {
      const db = {
        objectStoreNames: {
          contains: (storeName) => !!stores[storeName],
        },
        createObjectStore: (storeName) => {
          stores[storeName] = {};
        },
        transaction: (storeName, mode) => {
          const tx = {
            objectStore: (sName) => ({
              get: (key) => {
                const getReq = { result: null, onsuccess: null, onerror: null };
                setTimeout(() => {
                  getReq.result = stores[sName]?.[key] ?? undefined;
                  if (getReq.onsuccess) getReq.onsuccess();
                }, 0);
                return getReq;
              },
              put: (value, key) => {
                const putReq = { onsuccess: null, onerror: null };
                setTimeout(() => {
                  if (!stores[sName]) stores[sName] = {};
                  stores[sName][key] = value;
                  if (putReq.onsuccess) putReq.onsuccess();
                }, 0);
                return putReq;
              },
            }),
          };
          return tx;
        },
      };
      request.result = db;

      if (request.onupgradeneeded) {
        request.onupgradeneeded();
      }
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);

    return request;
  }

  return { open: fakeOpen, _stores: stores };
}

describe('IndexedDBStorage', () => {
  let storage;
  let fakeIDB;

  beforeEach(() => {
    fakeIDB = createFakeIDB();
    globalThis.indexedDB = fakeIDB;
    storage = new IndexedDBStorage();
  });

  it('extends StorageMechanism with name "indexedDB"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('indexedDB');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-idb-uuid');
    const result = await storage.read();
    expect(result).toBe('test-idb-uuid');
  });

  it('read() returns null when no value is stored', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('isAvailable() returns true when indexedDB exists', async () => {
    expect(await storage.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when indexedDB is undefined', async () => {
    const original = globalThis.indexedDB;
    delete globalThis.indexedDB;
    const s = new IndexedDBStorage();
    expect(await s.isAvailable()).toBe(false);
    globalThis.indexedDB = original;
  });
});
