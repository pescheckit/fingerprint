import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimezoneCollector } from '../../src/collectors/timezone.js';
import { Collector } from '../../src/collector.js';

describe('TimezoneCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new TimezoneCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('timezone');
    expect(collector.description).toBe('Timezone and locale information');
  });

  it('collects all expected keys', async () => {
    const result = await collector.collect();
    const expectedKeys = ['timezone', 'timezoneOffset', 'locale', 'calendar'];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('returns correct timezone from Intl', async () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({
        timeZone: 'Europe/Amsterdam',
        locale: 'nl-NL',
        calendar: 'gregory',
      }),
    });

    const result = await collector.collect();
    expect(result.timezone).toBe('Europe/Amsterdam');
  });

  it('returns timezoneOffset as a number', async () => {
    const result = await collector.collect();
    expect(typeof result.timezoneOffset).toBe('number');
  });

  it('returns correct locale and calendar', async () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({
        timeZone: 'Asia/Tokyo',
        locale: 'ja-JP',
        calendar: 'japanese',
      }),
    });

    const result = await collector.collect();
    expect(result.locale).toBe('ja-JP');
    expect(result.calendar).toBe('japanese');
  });

  it('returns correct timezoneOffset from Date', async () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);

    const result = await collector.collect();
    expect(result.timezoneOffset).toBe(-60);
  });

  it('returns a plain object (not an instance of a class)', async () => {
    const result = await collector.collect();
    expect(result.constructor).toBe(Object);
  });
});
