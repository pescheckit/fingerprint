# DeviceCreep Module Organization

## Visual Structure

```
src/modules/
│
├── 📁 device/                    # DEVICE UUID (Tor-Resistant, 27 bits)
│   ├── floating-point.ts         # ⭐ CPU FPU - 5 bits, 95%
│   ├── webgl-capabilities.ts     # ⭐ GPU limits - 4 bits, 90%
│   ├── performance-ratios.ts     # ⭐ Timing ratios - 4 bits, 85%
│   ├── screen-aspect.ts          # ⭐ Resolution patterns - 3 bits, 92%
│   ├── hardware.ts               # ⭐ CPU/RAM - 6 bits, 99%
│   ├── canvas-properties.ts      # ⭐ Canvas caps - 2 bits, 95%
│   ├── touch-capabilities.ts     # ⭐ Touch points - 1 bit, 99%
│   ├── color-depth.ts            # ⭐ Color depth - 2 bits, 98%
│   └── index.ts                  # Export all device modules
│
├── 📁 fingerprint/               # FINGERPRINT UUID (Deep, 70+ bits)
│   ├── webgl.ts                  # GPU strings - 12 bits, 95% (spoofed on Tor)
│   ├── webgl-render.ts           # GPU rendering - 10 bits, 95% (randomized on Tor)
│   ├── canvas.ts                 # Canvas render - 8 bits, 90% (randomized on Tor)
│   ├── audio.ts                  # Audio - 6 bits, 85% (degraded on Tor)
│   ├── screen.ts                 # Exact dims - 8 bits, 95% (rounded on Tor)
│   ├── performance.ts            # CPU perf - 5 bits, 80% (coarsened on Tor)
│   ├── system.ts                 # OS info - 4 bits, 90% (standardized on Tor)
│   └── index.ts                  # Export all fingerprint modules
│
├── 📁 detection/                 # DETECTION (Special Environments)
│   ├── tor-detection.ts          # Client-side Tor detection - 8 bits, 90%
│   ├── tor-detection-server.ts   # Server-side Tor exit node detection
│   └── index.ts                  # Export all detection modules
│
└── index.ts                      # Main export (re-exports all categories)
```

## Category Details

### 🎯 Device UUID Modules
**Purpose:** Cross-browser device identification that works even on Tor

| Module | Entropy | Stability | Tor-Resistant? |
|--------|---------|-----------|----------------|
| floating-point | 5 bits | 95% | ✅ YES |
| webgl-capabilities | 4 bits | 90% | ✅ YES |
| performance-ratios | 4 bits | 85% | ✅ YES |
| screen-aspect | 3 bits | 92% | ✅ YES |
| hardware | 6 bits | 99% | ✅ YES |
| canvas-properties | 2 bits | 95% | ✅ YES |
| touch-capabilities | 1 bit | 99% | ✅ YES |
| color-depth | 2 bits | 98% | ✅ YES |
| **TOTAL** | **27 bits** | **~92%** | ✅ **YES** |

### 🔍 Fingerprint UUID Modules
**Purpose:** Deep browser fingerprinting for maximum entropy

| Module | Entropy | Stability | Tor-Resistant? |
|--------|---------|-----------|----------------|
| webgl | 12 bits | 95% | ❌ Spoofed |
| webgl-render | 10 bits | 95% | ❌ Randomized |
| canvas | 8 bits | 90% | ❌ Randomized |
| audio | 6 bits | 85% | ⚠️ Degraded |
| screen | 8 bits | 95% | ❌ Rounded |
| performance | 5 bits | 80% | ⚠️ Coarsened |
| system | 4 bits | 90% | ⚠️ Standardized |
| **TOTAL** | **53 bits** | **~90%** | ❌ **NO** |

### 🕵️ Detection Modules
**Purpose:** Identify special browser environments

| Module | Purpose | Environment |
|--------|---------|-------------|
| tor-detection | Detect Tor Browser | Client-side |
| tor-detection-server | Detect Tor exit nodes | Server-side (Node.js) |

## Import Patterns

### Individual Category Imports
```typescript
// Import device modules only
import { FloatingPointModule, HardwareModule } from './modules/device';

// Import fingerprint modules only
import { WebGLModule, CanvasModule } from './modules/fingerprint';

// Import detection modules only
import { TorDetectionModule } from './modules/detection';
```

### Main Export (All Modules)
```typescript
// Import all modules through main index
import {
  // Device modules
  FloatingPointModule,
  WebGLCapabilitiesModule,
  PerformanceRatioModule,
  ScreenAspectModule,
  HardwareModule,
  CanvasPropertiesModule,
  TouchCapabilitiesModule,
  ColorDepthModule,

  // Fingerprint modules
  WebGLModule,
  WebGLRenderModule,
  CanvasModule,
  AudioModule,
  ScreenModule,
  PerformanceModule,
  SystemModule,

  // Detection modules
  TorDetectionModule
} from './modules';
```

### DeviceThumbmark Class (Automatic)
```typescript
import { DeviceThumbmark } from './device-thumbmark';

const thumbmark = new DeviceThumbmark();
const result = await thumbmark.generate();

// Automatically uses:
// - Device modules for deviceId (Tor-resistant)
// - Fingerprint modules for fingerprintId (deep)
// - Detection modules for Tor detection
```

## Dual UUID System

### Device UUID (Tor-Resistant)
- **Modules Used:** All 8 device modules
- **Total Entropy:** ~27 bits
- **Cross-Browser:** ✅ Same ID across browsers
- **Tor-Resistant:** ✅ Works on Tor Browser
- **Use Case:** Device tracking across browsers

### Fingerprint UUID (Deep)
- **Modules Used:** All hardware-based modules (device + fingerprint)
- **Total Entropy:** ~70+ bits
- **Cross-Browser:** ❌ Different ID per browser
- **Tor-Resistant:** ❌ Spoofed/randomized on Tor
- **Use Case:** Deep browser fingerprinting

## How It Works in Code

```typescript
// In device-thumbmark.ts
const CROSS_BROWSER_MODULES = [
  'floating-point',       // From device/
  'webgl-capabilities',   // From device/
  'perf-ratios',          // From device/
  'screen-aspect',        // From device/
  'hardware',             // From device/
  'canvas-properties',    // From device/
  'touch-capabilities',   // From device/
  'color-depth'           // From device/
];

// Device UUID uses ONLY these modules
const deviceModules = modules.filter(m =>
  CROSS_BROWSER_MODULES.includes(m.name)
);
const deviceId = await hashObject(deviceModules);

// Fingerprint UUID uses ALL hardware-based modules
const fingerprintModules = modules.filter(m =>
  m.hardwareBased
);
const fingerprintId = await hashObject(fingerprintModules);
```

## Benefits of This Organization

1. **Clarity:** Immediately see which modules are Tor-resistant vs browser-specific
2. **Maintainability:** Easy to add new modules to appropriate category
3. **Documentation:** Each category has its own index with explanation
4. **Separation:** Clear distinction between device ID and fingerprint ID
5. **Scalability:** New categories can be added easily

## File Locations

| Category | Location | Files |
|----------|----------|-------|
| Device | `src/modules/device/` | 9 files (8 modules + index) |
| Fingerprint | `src/modules/fingerprint/` | 8 files (7 modules + index) |
| Detection | `src/modules/detection/` | 3 files (2 modules + index) |
| Main | `src/modules/` | 1 file (index) |

**Total:** 21 organized files
