/**
 * Device Thumbmark - Cross-browser device detection engine
 */

import {
  DeviceThumbmarkResult,
  DeviceThumbmarkOptions,
  ModuleInterface,
  ModuleResult
} from './types';
import { hashObject, hashObjectSync } from './utils/hash';
import { safely, calculateTotalEntropy, calculateAverageStability, calculateConfidence } from './utils/helpers';
// Device UUID modules (Tor-resistant, cross-browser)
import {
  FloatingPointModule,
  WebGLCapabilitiesModule,
  PerformanceRatioModule,
  ScreenAspectModule,
  HardwareModule,
  CanvasPropertiesModule,
  TouchCapabilitiesModule,
  ColorDepthModule
} from './modules/device';

// Fingerprint UUID modules (browser-specific, deep)
import {
  WebGLModule,
  WebGLRenderModule,
  CanvasModule,
  AudioModule,
  ScreenModule,
  PerformanceModule,
  SystemModule,
  WebRTCLeakModule,
  NetworkTimingModule
} from './modules/fingerprint';

// Detection modules
import {
  TorDetectionModule,
  VPNDetectorModule
} from './modules/detection';

export class DeviceThumbmark {
  private options: DeviceThumbmarkOptions;
  private allModules: ModuleInterface[];
  private enableProtocolDetection: boolean = false;

  constructor(options: DeviceThumbmarkOptions = {}) {
    this.options = {
      timeout: 5000,
      debug: false,
      ...options
    };

    // Initialize modules (CROSS-BROWSER OPTIMIZED)
    this.allModules = [
      // TIER 1: TOR-PROOF (works everywhere - 25 bits!)
      new FloatingPointModule(),      // ⭐ CPU FPU - 5 bits, 95%
      new WebGLCapabilitiesModule(),  // ⭐ GPU limits - 4 bits, 90%
      new PerformanceRatioModule(),   // ⭐ Timing ratios - 4 bits, 85%
      new ScreenAspectModule(),       // ⭐ Resolution patterns - 3 bits, 92%
      new HardwareModule(),           // ⭐ CPU/RAM - 6 bits, 99%
      new CanvasPropertiesModule(),   // ⭐ Canvas caps - 2 bits, 95% 🆕
      new TouchCapabilitiesModule(),  // ⭐ Touch points - 1 bit, 99% 🆕
      new ColorDepthModule(),         // ⭐ Color depth - 2 bits, 98% 🆕

      // TIER 2: BROWSER-SPECIFIC (extra entropy on normal browsers)
      new TorDetectionModule(),       // Tor detection - 8 bits, 90%
      new VPNDetectorModule(),        // VPN detection - 0 bits (detection only) 🆕
      new WebRTCLeakModule(),         // IP leak - 10 bits, 85% (proxy-resistant!) 🆕
      new NetworkTimingModule(),      // Network timing - 8 bits, 75% (proxy-resistant!) 🆕
      new WebGLModule(),              // GPU strings - 12 bits, 95% (spoofed on Tor)
      new WebGLRenderModule(),        // GPU rendering - 10 bits, 95% (randomized on Tor)
      new ScreenModule(),             // Exact dims - 8 bits, 95% (rounded on Tor)
      new CanvasModule(),             // Canvas render - 8 bits, 90% (randomized on Tor)
      new AudioModule(),              // Audio - 6 bits, 85% (degraded on Tor)
      new PerformanceModule(),        // CPU perf - 5 bits, 80% (coarsened on Tor)
      new SystemModule()              // OS info - 4 bits, 90% (standardized on Tor)
    ];
    // TIER 1 = 27 bits (works on ALL browsers including Tor!)
    // TIER 1+2 = 68 bits (only on normal browsers)
  }

  /**
   * Enable protocol detection (may trigger system dialogs)
   * Call this method explicitly if you want to detect installed apps
   */
  enableProtocols() {
    this.enableProtocolDetection = true;

    // NOTE: ProtocolsModule has been removed as it's unreliable/blocked on Tor
    // If you need protocol detection, implement it separately
    // const hasProtocols = this.allModules.some(m => m.name === 'protocols');
    // if (!hasProtocols) {
    //   this.allModules.push(new ProtocolsModule());
    // }

    if (this.options.debug) {
      console.log('⚠️  Protocol detection is no longer supported - module removed');
    }
  }

  /**
   * Generate device thumbmark
   */
  async generate(): Promise<DeviceThumbmarkResult> {
    const startTime = performance.now();
    const modules: ModuleResult[] = [];
    let isTor = false;

    // STEP 1: Detect Tor FIRST (critical for cross-browser matching!)
    const torModule = this.allModules.find(m => m.name === 'tor-detection');
    if (torModule && torModule.isAvailable()) {
      const torData = await safely(async () => {
        return await Promise.race([
          torModule.collect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
          )
        ]);
      });

      if (torData !== null) {
        modules.push({
          name: torModule.name,
          data: torData,
          entropy: torModule.entropy,
          stability: torModule.stability,
          hardwareBased: torModule.hardwareBased
        });

        isTor = torData.isTor || torData.confidence > 50; // Tor if confidence > 50%

        if (this.options.debug) {
          console.log(`🧅 Tor Detection: ${isTor ? 'YES' : 'NO'} (confidence: ${torData.confidence}%)`);
        }
      }
    }

    // STEP 2: Collect from remaining modules
    for (const module of this.allModules) {
      if (module.name === 'tor-detection') continue; // Already collected
      // Skip if module not in whitelist (if specified)
      if (this.options.modules && !this.options.modules.includes(module.name)) {
        continue;
      }

      // Check availability
      if (!module.isAvailable()) {
        if (this.options.debug) {
          console.warn(`Module ${module.name} not available`);
        }
        continue;
      }

      // Collect with timeout
      const data = await safely(async () => {
        return await Promise.race([
          module.collect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
          )
        ]);
      });

      if (data !== null) {
        modules.push({
          name: module.name,
          data,
          entropy: module.entropy,
          stability: module.stability,
          hardwareBased: module.hardwareBased
        });

        if (this.options.debug) {
          console.log(`✓ ${module.name}:`, data);
        }
      } else {
        if (this.options.debug) {
          console.warn(`✗ ${module.name}: collection failed`);
        }
      }
    }

    // Calculate metrics
    const entropy = calculateTotalEntropy(modules);
    const stability = calculateAverageStability(modules);
    const confidence = calculateConfidence(entropy, stability);

    // Generate device ID using ONLY cross-browser stable signals
    // This ensures SAME device = SAME ID across Firefox, Chrome, Tor, Safari!
    const CROSS_BROWSER_MODULES = [
      'floating-point',       // CPU FPU precision (5 bits, works everywhere!)
      'webgl-capabilities',   // GPU hardware limits (4 bits, works everywhere!)
      'perf-ratios',          // Timing ratios (4 bits, works everywhere!)
      'screen-aspect',        // Resolution patterns (3 bits, works everywhere!)
      'hardware',             // CPU cores (6 bits, even spoofed values are consistent!)
      'canvas-properties',    // Canvas capabilities (2 bits, works everywhere!) 🆕
      'touch-capabilities',   // Touch points (1 bit, works everywhere!) 🆕
      'color-depth'           // Color depth (2 bits, works everywhere!) 🆕
    ];
    // TOTAL: ~27 bits that work on ALL browsers including Tor!

    // DUAL UUID SYSTEM

    // 1. Device UUID (Tor-resistant, cross-browser)
    const deviceModules = modules.filter(m => {
      return CROSS_BROWSER_MODULES.includes(m.name) && m.data !== null;
    });

    const deviceData: any = {};
    for (const module of deviceModules) {
      deviceData[module.name] = module.data;
    }

    const deviceId = await hashObject(deviceData); // Cross-browser device ID
    const deviceEntropy = calculateTotalEntropy(deviceModules);
    console.log('🔑 Device ID generated:', deviceId, 'Length:', deviceId.length);

    // 2. Fingerprint UUID (deep, all signals)
    const allHardwareModules = modules.filter(m => m.hardwareBased && m.data !== null);
    const fingerprintData: any = {};
    for (const module of allHardwareModules) {
      fingerprintData[module.name] = module.data;
    }

    const fingerprintId = await hashObject(fingerprintData); // Deep fingerprint ID
    const fingerprintEntropy = calculateTotalEntropy(allHardwareModules);
    console.log('🔑 Fingerprint ID generated:', fingerprintId, 'Length:', fingerprintId.length);

    if (this.options.debug) {
      console.log(`\n🎯 DUAL UUID SYSTEM:`);
      console.log(`   Device UUID: ${deviceId} (${deviceEntropy.toFixed(1)} bits, ${deviceModules.length} modules)`);
      console.log(`   Fingerprint UUID: ${fingerprintId} (${fingerprintEntropy.toFixed(1)} bits, ${allHardwareModules.length} modules)`);
      console.log(`   ${isTor ? '🧅 Tor detected!' : '✓ Normal browser'}`);
    }

    const collectTime = performance.now() - startTime;

    if (this.options.debug) {
      console.log(`\n📊 Generated in ${collectTime.toFixed(2)}ms`);
      console.log(`   Total Modules: ${modules.length}/${this.allModules.length}`);
    }

    return {
      deviceId,           // Cross-browser UUID (27 bits, Tor-resistant)
      fingerprintId,      // Deep fingerprint UUID (70+ bits, browser-specific)
      confidence,
      entropy,
      deviceEntropy,      // Entropy of device UUID
      fingerprintEntropy, // Entropy of fingerprint UUID
      stability,
      modules,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      isTor
    };
  }

  /**
   * Get device ID only (fast)
   */
  async getDeviceId(): Promise<string> {
    const result = await this.generate();
    return result.deviceId;
  }

  /**
   * Get all available modules
   */
  getAvailableModules(): string[] {
    return this.allModules
      .filter(m => m.isAvailable())
      .map(m => m.name);
  }

  /**
   * Test cross-browser stability
   * Returns instructions for testing across browsers
   */
  getCrossBrowserTestInstructions(): string {
    return `
🌐 Cross-Browser Testing Instructions

To test device detection stability:

1. Copy your Device ID: ${navigator.userAgent.includes('Chrome') ? '✓ Chrome' : ''}
   ${navigator.userAgent.includes('Firefox') ? '✓ Firefox' : ''}
   ${navigator.userAgent.includes('Safari') ? '✓ Safari' : ''}
   ${navigator.userAgent.includes('Edge') ? '✓ Edg' : ''}

2. Open this page in OTHER browsers on the SAME device

3. Compare Device IDs - they should match!

Why? We use HARDWARE-based signals:
- GPU renderer (WebGL)
- Screen dimensions
- Canvas rendering (GPU)
- Audio hardware processing
- CPU cores
- System configuration

These remain constant across browsers on the same device.
    `.trim();
  }
}
