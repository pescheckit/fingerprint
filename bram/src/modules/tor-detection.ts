/**
 * Tor Browser Detection Module
 * Detects Tor Browser and related anonymization proxies
 * Combined detection methods with confidence scoring
 */

import { ModuleInterface } from '../types';

interface TorIndicators {
  // Hardware standardization
  fixedCores: boolean;        // Always 2 cores
  fixedMemory: boolean;       // Always 2GB

  // Browser/UA patterns
  genericUA: boolean;
  forcedEnUS: boolean;
  uaConsistency: boolean;

  // Screen resolution
  torCommonResolution: boolean;
  resolutionRounded: boolean;

  // WebGL/Canvas
  webGLBlocked: boolean;
  webGLGeneric: boolean;
  canvasRandomized: boolean;

  // Network patterns
  highLatency: boolean;
  timingAnomaly: boolean;

  // Font detection
  limitedFonts: boolean;

  // Timezone mismatch (requires server-side IP)
  tzMismatch?: boolean;
}

interface TorDetectionResult {
  isTor: boolean;
  confidence: number;  // 0-100
  indicators: TorIndicators;
  detectedMethods: string[];
}

export class TorDetectionModule implements ModuleInterface {
  name = 'tor-detection';
  entropy = 8;
  stability = 90;
  hardwareBased = false;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof window !== 'undefined';
  }

  collect(): TorDetectionResult {
    const indicators: TorIndicators = {
      fixedCores: this.checkFixedCores(),
      fixedMemory: this.checkFixedMemory(),
      genericUA: this.checkGenericUA(),
      forcedEnUS: this.checkForcedEnUS(),
      uaConsistency: this.checkUAConsistency(),
      torCommonResolution: this.checkTorCommonResolution(),
      resolutionRounded: this.checkResolutionRounded(),
      webGLBlocked: this.checkWebGLBlocked(),
      webGLGeneric: this.checkWebGLGeneric(),
      canvasRandomized: this.checkCanvasRandomized(),
      highLatency: this.checkHighLatency(),
      timingAnomaly: this.checkTimingAnomaly(),
      limitedFonts: this.checkLimitedFonts()
    };

    const { confidence, detectedMethods } = this.calculateConfidence(indicators);

    return {
      isTor: confidence > 65,
      confidence,
      indicators,
      detectedMethods
    };
  }

  /**
   * Check if navigator.hardwareConcurrency is fixed at 2
   */
  private checkFixedCores(): boolean {
    return navigator.hardwareConcurrency === 2;
  }

  /**
   * Check if navigator.deviceMemory is fixed at 2GB
   */
  private checkFixedMemory(): boolean {
    const deviceMemory = (navigator as any).deviceMemory;
    return deviceMemory === 2;
  }

  /**
   * Check for Tor's standardized User-Agent
   */
  private checkGenericUA(): boolean {
    const ua = navigator.userAgent;
    // Tor standardized UA as of 2026
    const torUA = 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0';
    return ua === torUA;
  }

  /**
   * Check if language is forced to en-US
   */
  private checkForcedEnUS(): boolean {
    return navigator.language === 'en-US' &&
           navigator.languages.length === 1 &&
           navigator.languages[0] === 'en-US';
  }

  /**
   * Check consistency between UA string and actual capabilities
   */
  private checkUAConsistency(): boolean {
    const ua = navigator.userAgent;

    // If UA claims Windows 10...
    if (!ua.includes('Windows NT 10.0')) {
      return false;
    }

    // But we're on different platform or architecture
    const platform = navigator.platform;
    if (platform && !platform.includes('Win') && !platform.includes('Linux') && !platform.includes('Mac')) {
      return true;  // Inconsistency detected
    }

    // Check Firefox claims but missing Firefox-specific APIs
    if (ua.includes('Firefox') && !('mozPaintCount' in window)) {
      return true;  // Inconsistency
    }

    return false;
  }

  /**
   * Check if resolution matches Tor's common rounding patterns
   * Tor rounds to: 1000x900, 1100x900, 1200x900, 1300x900, 1400x900, etc.
   */
  private checkTorCommonResolution(): boolean {
    const width = window.screen.width;
    const height = window.screen.height;

    const torCommonResolutions = [
      [1000, 900], [1100, 900], [1200, 900], [1300, 900], [1400, 900],
      [1000, 1000], [1100, 1000], [1200, 1000], [1300, 1000], [1400, 1000],
      [1920, 1080], [1366, 768]  // Common fallbacks
    ];

    return torCommonResolutions.some(([w, h]) => width === w && height === h);
  }

  /**
   * Check if resolution is rounded to multiples of 100
   */
  private checkResolutionRounded(): boolean {
    const width = window.screen.width;
    const height = window.screen.height;

    // Tor rounds both dimensions to nearest 100
    return (width % 100 === 0 && height % 100 === 0) ||
           (width % 100 === 0 && height % 50 === 0);
  }

  /**
   * Check if WebGL is completely blocked
   */
  private checkWebGLBlocked(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ||
                 canvas.getContext('experimental-webgl');
      return !gl;
    } catch {
      return true;
    }
  }

  /**
   * Check if WebGL returns generic/standardized values
   */
  private checkWebGLGeneric(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ||
                 canvas.getContext('experimental-webgl');

      if (!gl) return true;

      const vendor = gl.getParameter(gl.VENDOR);
      const renderer = gl.getParameter(gl.RENDERER);

      // Tor returns generic values like "Google Inc." and "ANGLE (...)"
      const isGenericVendor = vendor === 'Google Inc.' ||
                             vendor === 'Mozilla' ||
                             vendor.includes('Google');
      const isGenericRenderer = renderer.includes('ANGLE') ||
                               renderer.includes('Mesa') ||
                               renderer.includes('Software');

      return isGenericVendor && isGenericRenderer;
    } catch {
      return false;
    }
  }

  /**
   * Check if canvas returns randomized/different values on multiple renders
   */
  private checkCanvasRandomized(): boolean {
    try {
      const hashes = [];

      // Render canvas multiple times
      for (let i = 0; i < 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;

        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#f60';
        ctx.beginPath();
        ctx.arc(50, 25, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.fillText('Tor detection test', 100, 25);

        const imageData = ctx.getImageData(0, 0, 200, 50);
        const hash = this.hashArray(imageData.data);
        hashes.push(hash);
      }

      // If all hashes are identical, it's likely Tor (with randomization disabled)
      // If hashes differ, it's Tor with randomization enabled
      const allIdentical = hashes[0] === hashes[1] && hashes[1] === hashes[2];
      const allDifferent = hashes[0] !== hashes[1] && hashes[1] !== hashes[2];

      // Randomization = all different, which is suspicious on Tor
      return allDifferent;
    } catch {
      return false;
    }
  }

  /**
   * Detect high network latency (characteristic of Tor)
   */
  private checkHighLatency(): boolean {
    // Measure response time to a lightweight resource
    const startTime = performance.now();

    // This is a simple check - real implementation would need actual network measurement
    // For now, we check if performance.timing suggests high latency
    if (performance.timing && performance.timing.responseEnd > 0) {
      const totalTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      // Tor typically adds 2-6+ seconds of latency
      return totalTime > 3000;  // Very conservative estimate
    }

    return false;
  }

  /**
   * Check for timing precision reduction (Tor clamps to 100ms)
   */
  private checkTimingAnomaly(): boolean {
    // Tor reduces timing precision to prevent timing attacks
    const times = [];

    for (let i = 0; i < 5; i++) {
      times.push(performance.now());
    }

    // Check if times are suspiciously rounded to 100ms
    const roundedTo100 = times.every(t => {
      const remainder = t % 100;
      return remainder < 10 || remainder > 90;  // Very close to 100ms multiple
    });

    return roundedTo100;
  }

  /**
   * Check for limited font availability
   */
  private checkLimitedFonts(): boolean {
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New',
      'Georgia', 'Trebuchet MS', 'Impact',  // Common fonts
      'Papyrus', 'Comic Sans MS', 'Brush Script MT'  // Less common
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const baseFont = '72px Arial';
    ctx.font = baseFont;
    const baseWidth = ctx.measureText('The quick brown fox jumps over the lazy dog').width;

    let availableFonts = 0;

    for (const font of testFonts) {
      try {
        ctx.font = `72px "${font}", Arial`;
        const width = ctx.measureText('The quick brown fox jumps over the lazy dog').width;

        // If width differs, font is available
        if (Math.abs(width - baseWidth) > 5) {
          availableFonts++;
        }
      } catch {
        // Font test failed
      }
    }

    // Tor typically has access to fewer fonts
    // Less than 5 different fonts available is suspicious
    return availableFonts < 5;
  }

  /**
   * Calculate overall confidence score and detected methods
   */
  private calculateConfidence(indicators: TorIndicators): { confidence: number; detectedMethods: string[] } {
    const detectedMethods: string[] = [];
    let score = 0;
    const weights: { [key: string]: number } = {
      fixedCores: 25,           // Very strong indicator
      fixedMemory: 20,          // Strong indicator
      genericUA: 20,            // Strong but can be spoofed
      forcedEnUS: 15,           // Moderate - locale mismatches common
      torCommonResolution: 15,  // Moderate - many false positives
      webGLBlocked: 20,         // Strong indicator
      webGLGeneric: 15,         // Moderate
      canvasRandomized: 12,     // Weak to moderate
      uaConsistency: 15,        // Moderate
      highLatency: 10,          // Weak - hard to measure accurately
      timingAnomaly: 12,        // Moderate
      limitedFonts: 10,         // Weak - many systems have limited fonts
      resolutionRounded: 10     // Weak - many systems have rounded resolutions
    };

    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if ((indicators as any)[key]) {
        score += weight;
        detectedMethods.push(key);
      }
      totalWeight += weight;
    }

    const confidence = Math.round((score / totalWeight) * 100);

    return { confidence, detectedMethods };
  }

  /**
   * Simple hash function for array data
   */
  private hashArray(data: Uint8ClampedArray | ArrayBuffer): string {
    let hash = 0;
    const bytes = new Uint8Array(data as ArrayBuffer);

    for (let i = 0; i < Math.min(bytes.length, 100); i++) {
      const byte = bytes[i];
      hash = ((hash << 5) - hash) + byte;
      hash = hash & hash;  // Convert to 32bit integer
    }

    return hash.toString(36);
  }
}
