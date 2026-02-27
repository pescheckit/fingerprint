import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BatteryCollector } from '../../../src/collectors/network/battery.js';
import { Collector } from '../../../src/collector.js';

describe('BatteryCollector', () => {
  let collector;
  const originalGetBattery = navigator.getBattery;

  beforeEach(() => {
    collector = new BatteryCollector();
  });

  afterEach(() => {
    if (originalGetBattery) {
      navigator.getBattery = originalGetBattery;
    } else {
      delete navigator.getBattery;
    }
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('battery');
    expect(collector.description).toBe('Battery state');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns supported: false when getBattery is unavailable', async () => {
    delete navigator.getBattery;

    const result = await collector.collect();

    expect(result.supported).toBe(false);
    expect(result.charging).toBeNull();
    expect(result.level).toBeNull();
    expect(result.chargingTime).toBeNull();
    expect(result.dischargingTime).toBeNull();
  });

  it('returns battery data when supported', async () => {
    navigator.getBattery = vi.fn().mockResolvedValue({
      charging: true,
      level: 0.75,
      chargingTime: 3600,
      dischargingTime: Infinity,
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.charging).toBe(true);
    expect(result.level).toBe(0.75);
    expect(result.chargingTime).toBe(3600);
    expect(result.dischargingTime).toBe(Infinity);
  });

  it('returns supported: false when getBattery throws', async () => {
    navigator.getBattery = vi.fn().mockRejectedValue(new Error('Not allowed'));

    const result = await collector.collect();

    expect(result.supported).toBe(false);
    expect(result.charging).toBeNull();
    expect(result.level).toBeNull();
  });

  it('returns correct values for discharging battery', async () => {
    navigator.getBattery = vi.fn().mockResolvedValue({
      charging: false,
      level: 0.42,
      chargingTime: Infinity,
      dischargingTime: 7200,
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.charging).toBe(false);
    expect(result.level).toBe(0.42);
    expect(result.chargingTime).toBe(Infinity);
    expect(result.dischargingTime).toBe(7200);
  });
});
