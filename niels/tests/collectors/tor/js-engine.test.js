import { describe, it, expect, beforeEach } from 'vitest';
import { JSEngineCollector } from '../../../src/collectors/tor/js-engine.js';
import { Collector } from '../../../src/collector.js';

describe('JSEngineCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new JSEngineCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('jsEngine');
    expect(collector.description).toBe('JavaScript engine detection via quirks');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('collects all expected keys', async () => {
    const result = await collector.collect();
    const expectedKeys = [
      'toFixedQuirk', 'parseFloatEdge', 'numberToString',
      'errorStackFormat', 'keyEnumeration',
      'regexDotAll', 'regexLookbehind', 'regexNamedGroups', 'regexUnicodeProperty',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
    expect(Object.keys(result)).toHaveLength(expectedKeys.length);
  });

  it('returns errorStackFormat as one of the known formats', async () => {
    const result = await collector.collect();
    expect(['v8', 'spidermonkey', 'other', 'none']).toContain(result.errorStackFormat);
  });

  it('returns keyEnumeration as a comma-separated string', async () => {
    const result = await collector.collect();
    expect(typeof result.keyEnumeration).toBe('string');
    expect(result.keyEnumeration).toContain(',');
  });

  it('returns booleans for regex features', async () => {
    const result = await collector.collect();
    expect(typeof result.regexDotAll).toBe('boolean');
    expect(typeof result.regexLookbehind).toBe('boolean');
    expect(typeof result.regexNamedGroups).toBe('boolean');
    expect(typeof result.regexUnicodeProperty).toBe('boolean');
  });

  it('returns toFixedQuirk as a string', async () => {
    const result = await collector.collect();
    expect(typeof result.toFixedQuirk).toBe('string');
  });

  it('returns parseFloatEdge as a string', async () => {
    const result = await collector.collect();
    expect(typeof result.parseFloatEdge).toBe('string');
  });

  it('returns numberToString as a string', async () => {
    const result = await collector.collect();
    expect(typeof result.numberToString).toBe('string');
  });

  it('returns consistent results across multiple calls', async () => {
    const result1 = await collector.collect();
    const result2 = await collector.collect();
    expect(result1).toEqual(result2);
  });
});
