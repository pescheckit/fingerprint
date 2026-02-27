import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FontMetricsCollector } from '../../../src/collectors/tor/font-metrics.js';
import { Collector } from '../../../src/collector.js';

function createMockContext() {
  return {
    measureText: vi.fn(() => ({
      width: 85.75,
      actualBoundingBoxAscent: 12.5,
      actualBoundingBoxDescent: 3.2,
    })),
    font: '',
  };
}

function createMockCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
  };
}

describe('FontMetricsCollector', () => {
  let collector;
  let originalCreateElement;

  beforeEach(() => {
    collector = new FontMetricsCollector();
    originalCreateElement = document.createElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('fontMetrics');
    expect(collector.description).toBe('Font rendering metrics via measureText');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns supported: true when canvas is available', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(typeof result.metrics).toBe('object');
  });

  it('returns supported: false when no context', async () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const result = await collector.collect();

    expect(result).toEqual({ supported: false });
  });

  it('metrics object has expected structure with width as number', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const result = await collector.collect();
    const metricKeys = Object.keys(result.metrics);

    // 5 fonts * 3 sizes * 4 strings = 60 entries
    expect(metricKeys.length).toBe(60);

    // Each entry should have width as a number
    for (const key of metricKeys) {
      expect(typeof result.metrics[key].width).toBe('number');
    }
  });

  it('includes ascent and descent when available', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const result = await collector.collect();
    const firstKey = Object.keys(result.metrics)[0];

    expect(result.metrics[firstKey]).toHaveProperty('ascent');
    expect(result.metrics[firstKey]).toHaveProperty('descent');
    expect(typeof result.metrics[firstKey].ascent).toBe('number');
    expect(typeof result.metrics[firstKey].descent).toBe('number');
  });

  it('calls measureText for each font/size/string combination', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    await collector.collect();

    // 5 fonts * 3 sizes * 4 strings = 60 calls
    expect(ctx.measureText).toHaveBeenCalledTimes(60);
  });
});
