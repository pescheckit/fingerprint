import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebGLCollector } from '../../src/collectors/webgl.js';
import { Collector } from '../../src/collector.js';

function createMockGLContext() {
  const debugExt = {
    UNMASKED_VENDOR_WEBGL: 0x9245,
    UNMASKED_RENDERER_WEBGL: 0x9246,
  };

  const paramMap = {
    [0x9245]: 'NVIDIA Corporation',
    [0x9246]: 'NVIDIA GeForce GTX 1080/PCIe/SSE2',
    [0x0D33]: 16384,               // MAX_TEXTURE_SIZE
    [0x0D3A]: new Int32Array([32768, 32768]), // MAX_VIEWPORT_DIMS
    [0x84E8]: 16384,               // MAX_RENDERBUFFER_SIZE
  };

  return {
    MAX_TEXTURE_SIZE: 0x0D33,
    MAX_VIEWPORT_DIMS: 0x0D3A,
    MAX_RENDERBUFFER_SIZE: 0x84E8,
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    LOW_FLOAT: 0x8DF0,
    MEDIUM_FLOAT: 0x8DF1,
    HIGH_FLOAT: 0x8DF2,
    LOW_INT: 0x8DF3,
    MEDIUM_INT: 0x8DF4,
    HIGH_INT: 0x8DF5,
    getParameter: vi.fn((param) => paramMap[param] ?? null),
    getExtension: vi.fn((name) => {
      if (name === 'WEBGL_debug_renderer_info') return debugExt;
      return null;
    }),
    getSupportedExtensions: vi.fn(() => [
      'WEBGL_debug_renderer_info',
      'OES_texture_float',
      'EXT_color_buffer_float',
    ]),
    getShaderPrecisionFormat: vi.fn(() => ({
      rangeMin: 127,
      rangeMax: 127,
      precision: 23,
    })),
  };
}

describe('WebGLCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new WebGLCollector();
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('webgl');
    expect(collector.description).toBe('WebGL renderer and capabilities');
  });

  it('collects full WebGL data when context is available', async () => {
    const mockGl = createMockGLContext();
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => mockGl),
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.vendor).toBe('NVIDIA Corporation');
    expect(result.renderer).toBe('NVIDIA GeForce GTX 1080/PCIe/SSE2');
    expect(result.maxTextureSize).toBe(16384);
    expect(result.maxViewportDims).toEqual(new Int32Array([32768, 32768]));
    expect(result.maxRenderbufferSize).toBe(16384);
    expect(result.extensions).toEqual([
      'WEBGL_debug_renderer_info',
      'OES_texture_float',
      'EXT_color_buffer_float',
    ]);
    expect(result.vertexShaderPrecision).toBeDefined();
    expect(result.fragmentShaderPrecision).toBeDefined();
    expect(result.vertexShaderPrecision.HIGH_FLOAT).toEqual({
      rangeMin: 127,
      rangeMax: 127,
      precision: 23,
    });
  });

  it('returns supported:false when WebGL is not available', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => null),
    });

    const result = await collector.collect();

    expect(result).toEqual({ supported: false });
  });

  it('handles missing debug_renderer_info extension', async () => {
    const mockGl = createMockGLContext();
    mockGl.getExtension = vi.fn(() => null);

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => mockGl),
    });

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.vendor).toBeNull();
    expect(result.renderer).toBeNull();
    expect(result.maxTextureSize).toBe(16384);
  });

  it('collects shader precision for all precision types', async () => {
    const mockGl = createMockGLContext();
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => mockGl),
    });

    const result = await collector.collect();

    const expectedPrecisions = ['LOW_FLOAT', 'MEDIUM_FLOAT', 'HIGH_FLOAT', 'LOW_INT', 'MEDIUM_INT', 'HIGH_INT'];
    for (const p of expectedPrecisions) {
      expect(result.vertexShaderPrecision[p]).toBeDefined();
      expect(result.fragmentShaderPrecision[p]).toBeDefined();
    }
  });

  it('handles getSupportedExtensions returning null', async () => {
    const mockGl = createMockGLContext();
    mockGl.getSupportedExtensions = vi.fn(() => null);

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => mockGl),
    });

    const result = await collector.collect();

    expect(result.extensions).toEqual([]);
  });
});
