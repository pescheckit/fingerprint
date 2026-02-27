import { describe, it, expect, beforeEach } from 'vitest';
import { IntlCollector } from '../../src/collectors/intl.js';
import { Collector } from '../../src/collector.js';

describe('IntlCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new IntlCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('intl');
    expect(collector.description).toBe('Intl API formatting quirks and locale data');
  });

  it('has deviceKeys for cross-browser stable signals', () => {
    expect(collector.deviceKeys).toContain('dateFormat');
    expect(collector.deviceKeys).toContain('numberFormat');
    expect(collector.deviceKeys).toContain('currencyFormat');
    expect(collector.deviceKeys).toContain('collation');
  });

  it('collects all top-level keys', async () => {
    const result = await collector.collect();
    expect(result.supported).toBe(true);
    expect(result).toHaveProperty('dateFormat');
    expect(result).toHaveProperty('numberFormat');
    expect(result).toHaveProperty('currencyFormat');
    expect(result).toHaveProperty('resolvedLocale');
    expect(result).toHaveProperty('listFormat');
    expect(result).toHaveProperty('pluralCategories');
    expect(result).toHaveProperty('relativeTimeFormat');
    expect(result).toHaveProperty('collation');
    expect(result).toHaveProperty('numberingSystems');
    expect(result).toHaveProperty('displayNames');
  });

  it('formats dates consistently', async () => {
    const result = await collector.collect();
    expect(result.dateFormat).not.toBeNull();
    expect(typeof result.dateFormat.default).toBe('string');
    expect(typeof result.dateFormat.full).toBe('string');
    expect(typeof result.dateFormat.parts).toBe('string');
  });

  it('formats numbers with locale differences', async () => {
    const result = await collector.collect();
    // numberFormat may be null in environments with limited Intl support
    if (result.numberFormat !== null) {
      expect(typeof result.numberFormat.default).toBe('string');
      expect(result.numberFormat.grouping).toBeTruthy();
    }
  });

  it('formats currency with symbols', async () => {
    const result = await collector.collect();
    expect(result.currencyFormat).not.toBeNull();
    expect(result.currencyFormat.usd).toContain('$');
    // Yen symbol may be fullwidth (￥) or regular (¥) depending on environment
    expect(result.currencyFormat.jpy).toMatch(/[¥￥]/);
  });

  it('resolves locale options', async () => {
    const result = await collector.collect();
    expect(result.resolvedLocale).not.toBeNull();
    expect(typeof result.resolvedLocale.locale).toBe('string');
    expect(typeof result.resolvedLocale.calendar).toBe('string');
    expect(typeof result.resolvedLocale.timeZone).toBe('string');
  });

  it('probes numbering systems', async () => {
    const result = await collector.collect();
    expect(result.numberingSystems).not.toBeNull();
    // Latin numerals should always work
    expect(result.numberingSystems.latn).toBe('123');
    // Arabic numerals should render differently
    expect(result.numberingSystems.arab).not.toBe('123');
  });

  it('probes collation order', async () => {
    const result = await collector.collect();
    expect(result.collation).not.toBeNull();
    expect(typeof result.collation.aeOrder).toBe('number');
    expect(typeof result.collation.caseOrder).toBe('number');
  });

  it('returns consistent results across calls', async () => {
    const result1 = await collector.collect();
    const result2 = await collector.collect();
    expect(result1.dateFormat).toEqual(result2.dateFormat);
    expect(result1.numberFormat).toEqual(result2.numberFormat);
    expect(result1.collation).toEqual(result2.collation);
  });
});
