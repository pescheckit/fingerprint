import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaCollector } from '../../src/collectors/media.js';
import { Collector } from '../../src/collector.js';

// Image detection has a 2s timeout per format in JSDOM (no real image loading)
const COLLECT_TIMEOUT = 15_000;

describe('MediaCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new MediaCollector();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('media');
    expect(collector.description).toBe('Media codec support, speech voices, and image formats');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('collects all top-level keys', async () => {
    const result = await collector.collect();
    expect(result).toHaveProperty('codecs');
    expect(result).toHaveProperty('mimeTypes');
    expect(result).toHaveProperty('speechVoices');
    expect(result).toHaveProperty('imageFormats');
    expect(result).toHaveProperty('mediaDevices');
  }, COLLECT_TIMEOUT);

  it('detects codecs via canPlayType', async () => {
    const result = await collector.collect();
    expect(typeof result.codecs).toBe('object');
    expect(Object.keys(result.codecs).length).toBeGreaterThan(10);
    for (const val of Object.values(result.codecs)) {
      expect(typeof val).toBe('string');
    }
  }, COLLECT_TIMEOUT);

  it('handles missing MediaSource gracefully', async () => {
    const origMS = globalThis.MediaSource;
    delete globalThis.MediaSource;

    const result = await collector.collect();
    expect(result.mimeTypes.supported).toBe(false);

    if (origMS) globalThis.MediaSource = origMS;
  }, COLLECT_TIMEOUT);

  it('handles missing speechSynthesis gracefully', async () => {
    const orig = globalThis.speechSynthesis;
    delete globalThis.speechSynthesis;

    const result = await collector.collect();
    expect(result.speechVoices.supported).toBe(false);

    if (orig) globalThis.speechSynthesis = orig;
  }, COLLECT_TIMEOUT);

  it('detects image formats as booleans', async () => {
    const result = await collector.collect();
    expect(typeof result.imageFormats.webp).toBe('boolean');
    expect(typeof result.imageFormats.avif).toBe('boolean');
    expect(typeof result.imageFormats.jpegxl).toBe('boolean');
  }, COLLECT_TIMEOUT);

  it('handles missing mediaDevices gracefully', async () => {
    const orig = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });

    const result = await collector.collect();
    expect(result.mediaDevices.supported).toBe(false);

    Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true });
  }, COLLECT_TIMEOUT);

  it('returns consistent codec results across calls', async () => {
    const result1 = await collector.collect();
    const result2 = await collector.collect();
    expect(result1.codecs).toEqual(result2.codecs);
  }, COLLECT_TIMEOUT);
});
