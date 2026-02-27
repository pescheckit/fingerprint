import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateUUID } from '../src/uuid.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUUID', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a valid UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('uses crypto.randomUUID when available', () => {
    const mockUUID = '12345678-1234-4123-a123-123456789abc';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
    const uuid = generateUUID();
    expect(uuid).toBe(mockUUID);
    expect(crypto.randomUUID).toHaveBeenCalled();
  });

  it('falls back to manual generation when crypto.randomUUID is unavailable', () => {
    const original = crypto.randomUUID;
    try {
      crypto.randomUUID = undefined;
      const uuid = generateUUID();
      expect(uuid).toMatch(UUID_V4_REGEX);
    } finally {
      crypto.randomUUID = original;
    }
  });

  it('generates unique UUIDs (100 iterations)', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});
