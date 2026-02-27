import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebGPUCollector } from '../../src/collectors/webgpu.js';
import { Collector } from '../../src/collector.js';

describe('WebGPUCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new WebGPUCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('webgpu');
    expect(collector.description).toBe('WebGPU adapter info, features, and limits');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns supported: false when navigator.gpu is unavailable', async () => {
    const result = await collector.collect();
    // JSDOM doesn't have navigator.gpu
    expect(result.supported).toBe(false);
  });

  it('collects adapter info when WebGPU is available', async () => {
    const mockAdapter = {
      info: { vendor: 'nvidia', architecture: 'turing', device: 'RTX 2080', description: 'NVIDIA RTX 2080' },
      features: new Set(['texture-compression-bc', 'depth-clip-control']),
      limits: {
        maxTextureDimension1D: 8192,
        maxTextureDimension2D: 8192,
        maxTextureDimension3D: 2048,
        maxBindGroups: 4,
        maxComputeWorkgroupSizeX: 256,
      },
      isFallbackAdapter: false,
    };

    navigator.gpu = {
      requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
    };

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.vendor).toBe('nvidia');
    expect(result.architecture).toBe('turing');
    expect(result.device).toBe('RTX 2080');
    expect(result.features).toContain('texture-compression-bc');
    expect(result.features).toContain('depth-clip-control');
    expect(result.limits.maxTextureDimension1D).toBe(8192);
    expect(result.preferredFormat).toBe('bgra8unorm');
    expect(result.isFallbackAdapter).toBe(false);

    delete navigator.gpu;
  });

  it('returns supported: false and adapterNull: true when adapter is null', async () => {
    navigator.gpu = {
      requestAdapter: vi.fn().mockResolvedValue(null),
    };

    const result = await collector.collect();
    expect(result.supported).toBe(false);
    expect(result.adapterNull).toBe(true);

    delete navigator.gpu;
  });

  it('sorts features alphabetically', async () => {
    const mockAdapter = {
      info: {},
      features: new Set(['z-feature', 'a-feature', 'm-feature']),
      limits: {},
      isFallbackAdapter: false,
    };

    navigator.gpu = {
      requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      getPreferredCanvasFormat: vi.fn().mockReturnValue('rgba8unorm'),
    };

    const result = await collector.collect();
    expect(result.features).toEqual(['a-feature', 'm-feature', 'z-feature']);

    delete navigator.gpu;
  });
});
