import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DnsProbeCollector } from '../../../src/collectors/network/dns-probe.js';
import { Collector } from '../../../src/collector.js';

describe('DnsProbeCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new DnsProbeCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('dns-probe');
    expect(collector.description).toBe('DNS cache timing probe');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns empty probes when no probes are set', async () => {
    const result = await collector.collect();
    expect(result).toEqual({ supported: true, probes: [] });
  });

  it('accepts probes via setProbes', () => {
    collector.setProbes(['example.com', 'test.com']);
    expect(collector._probes).toEqual(['example.com', 'test.com']);
  });

  it('handles null in setProbes gracefully', () => {
    collector.setProbes(null);
    expect(collector._probes).toEqual([]);
  });

  it('probes hostnames and measures timing', async () => {
    collector.setProbes(['fast.example.com', 'slow.example.com']);

    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fast response
        return Promise.resolve(new Response('', { status: 200 }));
      }
      // slow response
      return new Promise(resolve => setTimeout(() => resolve(new Response('', { status: 200 })), 50));
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.probes).toHaveLength(2);
    expect(result.probes[0].hostname).toBe('fast.example.com');
    expect(typeof result.probes[0].responseTime).toBe('number');
    expect(typeof result.probes[0].cached).toBe('boolean');
    expect(result.probes[1].hostname).toBe('slow.example.com');
  });

  it('handles fetch errors gracefully', async () => {
    collector.setProbes(['fail.example.com']);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.probes).toHaveLength(1);
    expect(result.probes[0].hostname).toBe('fail.example.com');
    expect(result.probes[0].responseTime).toBe(-1);
    expect(result.probes[0].cached).toBe(false);
  });

  it('fetches with correct options', async () => {
    collector.setProbes(['check.example.com']);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(''));

    await collector.collect();

    expect(fetchSpy).toHaveBeenCalledWith('https://check.example.com/pixel.gif', {
      mode: 'no-cors',
      cache: 'no-store',
    });
  });
});
