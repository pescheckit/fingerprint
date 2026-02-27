# 💻 Device Thumbmark - Cross-Browser Device Detection

A modular, TypeScript-based device fingerprinting library focused on **hardware-level signals** for cross-browser device identification.

## 🎯 Goal

Identify the **SAME physical device** across different browsers (Chrome, Firefox, Safari, Edge) using hardware-based fingerprinting.

## ✨ Features

### Hardware-Based Modules (~52 bits total entropy)

| Module | Entropy | Stability | Description |
|--------|---------|-----------|-------------|
| **WebGL** | 12 bits | 95% | GPU renderer identification (most reliable) |
| **Screen** | 8 bits | 95% | Physical display dimensions |
| **Canvas** | 8 bits | 90% | GPU rendering variations |
| **Protocols** | 8 bits | 90% | Installed apps (Discord, Steam, VS Code, etc.) |
| **Audio** | 6 bits | 85% | Audio hardware processing |
| **Hardware** | 6 bits | 99% | CPU cores, device memory |
| **System** | 4 bits | 90% | OS and system configuration |

### Key Advantages

- ✅ **Cross-Browser**: Same device ID across Chrome/Firefox/Safari/Edge
- ✅ **Hardware-Based**: Uses GPU, CPU, screen, audio hardware
- ✅ **No Cookies**: Works without storage or cookies
- ✅ **Fast**: < 1 second collection time
- ✅ **Modular**: Pick and choose which modules to use
- ✅ **TypeScript**: Fully typed with IntelliSense support

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev
```

Visit `http://localhost:3000` to see the demo.

### Production Build

```bash
npm run build
```

Output: `dist/device-thumbmark.es.js` and `dist/device-thumbmark.umd.js`

## 📖 Usage

### Basic Usage

```typescript
import { DeviceThumbmark } from './device-thumbmark';

const thumbmark = new DeviceThumbmark();
const result = await thumbmark.generate();

console.log('Device ID:', result.deviceId);
console.log('Confidence:', result.confidence);
console.log('Entropy:', result.entropy);
console.log('Stability:', result.stability);
```

### Quick Device ID

```typescript
const thumbmark = new DeviceThumbmark();
const deviceId = await thumbmark.getDeviceId();
console.log('Device ID:', deviceId);
```

### Custom Module Selection

```typescript
const thumbmark = new DeviceThumbmark({
  modules: ['webgl', 'screen', 'hardware'], // Only hardware modules
  timeout: 3000,
  debug: true
});

const result = await thumbmark.generate();
```

### Available Modules

Check which modules are available on the current device:

```typescript
const available = thumbmark.getAvailableModules();
console.log('Available:', available);
```

## 🔬 Module Details

### WebGL Module (Most Reliable)

```typescript
{
  unmaskedRenderer: "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics...)",
  unmaskedVendor: "Google Inc. (Intel)",
  maxTextureSize: 16384,
  extensions: [...],
  // ... more GPU details
}
```

**Why it works**: GPU hardware and drivers create unique rendering characteristics that remain constant across browsers.

### Protocol Detection Module

```typescript
{
  detected: ["Discord", "Steam", "VS Code", "Spotify"],
  count: 4,
  byCategory: {
    communication: ["Discord"],
    gaming: ["Steam"],
    development: ["VS Code"],
    media: ["Spotify"]
  },
  signature: "1a2b3c"
}
```

**How it works**: Tests 40+ protocol handlers (discord://, steam://, vscode://, etc.) using iframe blur detection.

### Canvas Module

```typescript
{
  hash: "abc123",
  length: 5432,
  pixelHash: "def456"
}
```

**Why it works**: Subpixel rendering differences across GPU/OS combinations.

## 🎨 Demo Features

The included demo (`index.html`) shows:

- 🆔 **Device ID** with confidence score
- 📊 **Entropy breakdown** (bits of information)
- 🔄 **Cross-browser stability** percentage
- 📱 **Module details** with hardware indicators
- 🔄 **Regenerate** functionality
- 📋 **Copy to clipboard**
- 🌐 **Cross-browser testing** instructions

## 🧪 Testing Cross-Browser

1. Open the demo in Chrome
2. Copy your Device ID
3. Open the SAME page in Firefox, Safari, or Edge
4. Compare Device IDs - they should match!

The Device ID is based on **hardware signals only**, so it remains consistent across browsers on the same device.

## 📊 Entropy Explanation

**Total: ~52 bits of entropy**

This means:
- 2^52 = 4,503,599,627,370,496 possible combinations
- **99.99%+ uniqueness** among all internet users
- Can distinguish between devices with very high confidence

## 🔒 Privacy & Ethics

### Legitimate Uses ✅
- Fraud detection
- Bot prevention
- Account security (MFA)
- Analytics and research

### Important Notes ⚠️
- Works without user consent
- Bypasses cookie blockers
- Can track across sessions
- Should include privacy disclosure

### Recommendations
- Disclose in privacy policy
- Provide opt-out mechanisms
- Use only for security purposes
- Don't combine with PII without consent
- Follow GDPR and privacy regulations

## 🏗️ Architecture

```
src/
├── types/
│   └── index.ts              # TypeScript interfaces
├── utils/
│   ├── hash.ts               # MurmurHash3 implementation
│   └── helpers.ts            # Utility functions
├── modules/
│   ├── webgl.ts             # GPU/WebGL detection
│   ├── canvas.ts            # Canvas fingerprinting
│   ├── audio.ts             # Audio hardware
│   ├── screen.ts            # Display hardware
│   ├── hardware.ts          # CPU/memory
│   ├── system.ts            # OS/system info
│   ├── protocols.ts         # Protocol handlers
│   └── index.ts             # Module exports
├── device-thumbmark.ts       # Core engine
├── index.ts                  # Library export
└── main.ts                   # Demo application
```

## 🔧 Advanced Usage

### Create Custom Modules

```typescript
import { ModuleInterface } from './types';

class MyCustomModule implements ModuleInterface {
  name = 'custom';
  entropy = 4;
  stability = 80;
  hardwareBased = true;

  isAvailable(): boolean {
    return true;
  }

  collect(): any {
    return {
      // Your custom data collection
    };
  }
}
```

### Extend DeviceThumbmark

```typescript
class MyDeviceDetector extends DeviceThumbmark {
  constructor() {
    super({ debug: true });
    // Add custom initialization
  }

  async customAnalysis() {
    const result = await this.generate();
    // Your custom analysis logic
    return result;
  }
}
```

## 📚 Research

Based on comprehensive research in:
- `CROSSBROWSER_DEVICE_FINGERPRINTING.md` - Cross-browser techniques
- `ADVANCED_FINGERPRINTING_RESEARCH.md` - Advanced methods
- `VPN_TOR_CROSSBROWSER_RESEARCH.md` - Detection techniques

Key findings:
- **WebGL GPU Renderer**: 90-95% consistent across browsers
- **Screen Hardware**: 95-99% consistent
- **Canvas Fingerprint**: 85-95% consistent (hardware-based)
- **Audio Processing**: 80-90% consistent

## 🤝 Contributing

This is a collaborative learning project. To add a new module:

1. Create new file in `src/modules/`
2. Implement `ModuleInterface`
3. Export from `src/modules/index.ts`
4. Add to `DeviceThumbmark` constructor

## 📜 License

MIT License - Educational purposes only

## 🙏 Acknowledgments

- Inspired by [thumbmarkjs](https://github.com/thumbmarkjs/thumbmarkjs)
- Research from FingerprintJS, AmIUnique, EFF Cover Your Tracks
- Academic papers on browser fingerprinting

---

**⚠️ Educational Project**: This is a research and learning tool. Use responsibly and ethically.
