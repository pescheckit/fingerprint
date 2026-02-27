import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MouseCollector } from '../../../src/collectors/network/mouse.js';
import { Collector } from '../../../src/collector.js';

describe('MouseCollector', () => {
  let collector;
  let wheelListeners;
  let mousemoveListeners;

  beforeEach(() => {
    wheelListeners = [];
    mousemoveListeners = [];

    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'wheel') wheelListeners.push(handler);
      if (event === 'mousemove') mousemoveListeners.push(handler);
    });

    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});

    // Mock matchMedia
    vi.stubGlobal('matchMedia', vi.fn((query) => {
      if (query === '(pointer: fine)') return { matches: true };
      if (query === '(pointer: coarse)') return { matches: false };
      if (query === '(hover: hover)') return { matches: true };
      return { matches: false };
    }));

    // Mock navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });

    collector = new MouseCollector();
  });

  afterEach(() => {
    collector.destroy();
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('mouse');
    expect(collector.description).toBe('Mouse input characteristics');
  });

  it('has device keys for hardware-stable signals', () => {
    expect(collector.deviceKeys).toEqual(['pointerType', 'wheelDeltaY', 'movementMinStep']);
  });

  it('collect() returns immediate passive data', async () => {
    const result = await collector.collect();

    expect(result.pointerType).toBe('fine');
    expect(result.hoverSupport).toBe(true);
    expect(result.maxTouchPoints).toBe(0);
    expect(result.observing).toBe(true);
  });

  it('collect() detects coarse pointer', async () => {
    matchMedia.mockImplementation((query) => {
      if (query === '(pointer: fine)') return { matches: false };
      if (query === '(pointer: coarse)') return { matches: true };
      if (query === '(hover: hover)') return { matches: false };
      return { matches: false };
    });

    const result = await collector.collect();
    expect(result.pointerType).toBe('coarse');
    expect(result.hoverSupport).toBe(false);
  });

  it('collect() detects no pointer', async () => {
    matchMedia.mockImplementation(() => ({ matches: false }));

    const result = await collector.collect();
    expect(result.pointerType).toBe('none');
  });

  it('collect() starts event listeners', async () => {
    await collector.collect();

    expect(document.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: true });
    expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
  });

  it('observe() resolves with background data after timeout', async () => {
    await collector.collect();

    const result = await collector.observe(100);

    expect(result).toHaveProperty('wheelDeltaY');
    expect(result).toHaveProperty('wheelDeltaMode');
    expect(result).toHaveProperty('smoothScroll');
    expect(result).toHaveProperty('movementMinStep');
    expect(result).toHaveProperty('movementMedianStep');
    expect(result).toHaveProperty('scrollSampleCount');
    expect(result).toHaveProperty('moveSampleCount');
    expect(result.scrollSampleCount).toBe(0);
    expect(result.moveSampleCount).toBe(0);
  });

  it('processes wheel events correctly', async () => {
    await collector.collect();

    // Simulate wheel events
    wheelListeners.forEach(fn => fn({ deltaY: 120, deltaMode: 0 }));
    wheelListeners.forEach(fn => fn({ deltaY: 120, deltaMode: 0 }));
    wheelListeners.forEach(fn => fn({ deltaY: -100, deltaMode: 0 }));

    const result = await collector.observe(100);

    expect(result.wheelDeltaY).toBe(120);
    expect(result.wheelDeltaMode).toBe(0);
    expect(result.smoothScroll).toBe(false);
    expect(result.scrollSampleCount).toBe(3);
  });

  it('detects smooth scroll from fractional deltas', async () => {
    await collector.collect();

    wheelListeners.forEach(fn => fn({ deltaY: 33.5, deltaMode: 0 }));

    const result = await collector.observe(100);
    expect(result.smoothScroll).toBe(true);
  });

  it('processes mousemove events correctly', async () => {
    await collector.collect();

    mousemoveListeners.forEach(fn => fn({ movementX: 3, movementY: 0 }));
    mousemoveListeners.forEach(fn => fn({ movementX: 1, movementY: 2 }));
    mousemoveListeners.forEach(fn => fn({ movementX: 0, movementY: 5 }));

    const result = await collector.observe(100);

    expect(result.movementMinStep).toBe(1);
    expect(result.movementMedianStep).toBe(2.5);
    expect(result.moveSampleCount).toBe(4);
  });

  it('ignores zero-magnitude movements', async () => {
    await collector.collect();

    mousemoveListeners.forEach(fn => fn({ movementX: 0, movementY: 0 }));

    const result = await collector.observe(100);
    expect(result.moveSampleCount).toBe(0);
    expect(result.movementMinStep).toBeNull();
    expect(result.movementMedianStep).toBeNull();
  });

  it('observe() resolves early when enough samples collected', async () => {
    await collector.collect();

    // Simulate 50+ movement events and 5+ wheel events
    for (let i = 0; i < 26; i++) {
      mousemoveListeners.forEach(fn => fn({ movementX: 2, movementY: 3 }));
    }
    for (let i = 0; i < 6; i++) {
      wheelListeners.forEach(fn => fn({ deltaY: 120, deltaMode: 0 }));
    }

    const start = Date.now();
    const result = await collector.observe(10000);
    const elapsed = Date.now() - start;

    expect(result.moveSampleCount).toBeGreaterThanOrEqual(50);
    expect(result.scrollSampleCount).toBeGreaterThanOrEqual(5);
    // Should resolve well before the 10s timeout
    expect(elapsed).toBeLessThan(2000);
  });

  it('destroy() removes event listeners', async () => {
    await collector.collect();
    collector.destroy();

    expect(document.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('returns null values when no events collected', async () => {
    await collector.collect();
    const result = await collector.observe(100);

    expect(result.wheelDeltaY).toBeNull();
    expect(result.wheelDeltaMode).toBeNull();
    expect(result.movementMinStep).toBeNull();
    expect(result.movementMedianStep).toBeNull();
  });
});
