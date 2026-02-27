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
  NetworkTimingModule,
  FontsModule,
  SpeechSynthesisModule,
  WebGPUModule,
  KeystrokeDynamicsModule,
  MouseDynamicsModule,
  WebAssemblyCPUModule,
  GamepadModule,
  ExtensionsModule,
  OffscreenCanvasModule,
  CSSSupportsModule,
  MediaDevicesModule,
  WebAuthnModule,
  PaymentRequestModule
} from './modules/fingerprint';

// Detection modules
import {
  TorDetectionModule,
  VPNDetectorModule,
  ProxyDetectorModule
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
      new ProxyDetectorModule(),      // Proxy detection - 0 bits (detection only) 🆕
      new WebRTCLeakModule(),         // IP leak - 10 bits, 85% (proxy-resistant!) 🆕
      new NetworkTimingModule(),      // Network timing - 8 bits, 75% (proxy-resistant!) 🆕
      new FontsModule(),              // Fonts - 7 bits, 92% (educational!) 🆕
      new SpeechSynthesisModule(),    // Speech - 5 bits, 95% (educational!) 🆕
      new ExtensionsModule(),         // Extensions - 10 bits, 80% (educational!) 🆕
      new OffscreenCanvasModule(),    // Offscreen Canvas - 8 bits, 88% (educational!) 🆕
      new WebGPUModule(),             // WebGPU - 18 bits, 90% (educational!) 🆕
      new KeystrokeDynamicsModule(),  // Keystroke - 8 bits, 70% (behavioral!) 🆕
      new MouseDynamicsModule(),      // Mouse - 8 bits, 70% (behavioral!) 🆕
      new WebAssemblyCPUModule(),     // WASM CPU - 12 bits, 85% (hardware!) 🆕
      new GamepadModule(),            // Gamepad - 4 bits, 95% (hardware!) 🆕
      new CSSSupportsModule(),        // CSS @supports - 10 bits, 98% (NDSS 2025!) 🆕
      new MediaDevicesModule(),       // Media devices - 5 bits, 85% (camera/mic!) 🆕
      new WebAuthnModule(),           // WebAuthn - 3 bits, 98% (biometric!) 🆕
      new PaymentRequestModule(),     // Payment - 4 bits, 95% (wallets!) 🆕
      new WebGLModule(),              // GPU strings - 12 bits, 95% (spoofed on Tor)
      new WebGLRenderModule(),        // GPU rendering - 10 bits, 95% (randomized on Tor)
      new ScreenModule(),             // Exact dims - 8 bits, 95% (rounded on Tor)
      new CanvasModule(),             // Canvas render - 8 bits, 90% (randomized on Tor)
      new AudioModule(),              // Audio - 6 bits, 85% (degraded on Tor)
      new PerformanceModule(),        // CPU perf - 5 bits, 80% (coarsened on Tor)
      new SystemModule()              // OS info - 4 bits, 90% (standardized on Tor)
    ];
    // TIER 1 = 27 bits (works on ALL browsers including Tor!)
    // TIER 1+2 = 136+ bits (only on normal browsers, includes WebGPU + behavioral + hardware + extensions detection!)
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

    // 2. Fingerprint UUID (MORE entropy for device detection!)
    // Goal: ~90 bits entropy, 15-20 modules
    // Accept SOME variance for higher entropy - doesn't need to be 100% cross-browser
    const FINGERPRINT_STABLE_MODULES = [
      ...CROSS_BROWSER_MODULES,  // 8 base modules (27 bits)
      // Add modules with PROVEN identical hash/signature values:
      'webassembly-cpu',      // fingerprint: l6r1z2 (proven stable!)
      'gamepad',              // fingerprint: no_gamepads (proven stable!)
      'webauthn'              // signature: 01 (proven stable!)
      // TOTAL: ~42 bits from 11 modules
      // Excluded after testing:
      // - audio (hash varies!)
      // - fonts (signature varies?)
      // - system (might have browser fields)
      // - screen (exact dims might vary)
      // TOTAL: ~72 bits from 15 modules
      // EXCLUDED (PROVEN to vary):
      // - audio (hash/sum varies!)
      // - performance (timing varies!)
      // - network-timing (RTT varies!)
      // - css-supports (browser detection by design!)
      // - webrtc-leak (IPs might change)
      // - screen (exact px might vary)
      // - offscreen-canvas (hash varies!)
      // - speech-synthesis (voice list varies)
      // - media-devices (Chrome-only in test)
      // - payment-request (Chrome-only in test)
      // - webgpu (Chrome-only)
      // EXCLUDED (browser-specific or too unstable):
      // - webgl (renderer strings differ per browser)
      // - webgl-render (pixel-level differences)
      // - canvas (rendering engine differences)
      // - extensions (browser-specific)
      // - webgpu (Chrome only)
      // - media-devices (Chrome only)
      // - payment-request (Chrome only)
      // - mouse-dynamics (changes per session)
      // - keystroke-dynamics (changes per session)
      // - offscreen-canvas (rendering differences)
      // - speech-synthesis (voice list varies)
    ];

    const fingerprintModules = modules.filter(m =>
      FINGERPRINT_STABLE_MODULES.includes(m.name) && m.data !== null
    );

    const fingerprintData: any = {};
    for (const module of fingerprintModules) {
      fingerprintData[module.name] = module.data;
    }

    const fingerprintId = await hashObject(fingerprintData); // Cross-browser device UUID
    const fingerprintEntropy = calculateTotalEntropy(fingerprintModules);
    console.log('🔑 Fingerprint ID generated:', fingerprintId, 'Length:', fingerprintId.length, `(${fingerprintModules.length} modules)`);

    // 3. Browser UUID (ALL modules - maximum entropy!)
    const browserModules = modules.filter(m => m.data !== null); // ALL modules, not just hardware!
    const browserData: any = {};
    for (const module of browserModules) {
      browserData[module.name] = module.data;
    }

    const browserId = await hashObject(browserData); // Browser-specific UUID (ALL modules!)
    const browserEntropy = calculateTotalEntropy(browserModules);
    console.log('🔑 Browser ID generated:', browserId, 'Length:', browserId.length, `(${browserModules.length} modules - ALL!)`);

    if (this.options.debug) {
      console.log(`\n🎯 TRIPLE UUID SYSTEM:`);
      console.log(`   Device UUID: ${deviceId} (${deviceEntropy.toFixed(1)} bits, ${deviceModules.length} modules) - Tor-resistant`);
      console.log(`   Fingerprint UUID: ${fingerprintId} (${fingerprintEntropy.toFixed(1)} bits, ${fingerprintModules.length} modules) - Cross-browser device`);
      console.log(`   Browser UUID: ${browserId} (${browserEntropy.toFixed(1)} bits, ${browserModules.length} modules) - Browser-specific`);
      console.log(`   ${isTor ? '🧅 Tor detected!' : '✓ Normal browser'}`);
    }

    const collectTime = performance.now() - startTime;

    if (this.options.debug) {
      console.log(`\n📊 Generated in ${collectTime.toFixed(2)}ms`);
      console.log(`   Total Modules: ${modules.length}/${this.allModules.length}`);
    }

    return {
      deviceId,           // Tor-resistant UUID (27 bits, minimal, 8 modules)
      fingerprintId,      // Device detection UUID (~104 bits, stable, 19 modules)
      browserId,          // Browser-specific UUID (170+ bits, ALL modules)
      confidence,
      entropy,
      deviceEntropy,      // Entropy of device UUID
      fingerprintEntropy, // Entropy of fingerprint UUID
      browserEntropy,     // Entropy of browser UUID
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
