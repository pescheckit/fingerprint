/**
 * Font Detection Module
 * Entropy: ~5 bits
 * Stability: Medium-High
 * Hardware-based: No (but system-level)
 */
export default class FontsModule {
  static name = 'fonts';
  static entropy = 5.0;
  static hardware = false;

  static baseFonts = ['monospace', 'sans-serif', 'serif'];

  static testFonts = [
    // Common Windows fonts
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino Linotype', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
    'Tahoma', 'Calibri', 'Cambria', 'Consolas', 'Candara',

    // Common Mac fonts
    'Helvetica', 'Helvetica Neue', 'Geneva', 'Monaco', 'Menlo',
    'American Typewriter', 'Andale Mono', 'Apple Chancery',

    // Common Linux fonts
    'DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Droid Sans',

    // Other common fonts
    'Century Gothic', 'Franklin Gothic Medium', 'Optima',
    'Segoe UI', 'Lucida Console', 'Lucida Sans Unicode',
    'MS Sans Serif', 'MS Serif', 'Garamond', 'Bookman Old Style'
  ];

  static isAvailable() {
    return typeof document !== 'undefined';
  }

  static collect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    // Measure base font widths
    const baseSizes = {};
    this.baseFonts.forEach(baseFont => {
      ctx.font = `${testSize} ${baseFont}`;
      baseSizes[baseFont] = ctx.measureText(testString).width;
    });

    // Test each font
    const detectedFonts = [];
    this.testFonts.forEach(font => {
      let detected = false;

      this.baseFonts.forEach(baseFont => {
        ctx.font = `${testSize} "${font}", ${baseFont}`;
        const size = ctx.measureText(testString).width;

        // If size differs from base, font is available
        if (size !== baseSizes[baseFont]) {
          detected = true;
        }
      });

      if (detected) {
        detectedFonts.push(font);
      }
    });

    return {
      fonts: detectedFonts,
      count: detectedFonts.length,
      hash: this.hashFonts(detectedFonts)
    };
  }

  static hashFonts(fonts) {
    const str = fonts.sort().join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
