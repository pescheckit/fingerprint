import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoginDetectCollector } from '../../../src/collectors/network/login-detect.js';
import { Collector } from '../../../src/collector.js';

describe('LoginDetectCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new LoginDetectCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('loginDetect');
    expect(collector.description).toBe('Login state detection');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns all expected keys from collect()', async () => {
    // Mock _probeService to avoid real network calls
    collector._probeService = vi.fn().mockResolvedValue(null);

    const result = await collector.collect();

    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('loginBitmask');
    expect(result).toHaveProperty('detectedCount');
  });

  it('returns 8-character bitmask', async () => {
    collector._probeService = vi.fn().mockResolvedValue(null);

    const result = await collector.collect();

    expect(result.loginBitmask).toHaveLength(8);
    expect(result.loginBitmask).toMatch(/^[01]{8}$/);
  });

  it('detects all 8 services', async () => {
    collector._probeService = vi.fn().mockResolvedValue(null);

    const result = await collector.collect();

    const serviceNames = Object.keys(result.services);
    expect(serviceNames).toContain('google');
    expect(serviceNames).toContain('facebook');
    expect(serviceNames).toContain('reddit');
    expect(serviceNames).toContain('github');
    expect(serviceNames).toContain('twitter');
    expect(serviceNames).toContain('linkedin');
    expect(serviceNames).toContain('amazon');
    expect(serviceNames).toContain('microsoft');
    expect(serviceNames).toHaveLength(8);
  });

  it('counts detected services correctly', async () => {
    // First 3 probes return true, rest null
    let callCount = 0;
    collector._probeService = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount <= 3 ? true : null);
    });

    const result = await collector.collect();

    expect(result.detectedCount).toBe(3);
    expect(result.loginBitmask).toBe('11100000');
  });

  it('sets bitmask to all 1s when all services detected', async () => {
    collector._probeService = vi.fn().mockResolvedValue(true);

    const result = await collector.collect();

    expect(result.loginBitmask).toBe('11111111');
    expect(result.detectedCount).toBe(8);
  });

  it('sets bitmask to all 0s when no services detected', async () => {
    collector._probeService = vi.fn().mockResolvedValue(null);

    const result = await collector.collect();

    expect(result.loginBitmask).toBe('00000000');
    expect(result.detectedCount).toBe(0);
  });

  it('treats false as 0 in bitmask', async () => {
    collector._probeService = vi.fn().mockResolvedValue(false);

    const result = await collector.collect();

    expect(result.loginBitmask).toBe('00000000');
    expect(result.detectedCount).toBe(0);
  });
});
