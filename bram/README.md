# ThumbmarkJS - Advanced Browser Fingerprinting Library

A comprehensive, modular browser fingerprinting library built for research and educational purposes.

## Features

### Basic Fingerprinting (High Accuracy)
- 🎨 **Canvas Fingerprinting** - GPU rendering differences (5.7 bits entropy)
- 🖼️ **WebGL Fingerprinting** - GPU hardware identification (7 bits)
- 🔊 **Audio Fingerprinting** - Audio processing variations (4.5 bits)
- 🔤 **Font Detection** - Installed system fonts (5 bits)
- 🖥️ **Navigator Properties** - Browser and hardware info (8 bits)
- 📺 **Screen Properties** - Display characteristics (5 bits)
- 🌍 **Timezone & Locale** - Geographic indicators (3.5 bits)

### Advanced Detection
- 🔗 **Protocol Handler Detection** - Detect 40+ installed applications (6 bits)
- 🛡️ **VPN Detection** - WebRTC leaks, latency analysis, IP mismatches
- 🧅 **Tor Browser Detection** - Multi-signal browser fingerprinting
- 💻 **Cross-Browser Device Matching** - Hardware-based device ID (15 bits)

### Total Entropy
**~50 bits** = 99.9%+ unique identification among billions of users

## Installation

```bash
npm install
npm run build
```

## Quick Start

```javascript
// Generate basic fingerprint
const result = await ThumbmarkJS.generate();
console.log('Visitor ID:', result.visitorId);
console.log('Confidence:', result.confidence);

// Generate complete fingerprint (all modules)
const complete = await ThumbmarkJS.generateComplete();

// Get device ID (cross-browser)
const deviceId = await ThumbmarkJS.generateDeviceId();

// Detect VPN
const vpn = await ThumbmarkJS.detectVPN();
console.log('VPN detected:', vpn.likely);

// Detect Tor
const tor = await ThumbmarkJS.detectTor();
console.log('Tor probability:', tor.probability);

// Detect installed apps
const apps = await ThumbmarkJS.detectProtocols();
console.log('Installed apps:', apps.detected);
```

## Custom Module Usage

```javascript
// Use specific modules only
const result = await ThumbmarkJS.generate({
  modules: [
    ThumbmarkJS.modules.Canvas,
    ThumbmarkJS.modules.WebGL,
    ThumbmarkJS.modules.CrossBrowser
  ]
});

// Use presets
const hardware = await ThumbmarkJS.generate({
  modules: ThumbmarkJS.presets.HARDWARE_ONLY
});
```

## Available Modules

- `Canvas` - Canvas fingerprinting (GPU-based)
- `WebGL` - WebGL/GPU fingerprinting
- `Audio` - Audio context fingerprinting
- `Fonts` - Font enumeration
- `Navigator` - Browser properties
- `Screen` - Screen and display properties
- `Timezone` - Timezone and locale
- `Protocols` - Protocol handler detection
- `VPNDetector` - VPN detection
- `TorDetector` - Tor browser detection
- `CrossBrowser` - Cross-browser device matching

## Module Presets

```javascript
ThumbmarkJS.presets.DEFAULT      // Basic fingerprinting
ThumbmarkJS.presets.ALL          // All modules
ThumbmarkJS.presets.HARDWARE_ONLY // Hardware-based only
ThumbmarkJS.presets.DETECTION_ONLY // VPN/Tor/Protocols only
```

## Demo

Run the demo locally:

```bash
npm run build
npm run serve
```

Open http://localhost:8000/demo/ in your browser.

## Architecture

```
src/
├── core/
│   ├── fingerprinter.js  # Core orchestrator
│   ├── hasher.js          # MurmurHash3
│   └── utils.js           # Helper functions
├── modules/
│   ├── canvas.js          # Canvas fingerprinting
│   ├── webgl.js           # WebGL fingerprinting
│   ├── audio.js           # Audio fingerprinting
│   ├── fonts.js           # Font detection
│   ├── navigator.js       # Navigator properties
│   ├── screen.js          # Screen properties
│   ├── timezone.js        # Timezone detection
│   ├── protocols.js       # Protocol handlers
│   ├── vpn-detector.js    # VPN detection
│   ├── tor-detector.js    # Tor detection
│   └── cross-browser.js   # Cross-browser matching
└── index.js               # Main API
```

## Research Findings

### Most Reliable Signals (Cross-Browser)
1. **WebGL GPU Renderer** - 90-95% consistent across browsers
2. **Canvas Fingerprint** - 85-95% consistent (hardware-based)
3. **Screen Hardware** - 95-99% consistent
4. **Audio Processing** - 80-90% consistent
5. **CPU Core Count** - 99% consistent

### VPN Detection Accuracy
- WebRTC IP Leaks: 60-70% (declining due to browser countermeasures)
- Commercial IP Databases: 90-95%
- Latency Analysis: 75-85%
- Combined Multi-Signal: 85-90%

### Tor Detection Accuracy
- Exit Node IP Lists: 95-99%
- Multi-Signal Fingerprinting: 85-95%
- Network Latency Patterns: 80-90%

## Use Cases

### ✅ Legitimate
- Fraud detection and prevention
- Bot detection
- Account security (MFA)
- DDoS mitigation
- Analytics and security research

### ⚠️ Privacy Concerns
- Users cannot easily opt-out
- Works without explicit consent
- Bypasses cookie blockers
- Can track across sessions

## Ethical Considerations

This library is built for **educational and research purposes**. If you use it in production:

1. **Disclose** fingerprinting in your privacy policy
2. **Provide opt-out** mechanisms where possible
3. **Use responsibly** for security/fraud prevention only
4. **Don't combine** with PII without explicit consent
5. **Follow GDPR/privacy regulations**

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Brave (randomizes some signals)
- ⚠️ Tor Browser (blocks many APIs)

## License

MIT - Educational purposes only

## Acknowledgments

Research based on:
- FingerprintJS
- AmIUnique
- EFF Cover Your Tracks
- Academic research papers on browser fingerprinting

---

**Note:** This is experimental research software. Do not use for malicious tracking or privacy violation.
