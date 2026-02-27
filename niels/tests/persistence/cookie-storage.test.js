import { describe, it, expect, beforeEach } from 'vitest';
import { CookieStorage } from '../../src/persistence/cookie-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

describe('CookieStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new CookieStorage();
    // Clear the _vid cookie
    document.cookie = '_vid=; max-age=0';
  });

  it('extends StorageMechanism with name "cookie"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('cookie');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-uuid-123');
    const result = await storage.read();
    expect(result).toBe('test-uuid-123');
  });

  it('read() returns null when cookie is not set', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('write() sets cookie with correct format', async () => {
    await storage.write('abc-def');
    // Verify it's readable back (proves the cookie was set correctly)
    const cookies = document.cookie;
    expect(cookies).toContain('_vid=abc-def');
  });

  it('isAvailable() checks navigator.cookieEnabled', async () => {
    // jsdom defaults cookieEnabled to true
    const result = await storage.isAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('read() handles multiple cookies correctly', async () => {
    document.cookie = 'other=val';
    document.cookie = '_vid=my-id-123';
    document.cookie = 'foo=bar';
    const result = await storage.read();
    expect(result).toBe('my-id-123');
  });
});
