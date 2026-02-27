# Browser Fingerprinting Methods

This project implements browser fingerprinting using a combination of the FingerprintJS open-source library and custom signal collection.

## Fingerprinting Methods

### 1. Screen Properties
Captures hardware display characteristics:
- **Resolution**: `screen.width` and `screen.height`
- **Available Resolution**: `screen.availWidth` and `screen.availHeight` (excludes taskbar)
- **Color Depth**: `screen.colorDepth`
- **Pixel Ratio**: `devicePixelRatio` (for detecting retina/HiDPI displays)

### 2. Navigator Properties
Extracts browser and system information:
- **User Agent**: Full browser identification string
- **Language**: Primary language (`navigator.language`)
- **Languages**: All preferred languages
- **Platform**: OS identifier (Win32, MacIntel, Linux, etc.)
- **Hardware Concurrency**: Number of CPU cores
- **Device Memory**: RAM in GB (Chrome/Edge only)
- **Max Touch Points**: Touch capability
- **Cookie Enabled**: Cookie support status
- **Do Not Track**: DNT header preference

### 3. Timezone
- **Offset**: Minutes from UTC
- **Timezone Name**: IANA timezone (e.g., "America/New_York")

### 4. Canvas Fingerprint
Draws text and shapes on a hidden canvas, then hashes the rendered output. Differences in GPU, drivers, and font rendering create unique fingerprints.

```
Canvas → Draw shapes/text → toDataURL() → Hash
```

### 5. WebGL Information
Extracts GPU and driver details:
- **Vendor**: GPU manufacturer
- **Renderer**: GPU model (via `WEBGL_debug_renderer_info`)
- **Version**: WebGL version
- **Shading Language Version**: GLSL version

### 6. WebGL Render Fingerprint
Renders a 3D scene with colored triangles and hashes the pixel output. GPU-specific rendering quirks create stable fingerprints across browsers on the same device.

### 7. Audio Fingerprint
Uses the Web Audio API with an oscillator and compressor:
1. Creates an `OfflineAudioContext`
2. Connects oscillator → compressor → destination
3. Renders audio buffer
4. Sums channel data samples to produce a fingerprint

Audio processing varies by hardware and drivers, creating device-specific signatures.

### 8. Font Detection
Two approaches:
- **Basic**: Tests monospace, sans-serif, serif fallback rendering
- **Detailed**: Tests 40+ common fonts across Windows, macOS, Linux, and web fonts using canvas text measurement

Detected fonts indicate the operating system and installed software.

### 9. Speech Synthesis Voices
Enumerates OS-installed text-to-speech voices via `speechSynthesis.getVoices()`:
- Voice count
- Supported languages
- Local vs. remote voices

Voice availability is OS-level and stable across browsers.

### 10. Math Engine Fingerprint
Executes mathematical operations that may produce slightly different floating-point results depending on the CPU and JavaScript engine:
- Trigonometric functions (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`)
- Exponential/logarithmic (`exp`, `log`, `expm1`, `log1p`)
- Power and root (`pow`, `sqrt`, `cbrt`)
- Edge cases (`Math.pow(2, -1074)`, `Math.tan(-1e300)`)

### 11. WebRTC Fingerprint
Creates an `RTCPeerConnection` to gather ICE candidates, potentially revealing:
- Local IP addresses (IPv4/IPv6)
- NAT type indicators
- Candidate count

### 12. Media Devices
Enumerates available media devices via `navigator.mediaDevices.enumerateDevices()`:
- Audio input count (microphones)
- Audio output count (speakers)
- Video input count (cameras)
- Device ID hashes

### 13. System Information
Additional navigator properties:
- `oscpu`: OS and CPU info (Firefox only)
- `vendor`: Browser vendor
- `productSub`: Build date
- `buildID`: Browser build (Firefox only)
- `pdfViewerEnabled`: Built-in PDF viewer
- `webdriver`: Automation detection

### 14. Storage APIs
Checks availability of:
- `localStorage`
- `sessionStorage`
- `indexedDB`

### 15. Cookie Analysis
Parses and categorizes cookies by type:
- Session/auth cookies
- Analytics (Google Analytics, Facebook Pixel)
- Preference cookies
- Security tokens (CSRF)
- Fingerprint-related cookies

### 16. Network Connection
Via the Network Information API (`navigator.connection`):
- **Effective Type**: 4g, 3g, 2g, slow-2g
- **Downlink**: Estimated bandwidth (Mbps)
- **RTT**: Round-trip time (ms)
- **Save Data**: Data saver mode

### 17. Battery Status
Via the Battery Status API:
- Charging status
- Battery level percentage

### 18. IP Address
Combines multiple sources to collect IP information:

**Public IP** (via Cloudflare headers):
- `CF-Connecting-IP`: Visitor's public IP address
- `CF-IPCountry`: Country code
- `CF-IPCity`: City name
- `CF-Region`: Region/state
- `CF-IPAsn`: Autonomous System Number
- `CF-IPAsOrganization`: ISP name
- IPv4/IPv6 detection

**Local IP** (via WebRTC):
- Creates `RTCPeerConnection` with STUN server
- Gathers ICE candidates to extract local network IPs
- Can reveal private network addresses (192.168.x.x, 10.x.x.x, etc.)

## Cross-Browser Device Fingerprint

The project generates a stable device fingerprint using only signals that are consistent across different browsers on the same device:

| Signal | Cross-Browser Stable |
|--------|---------------------|
| Screen resolution | Yes |
| Color depth | Yes |
| Pixel ratio | Yes |
| Timezone | Yes |
| CPU cores | Yes |
| Touch points | Yes |
| Platform (normalized) | Yes |
| Language | Yes |
| Public IP | Yes |
| Local IPs (WebRTC) | Yes |
| Canvas/WebGL hash | No (varies by engine) |
| Audio fingerprint | No (varies by engine) |
| Math fingerprint | No (varies by engine) |

## Tech Stack

- React + Vite
- FingerprintJS (open-source)
- Cloudflare D1 SQLite (with localStorage fallback)
- Deployed to Cloudflare Pages

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run ESLint
```

## Live Demo

https://fingerprint-3y6.pages.dev/vincent/
