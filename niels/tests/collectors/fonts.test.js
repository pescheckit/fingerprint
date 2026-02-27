import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FontCollector } from '../../src/collectors/fonts.js';
import { Collector } from '../../src/collector.js';

describe('FontCollector', () => {
  let collector;
  let mockSpan;
  let currentFontFamily;

  // Default base dimensions (used when font-family is a bare base font)
  const BASE_WIDTHS = { monospace: 100, 'sans-serif': 120, serif: 110 };
  const BASE_HEIGHT = 30;

  // Fonts that our mock considers "installed"
  const INSTALLED_FONTS = ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Roboto'];

  beforeEach(() => {
    currentFontFamily = '';

    mockSpan = {
      style: {},
      textContent: '',
      get offsetWidth() {
        return getWidthForFont(currentFontFamily);
      },
      get offsetHeight() {
        return getHeightForFont(currentFontFamily);
      },
    };

    // Intercept fontFamily assignments so we can track what's being measured
    Object.defineProperty(mockSpan.style, 'fontFamily', {
      get: () => currentFontFamily,
      set: (val) => { currentFontFamily = val; },
      configurable: true,
    });

    vi.spyOn(document, 'createElement').mockReturnValue(mockSpan);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    collector = new FontCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getWidthForFont(fontFamily) {
    // Bare base font
    for (const base of Object.keys(BASE_WIDTHS)) {
      if (fontFamily === base) return BASE_WIDTHS[base];
    }
    // Candidate + base font: e.g. "'Arial', sans-serif"
    for (const font of INSTALLED_FONTS) {
      if (fontFamily.includes(`'${font}'`)) {
        return 200; // Different from any base width
      }
    }
    // Unknown font falls back to base width
    for (const base of Object.keys(BASE_WIDTHS)) {
      if (fontFamily.includes(base)) return BASE_WIDTHS[base];
    }
    return 100;
  }

  function getHeightForFont() {
    return BASE_HEIGHT;
  }

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('fonts');
    expect(collector.description).toBe('Installed font detection');
  });

  it('has empty crossBrowserKeys (font detection is engine-specific)', () => {
    expect(collector.crossBrowserKeys).toEqual([]);
  });

  it('measures base font dimensions before testing candidates', async () => {
    const fontFamilies = [];
    Object.defineProperty(mockSpan.style, 'fontFamily', {
      get: () => currentFontFamily,
      set: (val) => {
        fontFamilies.push(val);
        currentFontFamily = val;
      },
      configurable: true,
    });

    await collector.collect();

    // The first three font-family assignments should be the base fonts
    expect(fontFamilies[0]).toBe('monospace');
    expect(fontFamilies[1]).toBe('sans-serif');
    expect(fontFamilies[2]).toBe('serif');
  });

  it('detects fonts when dimensions differ from base font', async () => {
    const result = await collector.collect();

    for (const font of INSTALLED_FONTS) {
      expect(result.detectedFonts).toContain(font);
    }
  });

  it('does not include fonts whose dimensions match the base font', async () => {
    const result = await collector.collect();

    // Pick a font that is NOT in our installed list
    expect(result.detectedFonts).not.toContain('Comic Sans MS');
    expect(result.detectedFonts).not.toContain('Futura');
  });

  it('returns the correct data structure', async () => {
    const result = await collector.collect();

    expect(result).toHaveProperty('detectedFonts');
    expect(result).toHaveProperty('totalTested');
    expect(result).toHaveProperty('detectionMethod');

    expect(Array.isArray(result.detectedFonts)).toBe(true);
    expect(typeof result.totalTested).toBe('number');
    expect(result.detectionMethod).toBe('dimension');
  });

  it('reports totalTested as the full font list length', async () => {
    const result = await collector.collect();
    expect(result.totalTested).toBeGreaterThan(50);
  });

  it('creates a hidden span and cleans it up', async () => {
    await collector.collect();

    expect(document.createElement).toHaveBeenCalledWith('span');
    expect(document.body.appendChild).toHaveBeenCalledWith(mockSpan);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockSpan);
  });

  it('only includes detected fonts in the array', async () => {
    const result = await collector.collect();

    // Every entry should be a string and should be in our installed set
    for (const font of result.detectedFonts) {
      expect(typeof font).toBe('string');
      expect(INSTALLED_FONTS).toContain(font);
    }
    expect(result.detectedFonts.length).toBe(INSTALLED_FONTS.length);
  });
});
