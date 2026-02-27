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
  CanvasModule,
  AudioModule,
  ScreenModule,
  HardwareModule,
  SystemModule,
  PerformanceModule,
  TorDetectionModule,
  FloatingPointModule
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

    // Initialize modules (optimized based on Tor compatibility research)
    this.allModules = [
      new HardwareModule(),        // ⭐ MOST RELIABLE - CPU/RAM - 6 bits, 99% stability (works on Tor!)
      new TorDetectionModule(),    // Tor detection - 8 bits, 90% stability (FIXED!)
      new WebGLModule(),           // GPU info - 12 bits, 95% stability (spoofed on Tor)
      new WebGLRenderModule(),     // GPU rendering - 10 bits, 95% stability (randomized on Tor)
      new ScreenModule(),          // Display - 8 bits, 95% stability (standardized on Tor)
      new CanvasModule(),          // Canvas - 8 bits, 90% stability (randomized on Tor)
      new AudioModule(),           // Audio - 6 bits, 85% stability (degraded on Tor)
      new FloatingPointModule(),   // FP precision - 5 bits, 95% stability ⭐ NEW
      new PerformanceModule(),     // CPU perf - 5 bits, 80% stability (coarsened on Tor)
      new SystemModule()           // OS info - 4 bits, 90% stability (standardized on Tor)
    ];
    // Removed: BatteryModule (deprecated), ProtocolsModule (blocked on Tor), MediaDevicesModule (unreliable)
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

    // Collect from all available modules
    for (const module of this.allModules) {
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

    // Generate device ID from hardware-only signals
    const hardwareModules = modules.filter(m => m.hardwareBased);
    const hardwareData: any = {};
    for (const module of hardwareModules) {
      hardwareData[module.name] = module.data;
    }

    const deviceId = await hashObject(hardwareData); // SHA-256 for better uniqueness

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
