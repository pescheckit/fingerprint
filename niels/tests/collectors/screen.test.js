import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScreenCollector } from '../../src/collectors/screen.js';
import { Collector } from '../../src/collector.js';

describe('ScreenCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new ScreenCollector();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('screen');
    expect(collector.description).toBe('Screen and display properties');
  });

  it('collects all expected keys', async () => {
    const result = await collector.collect();
    const expectedKeys = [
      'width', 'height', 'availWidth', 'availHeight',
      'colorDepth', 'devicePixelRatio', 'maxTouchPoints',
      'touchSupport', 'screenFrame',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('reads screen dimensions correctly', async () => {
    vi.stubGlobal('screen', {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
    });
    vi.stubGlobal('devicePixelRatio', 2);

    const result = await collector.collect();
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.availWidth).toBe(1920);
    expect(result.availHeight).toBe(1040);
    expect(result.colorDepth).toBe(24);
    expect(result.devicePixelRatio).toBe(2);
  });

  it('calculates screenFrame from dimension differences', async () => {
    vi.stubGlobal('screen', {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
    });

    const result = await collector.collect();
    expect(result.screenFrame).toEqual({
      top: 40,
      left: 0,
      right: 0,
      bottom: 40,
    });
  });

  it('detects touch support as false when ontouchstart is absent', async () => {
    // Ensure ontouchstart is not present
    const had = 'ontouchstart' in globalThis;
    if (had) delete globalThis.ontouchstart;

    const result = await collector.collect();
    expect(result.touchSupport).toBe(false);

    // Restore if it was there originally
    if (had) globalThis.ontouchstart = null;
  });

  it('detects touch support as true when ontouchstart is present', async () => {
    vi.stubGlobal('ontouchstart', null);
    const result = await collector.collect();
    expect(result.touchSupport).toBe(true);
  });

  it('reads maxTouchPoints from navigator', async () => {
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
      value: 10,
      configurable: true,
    });

    const result = await collector.collect();
    expect(result.maxTouchPoints).toBe(10);

    // Restore
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });
  });

  it('returns null screenFrame when screen properties are missing', async () => {
    vi.stubGlobal('screen', {});

    const result = await collector.collect();
    expect(result.screenFrame).toBeNull();
  });

  it('returns null for missing individual screen properties', async () => {
    vi.stubGlobal('screen', {});
    // Remove devicePixelRatio from window
    const original = globalThis.devicePixelRatio;
    delete globalThis.devicePixelRatio;

    const result = await collector.collect();
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.availWidth).toBeNull();
    expect(result.availHeight).toBeNull();
    expect(result.colorDepth).toBeNull();
    expect(result.devicePixelRatio).toBeNull();

    // Restore
    if (original !== undefined) {
      globalThis.devicePixelRatio = original;
    }
  });
});
