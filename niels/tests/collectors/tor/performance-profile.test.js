import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceProfileCollector } from '../../../src/collectors/tor/performance-profile.js';
import { Collector } from '../../../src/collector.js';

describe('PerformanceProfileCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new PerformanceProfileCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('performanceProfile');
    expect(collector.description).toBe('Relative performance profiling of operations');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns all 4 ratio keys', async () => {
    const result = await collector.collect();
    const expectedKeys = ['sortRatio', 'mathRatio', 'regexRatio', 'jsonRatio'];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
    expect(Object.keys(result)).toHaveLength(4);
  });

  it('returns numbers >= 0 for all ratios', async () => {
    const result = await collector.collect();
    for (const [key, value] of Object.entries(result)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('has at least one ratio equal to 1.0 (the baseline)', async () => {
    const result = await collector.collect();
    const ratios = Object.values(result);
    expect(ratios).toContain(1);
  });

  it('returns a plain object', async () => {
    const result = await collector.collect();
    expect(result.constructor).toBe(Object);
  });
});
