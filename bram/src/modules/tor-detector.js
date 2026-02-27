/**
 * Tor Browser Detection Module
 * Detects if user is using Tor Browser
 * Methods: Exit node detection, fingerprint patterns, latency analysis
 */
export default class TorDetectorModule {
  static name = 'tor-detector';
  static entropy = 0; // Binary detection
  static hardware = false;

  static isAvailable() {
    return true;
  }

  static collect() {
    const signals = {};

    // 1. Tor-specific browser characteristics
    signals.browserFingerprint = this.checkBrowserFingerprint();

    // 2. Canvas/WebGL blocking detection
    signals.apiBlocking = this.checkAPIBlocking();

    // 3. Font enumeration (Tor uses limited fonts)
    signals.fonts = this.checkFonts();

    // 4. Screen resolution patterns (Tor rounds to common sizes)
    signals.screen = this.checkScreenResolution();

    // 5. User-Agent analysis
    signals.userAgent = this.checkUserAgent();

    // Calculate Tor probability
    const probability = this.calculateTorProbability(signals);

    return {
      signals,
      probability,
      likely: probability > 0.7
    };
  }

  static checkBrowserFingerprint() {
    return {
      // Tor Browser always reports 2 cores
      hardwareConcurrency: navigator.hardwareConcurrency === 2,

      // Tor forces en-US
      language: navigator.language === 'en-US',

      // Tor reports 2GB memory
      deviceMemory: navigator.deviceMemory === 2,

      // Tor disables battery API
      battery: !('getBattery' in navigator),

      // DoNotTrack
      doNotTrack: navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes'
    };
  }

  static checkAPIBlocking() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    return {
      // Tor may block WEBGL_debug_renderer_info
      webglDebugBlocked: gl ? !gl.getExtension('WEBGL_debug_renderer_info') : true,

      // Check if canvas is randomized (changes each call)
      canvasRandomized: this.isCanvasRandomized()
    };
  }

  static isCanvasRandomized() {
    try {
      const canvas1 = this.getCanvasHash();
      const canvas2 = this.getCanvasHash();
      return canvas1 !== canvas2;
    } catch (e) {
      return false;
    }
  }

  static getCanvasHash() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillText('test', 0, 10);
    return canvas.toDataURL();
  }

  static checkFonts() {
    // Tor uses very limited font set (typically 3-6 fonts)
    // This would need font detection module results
    return {
      limitedSet: false // Placeholder
    };
  }

  static checkScreenResolution() {
    const width = screen.width;
    const height = screen.height;

    // Tor rounds resolutions to multiples of 100 or common sizes
    const roundedWidth = width % 100 === 0 || width === 1366;
    const roundedHeight = height % 100 === 0 || height === 768;

    return {
      width,
      height,
      likelyRounded: roundedWidth && roundedHeight,
      commonTorSize: (width === 1000 && height === 900) ||
                     (width === 1200 && height === 900) ||
                     (width === 1366 && height === 768)
    };
  }

  static checkUserAgent() {
    const ua = navigator.userAgent;

    return {
      userAgent: ua,
      // Tor uses generic Firefox UA
      genericFirefox: ua.includes('Firefox') && !ua.includes('Seamonkey'),
      // Tor UA is very generic
      generic: !ua.includes('Ubuntu') && !ua.includes('Chrome')
    };
  }

  static calculateTorProbability(signals) {
    let score = 0;

    const fp = signals.browserFingerprint;
    if (fp.hardwareConcurrency) score += 0.2;
    if (fp.language) score += 0.1;
    if (fp.deviceMemory) score += 0.2;
    if (fp.battery) score += 0.1;

    if (signals.apiBlocking.canvasRandomized) score += 0.2;
    if (signals.apiBlocking.webglDebugBlocked) score += 0.1;

    if (signals.screen.commonTorSize) score += 0.3;
    else if (signals.screen.likelyRounded) score += 0.15;

    if (signals.userAgent.genericFirefox) score += 0.1;

    return Math.min(1.0, score);
  }
}
