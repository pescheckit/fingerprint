import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Collector } from '../../src/collector.js';
import { CanvasCollector } from '../../src/collectors/canvas.js';

function createMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    measureText: vi.fn(() => ({
      width: 123.456,
      actualBoundingBoxAscent: 14.2,
      actualBoundingBoxDescent: 3.8,
    })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
  };
}

function createMockCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toDataURL: vi.fn(() => 'data:image/png;base64,mockdata'),
  };
}

describe('CanvasCollector', () => {
  let originalCreateElement;

  beforeEach(() => {
    originalCreateElement = document.createElement;
  });

  it('extends Collector', () => {
    const collector = new CanvasCollector();
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('canvas');
    expect(collector.description).toBe('Canvas rendering fingerprint');
  });

  it('returns text metrics and display-only images', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.textMetrics).toBeDefined();
    expect(typeof result.textMetrics).toBe('object');
    // Images are prefixed with _ (display-only, excluded from hash)
    expect(result._geometryImage).toBe('data:image/png;base64,mockdata');
    expect(result._textImage).toBe('data:image/png;base64,mockdata');

    vi.restoreAllMocks();
  });

  it('collects text metrics for multiple fonts', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    const result = await collector.collect();

    // Should measure at least 5 different fonts
    const fontKeys = Object.keys(result.textMetrics);
    expect(fontKeys.length).toBeGreaterThanOrEqual(5);

    // Each font should have width, ascent, descent
    for (const font of fontKeys) {
      expect(result.textMetrics[font]).toHaveProperty('width');
      expect(result.textMetrics[font]).toHaveProperty('ascent');
      expect(result.textMetrics[font]).toHaveProperty('descent');
    }

    expect(ctx.measureText).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('calls canvas drawing methods for geometry and text images', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    await collector.collect();

    expect(ctx.createLinearGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.strokeText).toHaveBeenCalled();
    expect(mockCanvas.toDataURL).toHaveBeenCalledTimes(2);

    vi.restoreAllMocks();
  });

  it('handles missing canvas context gracefully', async () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
      toDataURL: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    const result = await collector.collect();

    expect(result).toEqual({
      supported: false,
      textMetrics: null,
      _geometryImage: null,
      _textImage: null,
    });
    expect(mockCanvas.toDataURL).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
