import { Collector } from '../collector.js';

const TEST_FONTS = [
  // Windows
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Candara', 'Consolas',
  'Constantia', 'Corbel', 'Courier New', 'Georgia', 'Impact',
  'Lucida Console', 'Microsoft Sans Serif', 'Palatino Linotype',
  'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
  // macOS
  'American Typewriter', 'Avenir', 'Avenir Next', 'Baskerville',
  'Futura', 'Geneva', 'Gill Sans', 'Helvetica', 'Helvetica Neue',
  'Lucida Grande', 'Menlo', 'Monaco', 'Optima', 'Palatino',
  'SF Pro', 'SF Mono',
  // Linux
  'Cantarell', 'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif',
  'Droid Sans', 'Droid Serif', 'Liberation Mono', 'Liberation Sans',
  'Liberation Serif', 'Noto Sans', 'Noto Serif', 'Roboto', 'Ubuntu',
  'Ubuntu Mono',
  // Cross-platform / common
  'Bookman Old Style', 'Century Gothic', 'Comic Sans MS', 'Copperplate',
  'Courier', 'Franklin Gothic Medium', 'Garamond', 'Rockwell',
  'Times', 'Didot', 'Bodoni MT', 'Century Schoolbook',
  'Lucida Sans Unicode', 'Palatino Linotype', 'Perpetua',
  'Charcoal', 'Andale Mono', 'Book Antiqua',
];

const BASE_FONTS = ['monospace', 'sans-serif', 'serif'];
const TEST_STRING = 'mmmmmmmmmmlli';
const TEST_SIZE = '72px';

/**
 * Detects installed fonts by measuring rendered text dimensions.
 *
 * A hidden <span> is created with a test string and styled in a known
 * base font.  Its width and height are recorded.  Then each candidate
 * font is prepended to the font-family; if the browser resolves the
 * candidate (because it is installed), the dimensions change.
 */
export class FontCollector extends Collector {
  constructor() {
    super('fonts', 'Installed font detection', ['detectedFonts']);
  }

  async collect() {
    const doc = globalThis.document;

    const span = doc.createElement('span');
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.style.top = '-9999px';
    span.style.fontSize = TEST_SIZE;
    span.style.lineHeight = 'normal';
    span.style.fontStyle = 'normal';
    span.style.fontWeight = 'normal';
    span.style.fontVariant = 'normal';
    span.textContent = TEST_STRING;

    doc.body.appendChild(span);

    // Measure base font dimensions
    const baseDimensions = {};
    for (const baseFont of BASE_FONTS) {
      span.style.fontFamily = baseFont;
      baseDimensions[baseFont] = {
        width: span.offsetWidth,
        height: span.offsetHeight,
      };
    }

    // Test each candidate font against all base fonts
    const detectedFonts = [];

    for (const font of TEST_FONTS) {
      let detected = false;
      for (const baseFont of BASE_FONTS) {
        span.style.fontFamily = `'${font}', ${baseFont}`;
        const width = span.offsetWidth;
        const height = span.offsetHeight;

        if (width !== baseDimensions[baseFont].width || height !== baseDimensions[baseFont].height) {
          detected = true;
          break;
        }
      }
      if (detected) {
        detectedFonts.push(font);
      }
    }

    doc.body.removeChild(span);

    return {
      detectedFonts,
      totalTested: TEST_FONTS.length,
      detectionMethod: 'dimension',
    };
  }
}
