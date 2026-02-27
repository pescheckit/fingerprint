import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WindowNameStorage } from '../../src/persistence/window-name-storage.js';
import { StorageMechanism } from '../../src/persistence/storage-mechanism.js';

describe('WindowNameStorage', () => {
  let storage;
  let originalName;

  beforeEach(() => {
    originalName = window.name;
    window.name = '';
    storage = new WindowNameStorage();
  });

  afterEach(() => {
    window.name = originalName;
  });

  it('extends StorageMechanism with name "windowName"', () => {
    expect(storage).toBeInstanceOf(StorageMechanism);
    expect(storage.name).toBe('windowName');
  });

  it('write() and read() cycle works correctly', async () => {
    await storage.write('test-wn-uuid');
    const result = await storage.read();
    expect(result).toBe('test-wn-uuid');
  });

  it('read() returns null when window.name is empty', async () => {
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('read() returns null when window.name is not valid JSON', async () => {
    window.name = 'not-json';
    const result = await storage.read();
    expect(result).toBeNull();
  });

  it('preserves existing window.name data', async () => {
    window.name = JSON.stringify({ existingKey: 'existingValue' });
    await storage.write('test-uuid');
    const parsed = JSON.parse(window.name);
    expect(parsed.existingKey).toBe('existingValue');
    expect(parsed._vid).toBe('test-uuid');
  });

  it('isAvailable() returns true when window.name is accessible', async () => {
    expect(await storage.isAvailable()).toBe(true);
  });
});
