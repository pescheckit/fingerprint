import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Collector } from '../../src/collector.js';
import { AudioCollector } from '../../src/collectors/audio.js';

function createMockChannelData() {
  const data = new Float32Array(44100);
  for (let i = 0; i < 44100; i++) {
    data[i] = Math.sin(i * 0.1) * 0.5;
  }
  return data;
}

function createMockOfflineAudioContext() {
  const channelData = createMockChannelData();
  const destination = { maxChannelCount: 2, channelCount: 1 };

  const compressorNode = {
    threshold: { setValueAtTime: vi.fn() },
    knee: { setValueAtTime: vi.fn() },
    ratio: { setValueAtTime: vi.fn() },
    attack: { setValueAtTime: vi.fn() },
    release: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
  };

  const oscillatorNode = {
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
  };

  const renderedBuffer = {
    getChannelData: vi.fn(() => channelData),
  };

  const context = {
    currentTime: 0,
    destination,
    sampleRate: 44100,
    createOscillator: vi.fn(() => oscillatorNode),
    createDynamicsCompressor: vi.fn(() => compressorNode),
    startRendering: vi.fn(() => Promise.resolve(renderedBuffer)),
  };

  return { context, oscillatorNode, compressorNode, destination, renderedBuffer };
}

describe('AudioCollector', () => {
  let originalOfflineAudioContext;
  let originalWebkitOfflineAudioContext;
  let originalAudioContext;
  let originalWebkitAudioContext;

  beforeEach(() => {
    originalOfflineAudioContext = globalThis.OfflineAudioContext;
    originalWebkitOfflineAudioContext = globalThis.webkitOfflineAudioContext;
    originalAudioContext = globalThis.AudioContext;
    originalWebkitAudioContext = globalThis.webkitAudioContext;
  });

  afterEach(() => {
    globalThis.OfflineAudioContext = originalOfflineAudioContext;
    globalThis.webkitOfflineAudioContext = originalWebkitOfflineAudioContext;
    globalThis.AudioContext = originalAudioContext;
    globalThis.webkitAudioContext = originalWebkitAudioContext;
  });

  it('extends Collector', () => {
    const collector = new AudioCollector();
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('audio');
    expect(collector.description).toBe('Audio processing fingerprint');
    expect(collector.crossBrowserKeys).toEqual([]);
  });

  it('returns expected data structure when audio is supported', async () => {
    const { context } = createMockOfflineAudioContext();
    globalThis.OfflineAudioContext = vi.fn(() => context);
    globalThis.AudioContext = vi.fn(() => ({
      sampleRate: 44100,
      destination: { maxChannelCount: 2, channelCount: 1 },
      close: vi.fn(),
    }));

    const collector = new AudioCollector();
    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(typeof result.sampleSum).toBe('number');
    expect(result.sampleSum).toBeGreaterThan(0);
    expect(result.sampleRate).toBe(44100);
    expect(result.maxChannelCount).toBe(2);
    expect(result.channelCount).toBe(1);
  });

  it('returns supported: false when OfflineAudioContext is not available', async () => {
    globalThis.OfflineAudioContext = undefined;
    globalThis.webkitOfflineAudioContext = undefined;

    const collector = new AudioCollector();
    const result = await collector.collect();

    expect(result).toEqual({
      supported: false,
      sampleSum: null,
      sampleRate: null,
      maxChannelCount: null,
      channelCount: null,
    });
  });

  it('connects oscillator -> compressor -> destination', async () => {
    const { context, oscillatorNode, compressorNode } = createMockOfflineAudioContext();
    globalThis.OfflineAudioContext = vi.fn(() => context);
    globalThis.AudioContext = vi.fn(() => ({
      sampleRate: 44100,
      destination: { maxChannelCount: 2, channelCount: 1 },
      close: vi.fn(),
    }));

    const collector = new AudioCollector();
    await collector.collect();

    expect(context.createOscillator).toHaveBeenCalled();
    expect(context.createDynamicsCompressor).toHaveBeenCalled();
    expect(oscillatorNode.connect).toHaveBeenCalledWith(compressorNode);
    expect(compressorNode.connect).toHaveBeenCalledWith(context.destination);
    expect(oscillatorNode.start).toHaveBeenCalledWith(0);
  });

  it('configures oscillator with triangle wave at 10000Hz', async () => {
    const { context, oscillatorNode } = createMockOfflineAudioContext();
    globalThis.OfflineAudioContext = vi.fn(() => context);
    globalThis.AudioContext = vi.fn(() => ({
      sampleRate: 44100,
      destination: { maxChannelCount: 2, channelCount: 1 },
      close: vi.fn(),
    }));

    const collector = new AudioCollector();
    await collector.collect();

    expect(oscillatorNode.type).toBe('triangle');
    expect(oscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(10000, 0);
  });

  it('falls back to webkitOfflineAudioContext', async () => {
    const { context } = createMockOfflineAudioContext();
    globalThis.OfflineAudioContext = undefined;
    globalThis.webkitOfflineAudioContext = vi.fn(() => context);
    globalThis.AudioContext = vi.fn(() => ({
      sampleRate: 48000,
      destination: { maxChannelCount: 6, channelCount: 2 },
      close: vi.fn(),
    }));

    const collector = new AudioCollector();
    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(typeof result.sampleSum).toBe('number');
  });

  it('handles rendering errors gracefully', async () => {
    const errorContext = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => { throw new Error('Not supported'); }),
      createDynamicsCompressor: vi.fn(),
    };
    globalThis.OfflineAudioContext = vi.fn(() => errorContext);

    const collector = new AudioCollector();
    const result = await collector.collect();

    expect(result).toEqual({
      supported: false,
      sampleSum: null,
      sampleRate: null,
      maxChannelCount: null,
      channelCount: null,
    });
  });

  it('sums sample values from the correct range (4500-5000)', async () => {
    const data = new Float32Array(44100);
    // Set known values only in the 4500-5000 range
    for (let i = 4500; i < 5000; i++) {
      data[i] = 0.01;
    }
    const renderedBuffer = { getChannelData: vi.fn(() => data) };

    const context = {
      currentTime: 0,
      destination: { maxChannelCount: 2, channelCount: 1 },
      createOscillator: vi.fn(() => ({
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
      })),
      createDynamicsCompressor: vi.fn(() => ({
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      startRendering: vi.fn(() => Promise.resolve(renderedBuffer)),
    };

    globalThis.OfflineAudioContext = vi.fn(() => context);
    globalThis.AudioContext = vi.fn(() => ({
      sampleRate: 44100,
      destination: { maxChannelCount: 2, channelCount: 1 },
      close: vi.fn(),
    }));

    const collector = new AudioCollector();
    const result = await collector.collect();

    // 500 samples * 0.01 = 5.0
    expect(result.sampleSum).toBeCloseTo(5.0, 5);
  });
});
