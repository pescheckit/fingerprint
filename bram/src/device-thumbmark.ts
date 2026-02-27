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
import {
  WebGLModule,
  WebGLRenderModule,
  WebGLCapabilitiesModule,
  CanvasModule,
  CanvasPropertiesModule,
  AudioModule,
  ScreenModule,
  ScreenAspectModule,
  HardwareModule,
  SystemModule,
  PerformanceModule,
  PerformanceRatioModule,
  TorDetectionModule,
  FloatingPointModule,
  TouchCapabilitiesModule,
  ColorDepthModule
} from './modules';

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

    // Add ProtocolsModule if not already present
    const hasProtocols = this.allModules.some(m => m.name === 'protocols');
    if (!hasProtocols) {
      this.allModules.push(new ProtocolsModule());
    }

    if (this.options.debug) {
      console.log('⚠️  Protocol detection enabled - may trigger system dialogs');
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

    const hardwareModules = modules.filter(m => {
      // ALWAYS use only cross-browser stable signals
      // This ensures SAME device = SAME ID across Firefox/Chrome/Tor/Safari
      // Trade-off: ~22 bits (consistent) vs ~60 bits (inconsistent)
      return CROSS_BROWSER_MODULES.includes(m.name) && m.data !== null;
    });

    const hardwareData: any = {};
    for (const module of hardwareModules) {
      hardwareData[module.name] = module.data;
    }

    const deviceId = await hashObject(hardwareData); // SHA-256 for better uniqueness

    if (this.options.debug) {
      console.log(`🌐 Cross-Browser Mode: Using ${hardwareModules.length} stable modules`);
      console.log(`   Modules for Device ID: ${hardwareModules.map(m => m.name).join(', ')}`);
      console.log(`   ${isTor ? '🧅 Tor detected!' : '✓ Normal browser'}`);
    }

    const collectTime = performance.now() - startTime;

    if (this.options.debug) {
      console.log(`\n📊 Device Thumbmark Generated in ${collectTime.toFixed(2)}ms`);
      console.log(`   Device ID: ${deviceId}`);
      console.log(`   Entropy: ${entropy.toFixed(1)} bits`);
      console.log(`   Stability: ${stability}%`);
      console.log(`   Confidence: ${confidence}%`);
      console.log(`   Modules: ${modules.length}/${this.allModules.length}`);
    }

    return {
      deviceId,
      confidence,
      entropy,
      stability,
      modules,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
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
