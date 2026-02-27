import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanTopologyCollector } from '../../../src/collectors/network/lan-topology.js';
import { Collector } from '../../../src/collector.js';

describe('LanTopologyCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new LanTopologyCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('lanTopology');
    expect(collector.description).toBe('LAN device topology fingerprint');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns all expected keys from collect()', async () => {
    // Mock _probeTarget to avoid real network calls
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'timeout', timing: 1500 });

    const result = await collector.collect();

    expect(result).toHaveProperty('probes');
    expect(result).toHaveProperty('topologyBitmask');
    expect(result).toHaveProperty('responsiveCount');
  });

  it('returns 20 probes', async () => {
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'timeout', timing: 1500 });

    const result = await collector.collect();

    expect(result.probes).toHaveLength(20);
  });

  it('returns 20-character bitmask', async () => {
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'timeout', timing: 1500 });

    const result = await collector.collect();

    expect(result.topologyBitmask).toHaveLength(20);
    expect(result.topologyBitmask).toMatch(/^[01]{20}$/);
  });

  it('counts responsive devices correctly', async () => {
    let callCount = 0;
    collector._probeTarget = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 3) {
        return Promise.resolve({ status: 'responsive', timing: 50 });
      }
      return Promise.resolve({ status: 'timeout', timing: 1500 });
    });

    const result = await collector.collect();

    expect(result.responsiveCount).toBe(3);
    expect(result.topologyBitmask.slice(0, 3)).toBe('111');
    expect(result.topologyBitmask.slice(3)).toBe('0'.repeat(17));
  });

  it('includes target address in probe results', async () => {
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'timeout', timing: 1500 });

    const result = await collector.collect();

    expect(result.probes[0].target).toMatch(/^\d+\.\d+\.\d+\.\d+:\d+$/);
  });

  it('includes status and timing in probe results', async () => {
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'responsive', timing: 42 });

    const result = await collector.collect();

    expect(result.probes[0].status).toBe('responsive');
    expect(result.probes[0].timing).toBe(42);
  });

  it('marks slow responses as 0 in bitmask', async () => {
    collector._probeTarget = vi.fn().mockResolvedValue({ status: 'slow', timing: 800 });

    const result = await collector.collect();

    expect(result.topologyBitmask).toBe('0'.repeat(20));
    expect(result.responsiveCount).toBe(0);
  });
});
