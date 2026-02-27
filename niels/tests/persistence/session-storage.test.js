import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStorage } from '../../src/persistence/session-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

describe('SessionStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new SessionStorage();
    sessionStorage.clear();
  });

  it('extends StorageMechanism with name "sessionStorage"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('sessionStorage');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-uuid-789');
    const result = await storage.read();
    expect(result).toBe('test-uuid-789');
  });

  it('read() returns null when no value is stored', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('isAvailable() returns true when sessionStorage works', async () => {
    expect(await storage.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when sessionStorage throws', async () => {
    const original = globalThis.sessionStorage;
    Object.defineProperty(globalThis, 'sessionStorage', {
      get: () => { throw new Error('SecurityError'); },
      configurable: true,
    });

    const s = new SessionStorage();
    expect(await s.isAvailable()).toBe(false);

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: original,
      configurable: true,
      writable: true,
    });
  });
});
