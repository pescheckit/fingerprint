// === COLLECTORS ===

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Pescheck FP', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Pescheck FP', 4, 17);

    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#3366cc';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(150, 50);
    ctx.bezierCurveTo(150, 20, 250, 20, 250, 50);
    ctx.bezierCurveTo(250, 80, 150, 80, 150, 50);
    ctx.fillStyle = '#ff6633';
    ctx.fill();

    const gradient = ctx.createLinearGradient(0, 0, 300, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 120, 300, 30);

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255, 0, 255)';
    ctx.fillRect(25, 25, 75, 75);
    ctx.globalCompositeOperation = 'source-over';

    return { dataUrl: canvas.toDataURL() };
  } catch {
    return null;
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

    const extensions = (gl.getSupportedExtensions() || []).sort();

    const getPrec = (shaderType, precType) => {
      const fmt = gl.getShaderPrecisionFormat(shaderType, precType);
      return fmt ? [fmt.rangeMin, fmt.rangeMax, fmt.precision] : null;
    };

    return {
      vendor,
      renderer,
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
      maxAnisotropy: (() => {
        const ext = gl.getExtension('EXT_texture_filter_anisotropic');
        return ext ? gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : null;
      })(),
      aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
      aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      extensionCount: extensions.length,
      extensions,
      vertexHighFloat: getPrec(gl.VERTEX_SHADER, gl.HIGH_FLOAT),
      vertexMediumFloat: getPrec(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT),
      fragmentHighFloat: getPrec(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
      fragmentMediumFloat: getPrec(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
    };
  } catch {
    return null;
  }
}

async function getAudioFingerprint() {
  try {
    // OfflineAudioContext is much more reliable cross-browser than ScriptProcessor.
    // It renders audio offline (no user gesture needed, no event callback to wait for).
    const context = new OfflineAudioContext(1, 44100, 44100);

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    // DynamicsCompressor creates variation between audio stacks
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const buffer = await context.startRendering();
    const data = buffer.getChannelData(0);

    // Sample a slice of the rendered audio
    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(data[i]);
    }

    return { sum, sampleRate: context.sampleRate };
  } catch {
    return null;
  }
}

function getInstalledFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
    'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
    'Lucida Console', 'Palatino Linotype', 'Segoe UI', 'Tahoma',
    'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Menlo', 'SF Pro', 'Helvetica Neue', 'Avenir', 'Futura',
    'Apple Color Emoji', 'Monaco', 'Gill Sans',
    'Ubuntu', 'DejaVu Sans', 'Liberation Mono', 'Noto Sans',
    'Droid Sans', 'Cantarell', 'Roboto',
    'Segoe Print', 'Marlett', 'Wingdings', 'Webdings',
    'Century Gothic', 'Franklin Gothic', 'Garamond',
    'Bookman Old Style', 'MS Gothic', 'MS PGothic',
  ];

  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';

  const span = document.createElement('span');
  span.style.fontSize = testSize;
  span.style.position = 'absolute';
  span.style.left = '-9999px';
  span.style.top = '-9999px';
  span.style.visibility = 'hidden';
  span.textContent = testString;
  document.body.appendChild(span);

  const baseWidths = {};
  const baseHeights = {};
  for (const base of baseFonts) {
    span.style.fontFamily = base;
    baseWidths[base] = span.offsetWidth;
    baseHeights[base] = span.offsetHeight;
  }

  const detected = [];
  for (const font of testFonts) {
    for (const base of baseFonts) {
      span.style.fontFamily = `'${font}', ${base}`;
      if (span.offsetWidth !== baseWidths[base] || span.offsetHeight !== baseHeights[base]) {
        detected.push(font);
        break;
      }
    }
  }

  document.body.removeChild(span);
  return detected;
}

function getNavigatorSignals() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemory: navigator.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    pdfViewerEnabled: navigator.pdfViewerEnabled ?? null,
    webdriver: navigator.webdriver || false,
  };
}

function getScreenSignals() {
  return {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio,
    orientation: screen.orientation?.type || null,
  };
}

function getAdditionalSignals() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    sessionStorage: typeof window.sessionStorage !== 'undefined',
    localStorage: typeof window.localStorage !== 'undefined',
    indexedDB: typeof window.indexedDB !== 'undefined',
    connectionType: navigator.connection?.effectiveType || null,
    mathTan: Math.tan(-1e300),
    mathLog: Math.log(1000),
    mathSqrt: Math.sqrt(123456789),
  };
}

async function getClientHints() {
  if (!navigator.userAgentData) return null;
  try {
    const hints = await navigator.userAgentData.getHighEntropyValues([
      'platform', 'platformVersion', 'architecture',
      'model', 'uaFullVersion', 'fullVersionList',
    ]);
    return {
      platform: hints.platform,
      platformVersion: hints.platformVersion,
      architecture: hints.architecture,
      model: hints.model,
      fullVersionList: hints.fullVersionList,
    };
  } catch {
    return null;
  }
}

// === NEW CROSS-BROWSER COLLECTORS ===

// 1. WebGL Render Hash — GPU float math produces hardware-specific pixel output
function getWebGLRenderHash() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const vs = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;
    const fs = `
      precision mediump float;
      uniform vec2 u_res;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        float v = sin(uv.x * 12.9898 + uv.y * 78.233) * 43758.5453;
        v = fract(v);
        float r = sin(v * 6.2831) * 0.5 + 0.5;
        float g = cos(v * 3.1415 + uv.x) * 0.5 + 0.5;
        float b = sqrt(abs(sin(uv.y * 9.0 + v)));
        float a = log(v + 1.0) / log(2.0);
        gl_FragColor = vec4(r, g, b, a);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(gl.getUniformLocation(prog, 'u_res'), 64, 64);
    gl.viewport(0, 0, 64, 64);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read raw pixels — NOT toDataURL (avoids browser PNG encoding differences)
    const pixels = new Uint8Array(64 * 64 * 4);
    gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // FNV-1a hash of raw pixel data
    let hash = 0x811c9dc5;
    for (let i = 0; i < pixels.length; i++) {
      hash ^= pixels[i];
      hash = Math.imul(hash, 0x01000193);
    }

    return { hash: (hash >>> 0).toString(16) };
  } catch {
    return null;
  }
}

// 2. Alpha Blend — semi-transparent gradients + bezier curves, read via getImageData (raw pixels)
function getAlphaBlend() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Overlapping semi-transparent radial gradients
    const g1 = ctx.createRadialGradient(30, 30, 5, 30, 30, 50);
    g1.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
    g1.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 100, 100);

    const g2 = ctx.createRadialGradient(70, 40, 5, 70, 40, 50);
    g2.addColorStop(0, 'rgba(0, 255, 0, 0.6)');
    g2.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 100, 100);

    const g3 = ctx.createRadialGradient(50, 70, 5, 50, 70, 50);
    g3.addColorStop(0, 'rgba(0, 0, 255, 0.6)');
    g3.addColorStop(1, 'rgba(0, 0, 255, 0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, 100, 100);

    // Bezier curves with alpha compositing
    ctx.globalCompositeOperation = 'overlay';
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 90);
    ctx.bezierCurveTo(30, 10, 70, 10, 90, 90);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.bezierCurveTo(90, 30, 10, 70, 90, 90);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Read raw pixels via getImageData (not toDataURL)
    const imageData = ctx.getImageData(0, 0, 100, 100).data;
    let hash = 0x811c9dc5;
    for (let i = 0; i < imageData.length; i++) {
      hash ^= imageData[i];
      hash = Math.imul(hash, 0x01000193);
    }

    return { hash: (hash >>> 0).toString(16) };
  } catch {
    return null;
  }
}

// 3. Font Render Metrics — sub-pixel metrics from OS text engine
function getFontRenderMetrics() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fonts = [
      { family: 'serif', size: 20 },
      { family: 'sans-serif', size: 20 },
      { family: 'monospace', size: 20 },
      { family: 'serif', size: 14 },
      { family: 'sans-serif', size: 14 },
      { family: 'monospace', size: 14 },
      { family: 'serif', size: 32 },
      { family: 'sans-serif', size: 32 },
    ];
    const testStrings = ['Hg@#$', 'Wij|_', 'ABCDEFGHIJ'];
    const metrics = {};

    for (const f of fonts) {
      ctx.font = `${f.size}px ${f.family}`;
      for (const s of testStrings) {
        const m = ctx.measureText(s);
        const key = `${f.family}_${f.size}_${s}`;
        metrics[key] = {
          w: Math.round(m.width * 100) / 100,
          asc: Math.round((m.actualBoundingBoxAscent ?? 0) * 100) / 100,
          desc: Math.round((m.actualBoundingBoxDescent ?? 0) * 100) / 100,
        };
      }
    }

    return metrics;
  } catch {
    return null;
  }
}

// 4. Writing Systems — tests which Unicode scripts the OS can render
function getWritingSystems() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '24px sans-serif';

    // Reference: a character the OS certainly doesn't have a glyph for (tofu)
    const tofuWidth = ctx.measureText('\uFFFF').width;

    const scripts = {
      latin: 'A',
      cyrillic: '\u0414',       // Д
      greek: '\u03A9',          // Ω
      arabic: '\u0639',         // ع
      hebrew: '\u05D0',         // א
      devanagari: '\u0905',     // अ
      thai: '\u0E01',           // ก
      cjkUnified: '\u4E00',    // 一
      hangul: '\uAC00',         // 가
      japanese: '\u3042',       // あ
      tamil: '\u0BA4',          // த
      bengali: '\u0995',        // ক
      georgian: '\u10D0',       // ა
      armenian: '\u0531',       // Ա
      ethiopic: '\u1200',       // ሀ
      tibetan: '\u0F00',        // ༀ
      myanmar: '\u1000',        // က
      khmer: '\u1780',          // ក
      sinhala: '\u0D85',        // අ
      emoji: '\u2764',          // ❤
    };

    const result = {};
    for (const [name, char] of Object.entries(scripts)) {
      const w = ctx.measureText(char).width;
      result[name] = w !== tofuWidth;
    }

    return result;
  } catch {
    return null;
  }
}

// 5. OS Preferences — CSS media queries (all OS-level)
function getOSPreferences() {
  try {
    const match = (q) => window.matchMedia(q).matches;
    return {
      darkMode: match('(prefers-color-scheme: dark)'),
      reducedMotion: match('(prefers-reduced-motion: reduce)'),
      highContrast: match('(prefers-contrast: more)') || match('(-ms-high-contrast: active)'),
      colorGamutP3: match('(color-gamut: p3)'),
      colorGamutRec2020: match('(color-gamut: rec2020)'),
      hdr: match('(dynamic-range: high)'),
      pointerFine: match('(pointer: fine)'),
      pointerCoarse: match('(pointer: coarse)'),
      hoverHover: match('(hover: hover)'),
      invertedColors: match('(inverted-colors: inverted)'),
      forcedColors: match('(forced-colors: active)'),
    };
  } catch {
    return null;
  }
}

// 6. WebGL2 Capabilities — additional GPU limits
function getWebGL2Capabilities() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return null;

    return {
      max3DTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE),
      maxArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
      maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
      maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
      maxElementIndex: gl.getParameter(gl.MAX_ELEMENT_INDEX),
      maxSamples: gl.getParameter(gl.MAX_SAMPLES),
      maxServerWaitTimeout: gl.getParameter(gl.MAX_SERVER_WAIT_TIMEOUT),
      maxTextureLODBias: gl.getParameter(gl.MAX_TEXTURE_LOD_BIAS),
      maxTransformFeedbackInterleavedComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS),
      maxTransformFeedbackSeparateAttribs: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS),
      maxTransformFeedbackSeparateComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS),
      maxUniformBlockSize: gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE),
      maxUniformBufferBindings: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS),
      maxVaryingComponents: gl.getParameter(gl.MAX_VARYING_COMPONENTS),
      maxVertexOutputComponents: gl.getParameter(gl.MAX_VERTEX_OUTPUT_COMPONENTS),
      maxVertexUniformComponents: gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS),
      maxFragmentUniformComponents: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS),
      maxFragmentInputComponents: gl.getParameter(gl.MAX_FRAGMENT_INPUT_COMPONENTS),
    };
  } catch {
    return null;
  }
}

// 7. CPU Speed Class — times a math loop, buckets into speed classes
function getCPUSpeedClass() {
  try {
    const iterations = 500000;
    const start = performance.now();
    let val = 0;
    for (let i = 0; i < iterations; i++) {
      val += Math.sin(i) * Math.cos(i) * Math.sqrt(i);
    }
    const elapsed = performance.now() - start;

    let speedClass;
    if (elapsed < 20) speedClass = 'very-fast';
    else if (elapsed < 50) speedClass = 'fast';
    else if (elapsed < 150) speedClass = 'medium';
    else if (elapsed < 400) speedClass = 'slow';
    else speedClass = 'very-slow';

    return { elapsed: Math.round(elapsed * 100) / 100, speedClass, checksum: val };
  } catch {
    return null;
  }
}

// 8. Hardware APIs — checks API availability
function getHardwareAPIs() {
  try {
    return {
      battery: 'getBattery' in navigator,
      gamepad: 'getGamepads' in navigator,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      serial: 'serial' in navigator,
      hid: 'hid' in navigator,
      mediaDevices: 'mediaDevices' in navigator,
      xr: 'xr' in navigator,
      wakeLock: 'wakeLock' in navigator,
      clipboard: 'clipboard' in navigator,
      share: 'share' in navigator,
      credentials: 'credentials' in navigator,
    };
  } catch {
    return null;
  }
}

// === ORCHESTRATOR ===

async function collectAll() {
  const [audio, clientHints] = await Promise.all([
    getAudioFingerprint(),
    getClientHints(),
  ]);

  return {
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    audio,
    fonts: getInstalledFonts(),
    navigator: getNavigatorSignals(),
    screen: getScreenSignals(),
    additional: getAdditionalSignals(),
    clientHints,
    webglRender: getWebGLRenderHash(),
    alphaBlend: getAlphaBlend(),
    fontMetrics: getFontRenderMetrics(),
    writingSystems: getWritingSystems(),
    osPrefs: getOSPreferences(),
    webgl2Caps: getWebGL2Capabilities(),
    cpuSpeed: getCPUSpeedClass(),
    hardwareAPIs: getHardwareAPIs(),
  };
}

// === HASH FUNCTION ===

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

// Normalize GPU renderer string so Chrome's ANGLE(...) matches Firefox's raw name.
// Chrome: "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1 Metal)" → "apple m1 pro"
// Chrome: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)" → "nvidia geforce rtx 3080"
// Firefox: "Apple M1 Pro" → "apple m1 pro"
// Firefox: "NVIDIA GeForce RTX 3080/PCIe/SSE2" → "nvidia geforce rtx 3080"
function normalizeGPU(str) {
  if (!str) return '';
  let s = str;
  // Strip ANGLE wrapper — extract the model part (second comma-group)
  const angleMatch = s.match(/ANGLE\s*\([^,]*,\s*([^,]+)/);
  if (angleMatch) s = angleMatch[1];
  // Strip parenthetical suffixes like "(TM)", "(R)"
  s = s.replace(/\(TM\)/gi, '');
  s = s.replace(/\(R\)/gi, '');
  // Strip driver/API suffixes
  s = s.replace(/OpenGL.*$/i, '');
  s = s.replace(/Metal.*$/i, '');
  s = s.replace(/Direct3D.*$/i, '');
  s = s.replace(/vs_\d+_\d+.*$/i, '');
  s = s.replace(/Vulkan.*$/i, '');
  // Strip Firefox-style slash suffixes: "/PCIe/SSE2", "/Mesa ...", etc.
  s = s.replace(/\/.*$/, '');
  // Collapse whitespace, lowercase, trim
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();
  return s;
}

// Extract core vendor name — normalize across browsers.
// Chrome (ANGLE): vendor = "Google Inc. (NVIDIA Corporation)" → "nvidia"
// Firefox:        vendor = "NVIDIA Corporation" → "nvidia"
// Chrome (ANGLE): vendor via ANGLE regex = "Google Inc." → falls through to parenthetical
function normalizeVendor(str) {
  if (!str) return '';
  let s = str;
  // ANGLE renderer info: "ANGLE (Vendor, ...)"
  const angleMatch = s.match(/ANGLE\s*\(([^,)]+)/);
  if (angleMatch) s = angleMatch[1];
  // Chrome wraps vendor as "Google Inc. (NVIDIA Corporation)" — extract parenthetical
  const parenMatch = s.match(/\(([^)]+)\)/);
  if (parenMatch) s = parenMatch[1];
  // Strip corporate suffixes
  s = s.replace(/\b(Corporation|Corp\.?|Inc\.?|Ltd\.?|Co\.?)\b/gi, '');
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Hardware hash: ONLY signals proven identical across browsers on the same device.
// Every signal here has been verified to produce the same value in Chrome and Firefox.
//
// EXCLUDED (and why):
//   - GPU renderer/vendor (ANGLE vs native report different model names for same chip)
//   - maxTextureSize (ANGLE vs native report different caps)
//   - deviceMemory (Chrome-only API)
//   - audio sum (audio processing differs per engine)
//   - fonts (font detection differs per engine)
//   - canvas (2D rendering engine differs)
//   - alphaBlend (canvas 2D rendering differs per engine)
//   - webglRender (ANGLE vs native OpenGL produce different pixels)
//   - fontMetrics (Skia vs FreeType produce different measureText values)
//   - webgl2Caps (ANGLE vs native report different GPU limits)
//   - writingSystems (tofu char width varies between rendering engines)
//   - screen (width/height/dpr change when moving to different monitor)
//   - cpuSpeed (too variable between runs)
//   - hardwareAPIs (browser-specific API surface)
//   - colorGamut / HDR (inconsistent media query support across browsers)
async function generateHardwareHash(signals) {
  const hw = {};

  // CPU cores — OS-level, always identical cross-browser
  hw.cores = signals.navigator?.hardwareConcurrency ?? null;

  // Touch points — hardware input, always identical cross-browser
  hw.touchPoints = signals.navigator?.maxTouchPoints ?? 0;

  // Platform string — OS-level (same across browsers)
  hw.platform = signals.navigator?.platform ?? null;

  // Timezone — OS setting
  hw.tz = signals.additional?.timezone ?? null;

  // OS preferences — only CSS media queries with guaranteed cross-browser support
  // (prefers-color-scheme: Chrome 76+, Firefox 67+)
  // (prefers-reduced-motion: Chrome 74+, Firefox 63+)
  // (prefers-contrast: Chrome 96+, Firefox 101+)
  // (forced-colors: Chrome 89+, Firefox 89+)
  // (pointer/hover: Chrome 41+, Firefox 64+)
  if (signals.osPrefs) {
    hw.darkMode = signals.osPrefs.darkMode ?? null;
    hw.reducedMotion = signals.osPrefs.reducedMotion ?? null;
    hw.highContrast = signals.osPrefs.highContrast ?? null;
    hw.forcedColors = signals.osPrefs.forcedColors ?? null;
    hw.pointerFine = signals.osPrefs.pointerFine ?? null;
    hw.hoverHover = signals.osPrefs.hoverHover ?? null;
  }

  return sha256(stableStringify(hw));
}

// Full browser-specific hash (includes everything)
async function generateBrowserHash(signals) {
  const hashInput = { ...signals };
  if (hashInput.canvas?.dataUrl) {
    hashInput.canvas = { dataUrlHash: await sha256(hashInput.canvas.dataUrl) };
  }
  if (hashInput.webgl?.extensions) {
    hashInput.webgl = { ...hashInput.webgl, extensions: [...hashInput.webgl.extensions].sort() };
  }
  return sha256(stableStringify(hashInput));
}

// === LOCALSTORAGE ===

const STORAGE_KEY = 'dennie_fp';

function loadPrevious() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrent(hardwareHash, browserHash, signals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hardwareHash,
      browserHash,
      signals,
      timestamp: Date.now(),
    }));
  } catch {}
}

// === UI RENDERING ===

// scope: 'hw' = used in cross-browser hardware hash, 'browser' = browser-specific only
const SECTION_CONFIG = {
  canvas:        { label: 'Canvas',          entropy: 'high',   scope: 'browser' },
  webgl:         { label: 'WebGL / GPU',     entropy: 'high',   scope: 'browser' },
  audio:         { label: 'Audio',           entropy: 'medium', scope: 'browser' },
  fonts:         { label: 'Fonts',           entropy: 'medium', scope: 'browser' },
  navigator:     { label: 'Navigator',       entropy: 'low',    scope: 'browser' },
  screen:        { label: 'Screen',          entropy: 'low',    scope: 'browser' },
  additional:    { label: 'Additional',       entropy: 'low',    scope: 'browser' },
  clientHints:   { label: 'Client Hints',    entropy: 'medium', scope: 'browser' },
  webglRender:   { label: 'WebGL Render',    entropy: 'high',   scope: 'browser' },
  alphaBlend:    { label: 'Alpha Blend',     entropy: 'high',   scope: 'browser' },
  fontMetrics:   { label: 'Font Metrics',    entropy: 'high',   scope: 'browser' },
  writingSystems:{ label: 'Writing Systems', entropy: 'medium', scope: 'browser' },
  osPrefs:       { label: 'OS Prefs',        entropy: 'medium', scope: 'hw' },
  webgl2Caps:    { label: 'WebGL2 Caps',     entropy: 'medium', scope: 'browser' },
  cpuSpeed:      { label: 'CPU Speed',       entropy: 'low',    scope: 'browser' },
  hardwareAPIs:  { label: 'HW APIs',         entropy: 'low',    scope: 'browser' },
};

function renderDashboard(signals, hardwareHash, browserHash, previous) {
  const app = document.getElementById('app');
  const shortId = hardwareHash.substring(0, 12).toUpperCase();

  let badgeClass, badgeText;
  if (!previous) {
    badgeClass = 'new';
    badgeText = 'NEW DEVICE';
  } else if (previous.hardwareHash === hardwareHash) {
    badgeClass = 'returning';
    badgeText = 'KNOWN DEVICE';
  } else {
    badgeClass = 'changed';
    badgeText = 'HARDWARE CHANGED';
  }

  let signalCount = 0;
  for (const [, val] of Object.entries(signals)) {
    if (val === null) continue;
    if (Array.isArray(val)) { signalCount += val.length; continue; }
    if (typeof val === 'object') { signalCount += Object.keys(val).length; continue; }
    signalCount++;
  }

  app.innerHTML = '';

  // === Main Window ===
  const mainWin = el('div', 'window');

  const titleBar = el('div', 'title-bar');
  titleBar.innerHTML = `
    <span class="title-bar-text">Fingerprint Lab — Dennie</span>
    <div class="title-bar-controls">
      <button>_</button><button>□</button><button>X</button>
    </div>
  `;
  mainWin.appendChild(titleBar);

  const body = el('div', 'window-body');

  // Fingerprint terminal display
  const terminal = el('div', 'sunken dark fp-display');
  terminal.innerHTML = `
    <div class="fp-label">&#9658; Device ID (cross-browser)</div>
    <div class="fp-hash-big">${shortId}</div>
    <div class="fp-hash-full">${hardwareHash}</div>
    <hr class="fp-divider">
    <div class="fp-type-label">&#9658; Browser-specific hash</div>
    <div class="fp-hash-full browser">${browserHash}</div>
  `;
  body.appendChild(terminal);

  // Status bar
  const status = el('div', 'status-bar');
  status.innerHTML = `
    <div class="status-bar-field badge-${badgeClass}">${badgeText}</div>
    <div class="status-bar-field">${signalCount} signals</div>
    <div class="status-bar-field">${Object.keys(signals).filter(k => signals[k] !== null).length} categories</div>
  `;
  body.appendChild(status);

  // === Cross-Browser Device Signals (used in Device ID hash) ===
  const hwGroup = el('div', 'group-box');
  hwGroup.innerHTML = `<div class="group-box-label">Cross-Browser Device ID — these signals are identical across browsers</div>`;
  const hwGrid = el('div', 'hw-grid');

  const yesNo = (v) => v != null ? (v ? 'Yes' : 'No') : 'N/A';
  const crossBrowserItems = [
    { label: 'CPU Cores', value: signals.navigator?.hardwareConcurrency || 'N/A' },
    { label: 'Touch Points', value: signals.navigator?.maxTouchPoints ?? 'N/A' },
    { label: 'Platform', value: signals.navigator?.platform || 'N/A' },
    { label: 'Timezone', value: signals.additional?.timezone || 'N/A' },
    { label: 'Dark Mode', value: yesNo(signals.osPrefs?.darkMode) },
    { label: 'Reduced Motion', value: yesNo(signals.osPrefs?.reducedMotion) },
    { label: 'High Contrast', value: yesNo(signals.osPrefs?.highContrast) },
    { label: 'Forced Colors', value: yesNo(signals.osPrefs?.forcedColors) },
    { label: 'Pointer: Fine', value: yesNo(signals.osPrefs?.pointerFine) },
    { label: 'Hover: Hover', value: yesNo(signals.osPrefs?.hoverHover) },
  ];

  for (const item of crossBrowserItems) {
    const cell = el('div', 'hw-cell' + (item.full ? ' full' : ''));
    cell.innerHTML = `<div class="hw-cell-label">${item.label}</div><div class="hw-cell-value">${item.value}</div>`;
    hwGrid.appendChild(cell);
  }
  hwGroup.appendChild(hwGrid);
  body.appendChild(hwGroup);

  // === Browser-Specific Signals (used in Browser Hash only) ===
  const bsGroup = el('div', 'group-box');
  bsGroup.innerHTML = `<div class="group-box-label">Browser-Specific — these vary per browser engine</div>`;
  const bsGrid = el('div', 'hw-grid');

  const browserItems = [
    { label: 'GPU Renderer', value: signals.webgl?.renderer || 'N/A', full: true },
    { label: 'GPU Vendor', value: signals.webgl?.vendor || 'N/A' },
    { label: 'Max Texture', value: signals.webgl?.maxTextureSize || 'N/A' },
    { label: 'Memory', value: signals.navigator?.deviceMemory ? signals.navigator.deviceMemory + ' GB' : 'N/A (Chrome only)' },
    { label: 'Screen', value: `${signals.screen?.width}x${signals.screen?.height} @${signals.screen?.devicePixelRatio}x` },
    { label: 'Color Depth', value: signals.screen?.colorDepth ? signals.screen.colorDepth + '-bit' : 'N/A' },
    { label: 'Audio Sum', value: signals.audio?.sum != null ? signals.audio.sum.toFixed(4) : 'N/A' },
    { label: 'Color Gamut', value: signals.osPrefs ? (signals.osPrefs.colorGamutRec2020 ? 'Rec2020' : signals.osPrefs.colorGamutP3 ? 'P3' : 'sRGB') : 'N/A' },
    { label: 'HDR', value: yesNo(signals.osPrefs?.hdr) },
    { label: 'WebGL Render', value: signals.webglRender?.hash || 'N/A' },
    { label: 'Alpha Blend', value: signals.alphaBlend?.hash || 'N/A' },
    { label: 'Font Metrics', value: signals.fontMetrics ? Object.keys(signals.fontMetrics).length + ' entries' : 'N/A' },
    { label: 'Writing Systems', value: signals.writingSystems ? Object.values(signals.writingSystems).filter(Boolean).length + '/' + Object.keys(signals.writingSystems).length + ' scripts' : 'N/A' },
    { label: 'WebGL2 Caps', value: signals.webgl2Caps ? Object.keys(signals.webgl2Caps).length + ' caps' : 'N/A' },
    { label: 'CPU Speed', value: signals.cpuSpeed?.speedClass || 'N/A' },
    { label: 'HW APIs', value: signals.hardwareAPIs ? Object.values(signals.hardwareAPIs).filter(Boolean).length + '/' + Object.keys(signals.hardwareAPIs).length : 'N/A' },
  ];

  for (const item of browserItems) {
    const cell = el('div', 'hw-cell' + (item.full ? ' full' : ''));
    cell.innerHTML = `<div class="hw-cell-label">${item.label}</div><div class="hw-cell-value">${item.value}</div>`;
    bsGrid.appendChild(cell);
  }
  bsGroup.appendChild(bsGrid);
  body.appendChild(bsGroup);

  // === Tabbed signal details ===
  const categories = Object.entries(signals).filter(([, v]) => v !== null);
  const tabsRow = el('div', 'tabs');
  const tabContents = [];

  categories.forEach(([category], i) => {
    const config = SECTION_CONFIG[category] || { label: category, scope: 'browser' };
    const tab = el('div', 'tab' + (i === 0 ? ' active' : '') + (config.scope === 'hw' ? ' tab-hw' : ' tab-browser'));
    tab.textContent = config.label;
    tab.dataset.idx = i;
    tab.addEventListener('click', () => {
      tabsRow.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      tabContents.forEach((tc, j) => tc.classList.toggle('active', j === i));
    });
    tabsRow.appendChild(tab);
  });
  body.appendChild(tabsRow);

  categories.forEach(([category, data], i) => {
    const content = el('div', 'tab-content' + (i === 0 ? ' active' : ''));

    if (category === 'fonts') {
      const tbl = el('table', 'signal-table');
      tbl.innerHTML = `<tr><td>detected (${data.length})</td><td>${data.join(', ')}</td></tr>`;
      content.appendChild(tbl);
    } else if (category === 'canvas') {
      if (data.dataUrl) {
        const img = document.createElement('img');
        img.src = data.dataUrl;
        img.className = 'canvas-preview';
        img.alt = 'Canvas fingerprint';
        img.style.maxWidth = '100%';
        content.appendChild(img);
        const tbl = el('table', 'signal-table');
        tbl.innerHTML = `<tr><td>data length</td><td>${data.dataUrl.length} chars</td></tr>`;
        content.appendChild(tbl);
      }
    } else if (typeof data === 'object' && !Array.isArray(data)) {
      const tbl = el('table', 'signal-table');
      for (const [key, val] of Object.entries(data)) {
        const tr = document.createElement('tr');
        let displayVal = val;
        if (key === 'extensions' && Array.isArray(val)) {
          displayVal = val.join(', ');
        } else if (typeof val === 'object' && val !== null) {
          displayVal = JSON.stringify(val);
        }
        tr.innerHTML = `<td>${key}</td><td>${displayVal}</td>`;
        tbl.appendChild(tr);
      }
      content.appendChild(tbl);
    }

    tabContents.push(content);
    body.appendChild(content);
  });

  // === Change diff ===
  if (previous && previous.hardwareHash !== hardwareHash && previous.signals) {
    const changeGroup = el('div', 'group-box');
    changeGroup.innerHTML = `<div class="group-box-label">What Changed</div>`;
    const changes = findChanges(previous.signals, signals);
    if (changes.length === 0) {
      const p = document.createElement('p');
      p.style.cssText = 'font-size: 11px; color: #808080; padding: 4px;';
      p.textContent = 'Hash changed but individual signals look identical — likely floating-point or ordering differences.';
      changeGroup.appendChild(p);
    } else {
      for (const change of changes) {
        const item = el('div', 'change-item');
        item.innerHTML = `<span class="ck">${change.path}</span><span class="cv">${truncate(String(change.old), 40)} → ${truncate(String(change.new), 40)}</span>`;
        changeGroup.appendChild(item);
      }
    }
    body.appendChild(changeGroup);
  }

  mainWin.appendChild(body);

  // Status bar at bottom of window
  const bottomStatus = el('div', 'status-bar');
  bottomStatus.innerHTML = `
    <div class="status-bar-field">Dennie — Pescheck 2026</div>
    <div class="status-bar-field" id="clock" style="flex: 0; white-space: nowrap;">${new Date().toLocaleTimeString()}</div>
  `;
  mainWin.appendChild(bottomStatus);

  app.appendChild(mainWin);

  setInterval(() => {
    const cl = document.getElementById('clock');
    if (cl) cl.textContent = new Date().toLocaleTimeString();
  }, 1000);
}

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function stringify(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function findChanges(prev, curr, path = '') {
  const changes = [];
  if (prev === null || curr === null || typeof prev !== typeof curr) {
    if (prev !== curr) changes.push({ path: path || 'root', old: stringify(prev), new: stringify(curr) });
    return changes;
  }
  if (Array.isArray(prev) && Array.isArray(curr)) {
    if (JSON.stringify(prev) !== JSON.stringify(curr)) {
      changes.push({ path, old: `[${prev.length} items]`, new: `[${curr.length} items]` });
    }
    return changes;
  }
  if (typeof prev === 'object') {
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    for (const key of allKeys) {
      const subPath = path ? `${path}.${key}` : key;
      if (key === 'dataUrl') continue;
      if (!(key in prev)) {
        changes.push({ path: subPath, old: '(missing)', new: stringify(curr[key]) });
      } else if (!(key in curr)) {
        changes.push({ path: subPath, old: stringify(prev[key]), new: '(missing)' });
      } else {
        changes.push(...findChanges(prev[key], curr[key], subPath));
      }
    }
    return changes;
  }
  if (prev !== curr) changes.push({ path, old: stringify(prev), new: stringify(curr) });
  return changes;
}

// === MAIN ===

async function main() {
  const signals = await collectAll();
  const [hardwareHash, browserHash] = await Promise.all([
    generateHardwareHash(signals),
    generateBrowserHash(signals),
  ]);
  const previous = loadPrevious();

  renderDashboard(signals, hardwareHash, browserHash, previous);
  saveCurrent(hardwareHash, browserHash, signals);
}

main().catch(err => {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `<div class="window"><div class="title-bar"><span class="title-bar-text">Error</span></div><div class="window-body"><p style="padding:8px;color:#800000;font-size:11px;">${err.message}</p></div></div>`;
  console.error(err);
});
