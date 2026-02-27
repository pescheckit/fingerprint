# ThumbmarkJS - Implementation Plan

## Overview
Browser fingerprinting library for fraud detection, bot prevention, and security - built for the collaborative development session.

---

## Phase 1: Core Fingerprint Collection Engine

### 1.1 Basic Browser Signals (Low-hanging fruit)
**Priority: HIGH | Complexity: LOW**

Collect basic navigator properties:
```javascript
{
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  languages: navigator.languages,
  hardwareConcurrency: navigator.hardwareConcurrency,
  deviceMemory: navigator.deviceMemory,
  maxTouchPoints: navigator.maxTouchPoints,
  cookieEnabled: navigator.cookieEnabled,
  doNotTrack: navigator.doNotTrack
}
```

**Stability**: Medium-High
**Entropy**: ~8-10 bits

---

### 1.2 Screen & Display Properties
**Priority: HIGH | Complexity: LOW**

```javascript
{
  screenResolution: [screen.width, screen.height],
  availableResolution: [screen.availWidth, screen.availHeight],
  colorDepth: screen.colorDepth,
  pixelRatio: window.devicePixelRatio,
  screenOrientation: screen.orientation?.type
}
```

**Stability**: Medium (changes with monitor/resolution changes)
**Entropy**: ~5-6 bits

---

### 1.3 Timezone & Locale Detection
**Priority: MEDIUM | Complexity: LOW**

```javascript
{
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezoneOffset: new Date().getTimezoneOffset(),
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
  dateFormat: new Date(2026, 0, 1).toLocaleDateString()
}
```

**Stability**: High (unless user travels)
**Entropy**: ~3-4 bits

---

## Phase 2: Advanced Fingerprinting Techniques

### 2.1 Canvas Fingerprinting ⭐ CRITICAL
**Priority: CRITICAL | Complexity: MEDIUM**

Most reliable technique - generates unique hash from rendering differences:

```javascript
function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 240, 60);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#9013fe');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 240, 60);

  // Draw text with specific font
  ctx.font = '18px "Arial", "Helvetica", sans-serif';
  ctx.fillStyle = '#f39c12';
  ctx.fillText('ThumbmarkJS 🔍', 10, 40);

  // Add shapes for more entropy
  ctx.beginPath();
  ctx.arc(200, 30, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();

  // Extract and hash
  return canvas.toDataURL();
}
```

**Stability**: Very High (5.7 bits entropy)
**Why it works**: GPU, driver, OS differences create unique rendering

---

### 2.2 WebGL Fingerprinting ⭐ CRITICAL
**Priority: CRITICAL | Complexity: MEDIUM**

Hardware-based identification:

```javascript
function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) return null;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

  return {
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    extensions: gl.getSupportedExtensions(),
    // WebGL parameters
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
  };
}
```

**Stability**: Very High
**Entropy**: ~6-8 bits
**Note**: Privacy browsers may block `WEBGL_debug_renderer_info`

---

### 2.3 Audio Fingerprinting ⭐ HIGH VALUE
**Priority: HIGH | Complexity: MEDIUM-HIGH**

Uses Web Audio API to detect processing variations:

```javascript
async function getAudioFingerprint() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const analyser = audioContext.createAnalyser();
  const compressor = audioContext.createDynamicsCompressor();

  // Configure compressor (creates variations)
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  // Connect nodes
  oscillator.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(audioContext.destination);

  // Create 1kHz sine wave
  oscillator.frequency.value = 1000;
  oscillator.start(0);

  // Process offline
  const offlineContext = new OfflineAudioContext(1, 44100, 44100);
  const offlineOscillator = offlineContext.createOscillator();
  const offlineCompressor = offlineContext.createDynamicsCompressor();

  offlineOscillator.connect(offlineCompressor);
  offlineCompressor.connect(offlineContext.destination);

  offlineOscillator.frequency.value = 1000;
  offlineOscillator.start(0);

  const audioBuffer = await offlineContext.startRendering();
  const channelData = audioBuffer.getChannelData(0);

  // Sum values for fingerprint
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    sum += Math.abs(channelData[i]);
  }

  oscillator.stop();
  audioContext.close();

  return sum.toString();
}
```

**Stability**: Very High
**Entropy**: ~4-5 bits

---

### 2.4 Font Detection
**Priority: MEDIUM | Complexity: MEDIUM**

Two approaches:

**Method 1: Font Metrics Measurement**
```javascript
function detectFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Calibri', 'Helvetica',
    'Century Gothic', 'Franklin Gothic', 'Optima', 'Cambria'
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';

  const baseSizes = {};
  baseFonts.forEach(baseFont => {
    ctx.font = testSize + ' ' + baseFont;
    baseSizes[baseFont] = ctx.measureText(testString).width;
  });

  const detectedFonts = [];
  testFonts.forEach(font => {
    let detected = false;
    baseFonts.forEach(baseFont => {
      ctx.font = testSize + ' "' + font + '", ' + baseFont;
      const size = ctx.measureText(testString).width;
      if (size !== baseSizes[baseFont]) {
        detected = true;
      }
    });
    if (detected) detectedFonts.push(font);
  });

  return detectedFonts;
}
```

**Method 2: Direct Query (if available)**
```javascript
async function queryLocalFonts() {
  if ('queryLocalFonts' in window) {
    try {
      const fonts = await window.queryLocalFonts();
      return fonts.map(f => f.family);
    } catch (e) {
      return null; // Permission denied
    }
  }
  return null;
}
```

**Stability**: Medium-High
**Entropy**: ~5 bits (34% unique identification)

---

## Phase 3: Advanced Detection Techniques

### 3.1 WebRTC IP Leak Detection
**Priority: MEDIUM | Complexity: MEDIUM**

Reveals local and public IPs (even behind VPN):

```javascript
async function getWebRTCIPs() {
  const ips = new Set();

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.createDataChannel('');

  pc.onicecandidate = (e) => {
    if (!e.candidate) return;
    const ipMatch = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(e.candidate.candidate);
    if (ipMatch) ips.add(ipMatch[0]);
  };

  await pc.createOffer().then(offer => pc.setLocalDescription(offer));

  // Wait for ICE gathering
  await new Promise(resolve => setTimeout(resolve, 2000));

  pc.close();
  return Array.from(ips);
}
```

**Stability**: Medium (changes with network)
**Privacy concern**: Can leak real IP behind VPN

---

### 3.2 Browser Extensions Detection
**Priority: LOW | Complexity: HIGH**

Detect installed extensions via:
- DOM modifications they make
- Web-accessible resources timing
- Specific element injection patterns

```javascript
function detectExtensions() {
  const commonExtensions = {
    'chrome-extension://gighmmpiobklfepjocnamgkkbiglidom/adblock-onpage-icon-16.png': 'AdBlock',
    'chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/img/icon128.png': 'uBlock Origin',
    // Add more known extension resources
  };

  const detected = [];

  for (const [resource, name] of Object.entries(commonExtensions)) {
    const img = new Image();
    img.src = resource;
    img.onload = () => detected.push(name);
  }

  return detected;
}
```

**Note**: Most browsers now use randomized extension IDs making this harder

---

### 3.3 Media Devices Enumeration
**Priority: LOW | Complexity: LOW**

Requires permission but reveals hardware:

```javascript
async function getMediaDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map(d => ({
      kind: d.kind,
      label: d.label,
      deviceId: d.deviceId
    }));
  } catch (e) {
    return null; // Permission denied or not supported
  }
}
```

**Stability**: Medium
**Privacy**: Requires permission

---

## Phase 4: Fingerprint Hash Generation

### 4.1 Hash Algorithm Implementation

Use **MurmurHash3** for fast, consistent hashing:

```javascript
function murmurhash3_32_gc(key, seed = 0) {
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;
  let k1, h1b;

  while (i < bytes) {
    k1 =
      ((key.charCodeAt(i) & 0xff)) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  switch (remainder) {
    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1: k1 ^= (key.charCodeAt(i) & 0xff);

    k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
```

### 4.2 Composite Fingerprint Generation

```javascript
async function generateFingerprint() {
  const components = {
    // Basic signals
    navigator: getNavigatorProperties(),
    screen: getScreenProperties(),
    timezone: getTimezoneProperties(),

    // Advanced signals (parallel collection)
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    audio: await getAudioFingerprint(),
    fonts: detectFonts(),

    // Optional (may fail)
    webrtc: await getWebRTCIPs().catch(() => null),
    mediaDevices: await getMediaDevices().catch(() => null)
  };

  // Create stable string representation
  const fingerprintString = JSON.stringify(components, Object.keys(components).sort());

  // Generate hash
  const hash = murmurhash3_32_gc(fingerprintString).toString(36);

  return {
    visitorId: hash,
    confidence: calculateConfidence(components),
    components: components,
    timestamp: Date.now()
  };
}

function calculateConfidence(components) {
  let entropyBits = 0;

  // Calculate total entropy
  if (components.canvas) entropyBits += 5.7;
  if (components.webgl) entropyBits += 7;
  if (components.audio) entropyBits += 4.5;
  if (components.fonts?.length > 0) entropyBits += 5;
  if (components.navigator) entropyBits += 8;
  if (components.screen) entropyBits += 5;

  // Confidence percentage
  const maxEntropy = 35;
  return Math.min(99, (entropyBits / maxEntropy) * 100);
}
```

---

## Phase 5: Demo HTML Page

### 5.1 Interactive Demo Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ThumbmarkJS - Browser Fingerprint Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .fingerprint-id {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 1.5rem;
      text-align: center;
      word-break: break-all;
      position: relative;
    }

    .confidence {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      opacity: 0.9;
    }

    .components {
      margin-top: 2rem;
    }

    .component {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid #667eea;
    }

    .component h3 {
      color: #667eea;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }

    .component pre {
      background: white;
      padding: 0.75rem;
      border-radius: 0.25rem;
      overflow-x: auto;
      font-size: 0.85rem;
    }

    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 ThumbmarkJS</h1>
    <p style="color: #666; margin-bottom: 1rem;">
      Browser Fingerprint Demo - Educational Purpose Only
    </p>

    <div id="loading" class="loading">
      <p>🔄 Generating your unique fingerprint...</p>
    </div>

    <div id="result" style="display: none;">
      <div class="fingerprint-id">
        <div style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">
          Your Visitor ID
        </div>
        <div id="visitorId"></div>
        <div class="confidence" id="confidence"></div>
      </div>

      <button onclick="regenerate()">🔄 Regenerate Fingerprint</button>

      <div class="components">
        <h2 style="margin-bottom: 1rem;">Collected Signals</h2>
        <div id="components"></div>
      </div>
    </div>
  </div>

  <script src="thumbmark.js"></script>
  <script>
    async function displayFingerprint() {
      const result = await ThumbmarkJS.generate();

      document.getElementById('loading').style.display = 'none';
      document.getElementById('result').style.display = 'block';

      document.getElementById('visitorId').textContent = result.visitorId;
      document.getElementById('confidence').textContent =
        `Confidence: ${result.confidence.toFixed(1)}% (${calculateEntropy(result.components).toFixed(1)} bits of entropy)`;

      const componentsDiv = document.getElementById('components');
      componentsDiv.innerHTML = '';

      for (const [name, data] of Object.entries(result.components)) {
        if (data === null) continue;

        const component = document.createElement('div');
        component.className = 'component';
        component.innerHTML = `
          <h3>${formatComponentName(name)}</h3>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        componentsDiv.appendChild(component);
      }
    }

    function formatComponentName(name) {
      return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
    }

    function calculateEntropy(components) {
      let bits = 0;
      if (components.canvas) bits += 5.7;
      if (components.webgl) bits += 7;
      if (components.audio) bits += 4.5;
      if (components.fonts?.length > 0) bits += 5;
      if (components.navigator) bits += 8;
      if (components.screen) bits += 5;
      return bits;
    }

    function regenerate() {
      document.getElementById('loading').style.display = 'block';
      document.getElementById('result').style.display = 'none';
      displayFingerprint();
    }

    displayFingerprint();
  </script>
</body>
</html>
```

---

## Phase 6: Project Structure

```
thumbmarkjs/
├── src/
│   ├── index.js              # Main export
│   ├── collectors/
│   │   ├── canvas.js         # Canvas fingerprinting
│   │   ├── webgl.js          # WebGL fingerprinting
│   │   ├── audio.js          # Audio fingerprinting
│   │   ├── fonts.js          # Font detection
│   │   ├── navigator.js      # Navigator properties
│   │   ├── screen.js         # Screen properties
│   │   ├── timezone.js       # Timezone/locale
│   │   └── webrtc.js         # WebRTC leak detection
│   ├── hash.js               # MurmurHash implementation
│   └── utils.js              # Helper functions
├── demo/
│   ├── index.html            # Demo page
│   └── style.css             # Styles
├── dist/
│   └── thumbmark.min.js      # Built bundle
├── package.json
├── rollup.config.js          # Build configuration
└── README.md
```

---

## Phase 7: Build & Deploy System

### 7.1 Package.json

```json
{
  "name": "thumbmarkjs",
  "version": "1.0.0",
  "description": "Browser fingerprinting library",
  "main": "dist/thumbmark.js",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "serve": "python3 -m http.server 8000"
  },
  "devDependencies": {
    "@rollup/plugin-terser": "^0.4.4",
    "rollup": "^4.0.0"
  }
}
```

### 7.2 Rollup Config

```javascript
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/thumbmark.js',
      format: 'umd',
      name: 'ThumbmarkJS'
    },
    {
      file: 'dist/thumbmark.min.js',
      format: 'umd',
      name: 'ThumbmarkJS',
      plugins: [terser()]
    }
  ]
};
```

---

## Implementation Priority

### Week 1: MVP (Minimum Viable Product)
1. ✅ Basic navigator properties
2. ✅ Screen properties
3. ✅ Canvas fingerprinting
4. ✅ Hash generation
5. ✅ Simple demo page

### Week 2: Advanced Features
6. ✅ WebGL fingerprinting
7. ✅ Audio fingerprinting
8. ✅ Font detection
9. ✅ Enhanced demo UI

### Week 3: Polish & Deploy
10. ✅ WebRTC leak detection
11. ✅ Confidence scoring
12. ✅ Documentation
13. ✅ Cloudflare deployment

---

## Expected Results

### Uniqueness
With all signals combined:
- **23.8+ bits of entropy**
- **~99% unique identification** among millions of users
- **Cross-session persistence** (doesn't require cookies)

### Most Valuable Signals (Priority Order)
1. **Canvas** - 5.7 bits, very stable
2. **WebGL** - 7 bits, hardware-based
3. **Navigator** - 8 bits, broad coverage
4. **Fonts** - 5 bits, stable
5. **Audio** - 4.5 bits, stable
6. **Screen** - 5 bits, moderately stable

### Limitations
- ❌ Cannot read cross-origin cookies
- ❌ Cannot access browsing history
- ❌ Cannot read local files
- ❌ Privacy browsers will randomize/block some signals
- ✅ Works entirely within browser security model

---

## Ethical Considerations

### Legitimate Use Cases ✅
- Fraud detection
- Bot prevention
- Account security
- Multi-factor authentication

### Privacy Concerns ⚠️
- Users cannot opt-out easily
- Works without consent
- Bypasses cookie blockers
- Can track across sessions

### Recommendations
- Include privacy policy disclosure
- Provide opt-out mechanism
- Use only for security purposes
- Don't combine with PII without consent

---

## Testing Strategy

### Browser Compatibility
Test on:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Brave (anti-fingerprinting)
- Tor Browser (maximum privacy)

### Device Coverage
- Desktop: Windows, macOS, Linux
- Mobile: iOS Safari, Chrome Android
- Different GPU vendors: Intel, AMD, NVIDIA

### Metrics to Track
- Uniqueness rate
- Stability over time
- False positive rate
- Performance (collection time)

---

## Next Steps

1. **Start with Phase 1** - Build basic signal collection
2. **Test canvas fingerprinting** - Most critical component
3. **Add WebGL** - Second most valuable signal
4. **Build demo page** - Show results visually
5. **Iterate and refine** - Add more signals progressively

**Goal**: Working demo by end of collaborative session (Feb 27, 2026)
