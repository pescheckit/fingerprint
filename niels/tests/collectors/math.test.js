import { describe, it, expect, beforeEach } from 'vitest';
import { MathCollector } from '../../src/collectors/math.js';
import { Collector } from '../../src/collector.js';

describe('MathCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new MathCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('math');
    expect(collector.description).toBe('Math operation fingerprint');
  });

  it('has empty crossBrowserKeys', () => {
    expect(collector.crossBrowserKeys).toEqual([]);
  });

  it('collects all expected keys', async () => {
    const result = await collector.collect();
    const expectedKeys = [
      'tanNeg1e300', 'acos', 'asin', 'atan', 'atan2',
      'sinNeg1e300', 'cosNeg1e300', 'exp', 'log', 'sqrt',
      'powPiNeg100', 'cosh', 'sinh', 'tanh', 'expm1',
      'log1p', 'cbrt',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
    expect(Object.keys(result)).toHaveLength(expectedKeys.length);
  });

  it('returns numbers for all values', async () => {
    const result = await collector.collect();
    for (const [key, value] of Object.entries(result)) {
      expect(typeof value).toBe('number');
    }
  });

  it('returns finite numbers for well-defined operations', async () => {
    const result = await collector.collect();
    const finiteKeys = [
      'acos', 'asin', 'atan', 'atan2', 'exp', 'log',
      'sqrt', 'cosh', 'sinh', 'tanh', 'expm1', 'log1p', 'cbrt',
    ];
    for (const key of finiteKeys) {
      expect(Number.isFinite(result[key])).toBe(true);
    }
  });

  it('returns a plain object (not an instance of a class)', async () => {
    const result = await collector.collect();
    expect(result.constructor).toBe(Object);
  });

  it('returns consistent results across multiple calls', async () => {
    const result1 = await collector.collect();
    const result2 = await collector.collect();
    expect(result1).toEqual(result2);
  });
});
