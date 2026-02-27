/**
 * Device Thumbmark - Cross-browser device detection engine
 */

import {
  DeviceThumbmarkResult,
  DeviceThumbmarkOptions,
  ModuleInterface,
  ModuleResult
} from './types';
import { hashObject } from './utils/hash';
import { safely, calculateTotalEntropy, calculateAverageStability, calculateConfidence } from './utils/helpers';
import {
  WebGLModule,
  CanvasModule,
  AudioModule,
  ScreenModule,
  HardwareModule,
  SystemModule,
  ProtocolsModule
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

    // Initialize hardware modules (always safe, no dialogs)
    this.allModules = [
      new WebGLModule(),    // Most reliable - 12 bits, 95% stability
      new ScreenModule(),   // Very stable - 8 bits, 95% stability
      new CanvasModule(),   // Stable - 8 bits, 90% stability
      new AudioModule(),    // Good - 6 bits, 85% stability
      new HardwareModule(), // Excellent - 6 bits, 99% stability
      new SystemModule()    // Good - 4 bits, 90% stability
    ];
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

    const deviceId = hashObject(hardwareData);

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
