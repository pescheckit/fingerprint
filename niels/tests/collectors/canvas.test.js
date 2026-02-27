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

  it('returns expected data structure with canvas support', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    const result = await collector.collect();

    expect(result).toEqual({
      supported: true,
      geometry: 'data:image/png;base64,mockdata',
      text: 'data:image/png;base64,mockdata',
    });

    vi.restoreAllMocks();
  });

  it('calls canvas drawing methods for geometry', async () => {
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
    expect(mockCanvas.toDataURL).toHaveBeenCalledTimes(2);

    vi.restoreAllMocks();
  });

  it('calls canvas drawing methods for text', async () => {
    const ctx = createMockContext();
    const mockCanvas = createMockCanvas(ctx);

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return originalCreateElement.call(document, tag);
    });

    const collector = new CanvasCollector();
    await collector.collect();

    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.strokeText).toHaveBeenCalled();

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
      geometry: null,
      text: null,
    });
    expect(mockCanvas.toDataURL).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
