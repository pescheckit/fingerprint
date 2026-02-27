import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisitorIdManager } from '../../src/persistence/visitor-id-manager.js';

// Helper to create a mock storage mechanism
function createMockMechanism(name, { available = true, value = null, failRead = false, failWrite = false } = {}) {
  return {
    name,
    isAvailable: vi.fn().mockResolvedValue(available),
    read: vi.fn().mockImplementation(() => {
      if (failRead) return Promise.reject(new Error('read failed'));
      return Promise.resolve(value);
    }),
    write: vi.fn().mockImplementation(() => {
      if (failWrite) return Promise.reject(new Error('write failed'));
      return Promise.resolve();
    }),
  };
}

describe('VisitorIdManager', () => {
  let manager;

  beforeEach(() => {
    manager = new VisitorIdManager();
  });

  it('generates a new UUID when no existing IDs are found', async () => {
    const mock1 = createMockMechanism('cookie');
    const mock2 = createMockMechanism('localStorage');
    manager.mechanisms = [mock1, mock2];

    const result = await manager.resolve();
    expect(result.visitorId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(result.isNew).toBe(true);
    expect(result.sources).toEqual([]);
  });

  it('writes new ID to all available mechanisms', async () => {
    const mock1 = createMockMechanism('cookie');
    const mock2 = createMockMechanism('localStorage');
    manager.mechanisms = [mock1, mock2];

    const result = await manager.resolve();
    // Allow fire-and-forget writes to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(mock1.write).toHaveBeenCalledWith(result.visitorId);
    expect(mock2.write).toHaveBeenCalledWith(result.visitorId);
  });

  it('returns existing ID when found in one mechanism', async () => {
    const existingId = '11111111-1111-4111-a111-111111111111';
    const mock1 = createMockMechanism('cookie', { value: existingId });
    const mock2 = createMockMechanism('localStorage');
    manager.mechanisms = [mock1, mock2];

    const result = await manager.resolve();
    expect(result.visitorId).toBe(existingId);
    expect(result.isNew).toBe(false);
    expect(result.sources).toContain('cookie');
  });

  it('uses majority vote when different IDs exist', async () => {
    const winningId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const losingId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
    const mock1 = createMockMechanism('cookie', { value: winningId });
    const mock2 = createMockMechanism('localStorage', { value: winningId });
    const mock3 = createMockMechanism('sessionStorage', { value: losingId });
    manager.mechanisms = [mock1, mock2, mock3];

    const result = await manager.resolve();
    expect(result.visitorId).toBe(winningId);
    expect(result.isNew).toBe(false);
    expect(result.sources).toEqual(['cookie', 'localStorage']);
    expect(result.sources).not.toContain('sessionStorage');
  });

  it('respawns winning ID to all available mechanisms', async () => {
    const winningId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const losingId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
    const mock1 = createMockMechanism('cookie', { value: winningId });
    const mock2 = createMockMechanism('localStorage', { value: losingId });
    manager.mechanisms = [mock1, mock2];

    await manager.resolve();
    await new Promise((r) => setTimeout(r, 10));

    expect(mock1.write).toHaveBeenCalledWith(winningId);
    expect(mock2.write).toHaveBeenCalledWith(winningId);
  });

  it('handles mechanism failures gracefully', async () => {
    const existingId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
    const mock1 = createMockMechanism('cookie', { value: existingId });
    const mock2 = createMockMechanism('localStorage', { failRead: true });
    const mock3 = createMockMechanism('sessionStorage', { available: false });
    manager.mechanisms = [mock1, mock2, mock3];

    const result = await manager.resolve();
    expect(result.visitorId).toBe(existingId);
    expect(result.isNew).toBe(false);
    // sessionStorage should be excluded (not available)
    expect(mock3.read).not.toHaveBeenCalled();
  });

  it('returns correct sources array', async () => {
    const id = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
    const mock1 = createMockMechanism('cookie', { value: id });
    const mock2 = createMockMechanism('localStorage', { value: id });
    const mock3 = createMockMechanism('sessionStorage');
    manager.mechanisms = [mock1, mock2, mock3];

    const result = await manager.resolve();
    expect(result.sources).toEqual(['cookie', 'localStorage']);
  });

  it('skips unavailable mechanisms', async () => {
    const mock1 = createMockMechanism('cookie', { available: false });
    const mock2 = createMockMechanism('localStorage');
    manager.mechanisms = [mock1, mock2];

    const result = await manager.resolve();
    expect(mock1.read).not.toHaveBeenCalled();
    expect(mock1.write).not.toHaveBeenCalled();
    expect(result.isNew).toBe(true);
  });

  it('handles write failures without crashing', async () => {
    const mock1 = createMockMechanism('cookie', { failWrite: true });
    const mock2 = createMockMechanism('localStorage');
    manager.mechanisms = [mock1, mock2];

    // Should not throw
    const result = await manager.resolve();
    await new Promise((r) => setTimeout(r, 10));
    expect(result.visitorId).toBeDefined();
  });
});
