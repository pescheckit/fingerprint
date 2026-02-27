/**
 * Cross-Browser Device Fingerprinting Module
 * Generates hardware-based device ID that persists across browsers
 * Uses only hardware-level signals that don't change between browsers
 */
export default class CrossBrowserModule {
  static name = 'cross-browser';
  static entropy = 15; // Very high for hardware combination
  static hardware = true;

  static isAvailable() {
    return true;
  }

  static async collect() {
    // Collect only hardware-based signals
    const hardwareSignals = {
      // GPU (most reliable across browsers)
      gpu: await this.getGPUInfo(),

      // CPU
      cpu: this.getCPUInfo(),

      // Screen hardware
      screen: this.getScreenHardware(),

      // Audio hardware
      audio: await this.getAudioHardware(),

      // System info
      system: this.getSystemInfo()
    };

    // Generate hardware-based device ID
    const deviceId = this.generateDeviceId(hardwareSignals);

    return {
      deviceId,
      hardwareSignals,
      confidence: this.calculateConfidence(hardwareSignals)
    };
  }

  static async getGPUInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
      };
    } catch (e) {
      return null;
    }
  }

  static getCPUInfo() {
    return {
      cores: navigator.hardwareConcurrency,
      // Could add CPU benchmarking here
    };
  }

  static getScreenHardware() {
    return {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    };
  }

  static async getAudioHardware() {
    // Audio processing characteristics are hardware-specific
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();

      const info = {
        sampleRate: ctx.sampleRate,
        maxChannels: ctx.destination.maxChannelCount,
        channelCount: ctx.destination.channelCount
      };

      ctx.close();
      return info;
    } catch (e) {
      return null;
    }
  }

  static getSystemInfo() {
    return {
      platform: navigator.platform,
      deviceMemory: navigator.deviceMemory,
      // OS info
      oscpu: navigator.oscpu
    };
  }

  static generateDeviceId(signals) {
    // Create a stable hash from hardware signals only
    const hardwareString = JSON.stringify({
      gpu: signals.gpu?.unmaskedRenderer || signals.gpu?.renderer,
      cpu: signals.cpu?.cores,
      screen: `${signals.screen.width}x${signals.screen.height}`,
      audio: signals.audio?.sampleRate,
      memory: signals.system?.deviceMemory
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < hardwareString.length; i++) {
      hash = ((hash << 5) - hash) + hardwareString.charCodeAt(i);
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  static calculateConfidence(signals) {
    let score = 0;

    // GPU is most reliable
    if (signals.gpu?.unmaskedRenderer) score += 40;
    else if (signals.gpu?.renderer) score += 25;

    // CPU cores
    if (signals.cpu?.cores) score += 15;

    // Screen hardware
    if (signals.screen?.width && signals.screen?.height) score += 20;

    // Audio
    if (signals.audio?.sampleRate) score += 15;

    // System memory
    if (signals.system?.deviceMemory) score += 10;

    return Math.min(100, score);
  }
}
