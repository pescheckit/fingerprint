import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorage } from '../../src/persistence/local-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

describe('LocalStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new LocalStorage();
    localStorage.clear();
  });

  it('extends StorageMechanism with name "localStorage"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('localStorage');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-uuid-456');
    const result = await storage.read();
    expect(result).toBe('test-uuid-456');
  });

  it('read() returns null when no value is stored', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('isAvailable() returns true when localStorage works', async () => {
    expect(await storage.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when localStorage throws', async () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => { throw new Error('SecurityError'); },
      configurable: true,
    });

    const s = new LocalStorage();
    expect(await s.isAvailable()).toBe(false);

    Object.defineProperty(globalThis, 'localStorage', {
      value: original,
      configurable: true,
      writable: true,
    });
  });
});
