import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CSSFeaturesCollector } from '../../../src/collectors/tor/css-features.js';
import { Collector } from '../../../src/collector.js';

describe('CSSFeaturesCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new CSSFeaturesCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('cssFeatures');
    expect(collector.description).toBe('CSS feature support detection');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns all expected feature keys', async () => {
    // Mock CSS.supports to return booleans
    const originalCSS = globalThis.CSS;
    globalThis.CSS = {
      supports: vi.fn(() => true),
    };

    // Mock document for _supportsAtRule
    const mockStyle = {
      textContent: '',
      sheet: { cssRules: [{}] },
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'style') return mockStyle;
      return document.createElement(tag);
    });
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.head, 'removeChild').mockImplementation(() => {});

    const result = await collector.collect();

    const expectedKeys = [
      'webkitAppearance', 'mozAppearance', 'webkitBackdropFilter',
      'containerQueries', 'subgrid', 'hasSelector', 'nesting',
      'colorMix', 'lch', 'oklch', 'layerSupport',
      'aspectRatio', 'contentVisibility', 'scrollTimeline', 'viewTransition',
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
    expect(Object.keys(result)).toHaveLength(expectedKeys.length);

    globalThis.CSS = originalCSS;
  });

  it('returns booleans or null for all features when CSS.supports is available', async () => {
    const originalCSS = globalThis.CSS;
    globalThis.CSS = {
      supports: vi.fn((prop, val) => {
        // Simulate some features supported, some not
        if (prop.includes('webkit')) return true;
        if (prop.startsWith('selector(')) return false;
        return false;
      }),
    };

    const mockStyle = {
      textContent: '',
      sheet: { cssRules: [] },
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'style') return mockStyle;
      return document.createElement(tag);
    });
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.head, 'removeChild').mockImplementation(() => {});

    const result = await collector.collect();

    for (const [key, value] of Object.entries(result)) {
      expect(value === true || value === false || value === null).toBe(true);
    }

    globalThis.CSS = originalCSS;
  });

  it('returns null for all features when CSS.supports is undefined', async () => {
    const originalCSS = globalThis.CSS;
    globalThis.CSS = undefined;

    const result = await collector.collect();

    for (const [key, value] of Object.entries(result)) {
      expect(value).toBeNull();
    }

    globalThis.CSS = originalCSS;
  });
});
