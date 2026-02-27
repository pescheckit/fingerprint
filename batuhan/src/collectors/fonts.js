const FONT_LIST = [
  // Windows
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas',
  'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Segoe UI',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Wingdings',
  'Webdings', 'Palatino Linotype', 'Microsoft Sans Serif', 'Lucida Sans Unicode',
  // macOS
  'American Typewriter', 'Andale Mono', 'Apple Chancery', 'Baskerville',
  'Big Caslon', 'Bradley Hand', 'Chalkboard', 'Chalkduster', 'Cochin',
  'Copperplate', 'Futura', 'Geneva', 'Gill Sans', 'Helvetica',
  'Helvetica Neue', 'Herculanum', 'Hoefler Text', 'Lucida Grande',
  'Marker Felt', 'Monaco', 'Optima', 'Palatino', 'Papyrus',
  'Skia', 'Trattatello', 'Zapfino', 'Menlo', 'SF Pro',
  // Linux
  'DejaVu Sans', 'DejaVu Serif', 'FreeMono', 'FreeSans', 'Liberation Mono',
  'Liberation Sans', 'Liberation Serif', 'Noto Sans', 'Noto Serif', 'Ubuntu',
  'Ubuntu Mono', 'Cantarell', 'Droid Sans', 'Roboto',
  // Professional / Office
  'Book Antiqua', 'Bookman Old Style', 'Century Gothic', 'Franklin Gothic Medium',
  'Garamond', 'Century Schoolbook',
  // CJK
  'MS Gothic', 'MS Mincho', 'SimSun', 'SimHei', 'MingLiU',
  'Malgun Gothic', 'NanumGothic', 'Meiryo',
];

// Primary: document.fonts.check() - more consistent across browsers
function detectFontsAPI() {
  if (!document.fonts?.check) return null;
  const detected = [];
  for (const font of FONT_LIST) {
    try {
      if (document.fonts.check(`16px '${font}'`)) {
        detected.push(font);
      }
    } catch { /* skip */ }
  }
  return detected;
}

// Fallback: canvas measurement
function detectFontsCanvas() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const baseFonts = ['monospace', 'sans-serif', 'serif'];

  const baselines = {};
  for (const base of baseFonts) {
    ctx.font = `${testSize} ${base}`;
    baselines[base] = ctx.measureText(testString).width;
  }

  const detected = [];
  for (const font of FONT_LIST) {
    for (const base of baseFonts) {
      ctx.font = `${testSize} '${font}', ${base}`;
      const width = ctx.measureText(testString).width;
      if (width !== baselines[base]) {
        detected.push(font);
        break;
      }
    }
  }
  return detected;
}

export function detectFonts() {
  const apiDetected = detectFontsAPI();
  const canvasDetected = detectFontsCanvas();

  // Use API result for stable hash, canvas for detailed view
  const stable = apiDetected || canvasDetected;

  return {
    detected: stable,
    canvasDetected,
    total: stable.length,
    tested: FONT_LIST.length,
  };
}
