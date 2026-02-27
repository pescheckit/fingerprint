(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ThumbmarkJS = factory());
})(this, (function () { 'use strict';

  /**
   * MurmurHash3 implementation for fast, consistent hashing
   */
  function murmurhash3(key, seed = 0) {
    const remainder = key.length & 3;
    const bytes = key.length - remainder;
    let h1 = seed;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;
    let k1, h1b;

    while (i < bytes) {
      k1 =
        ((key.charCodeAt(i) & 0xff)) |
        ((key.charCodeAt(++i) & 0xff) << 8) |
        ((key.charCodeAt(++i) & 0xff) << 16) |
        ((key.charCodeAt(++i) & 0xff) << 24);
      ++i;

      k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
      h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
      case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      case 1: k1 ^= (key.charCodeAt(i) & 0xff);

      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return (h1 >>> 0).toString(36);
  }

  /**
   * Hash an object to a consistent string
   */
  function hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return murmurhash3(str);
  }

  /**
   * Utility functions for fingerprinting
   */


  async function safely(fn, fallback = null) {
    try {
      return await fn();
    } catch (e) {
      console.warn('Fingerprint collection failed:', e);
      return fallback;
    }
  }

  function calculateEntropy(components) {
    let bits = 0;

    if (components.canvas) bits += 5.7;
    if (components.webgl) bits += 7.0;
    if (components.audio) bits += 4.5;
    if (components.fonts?.length > 0) bits += 5.0;
    if (components.navigator) bits += 8.0;
    if (components.screen) bits += 5.0;
    if (components.timezone) bits += 3.5;
    if (components.protocols?.length > 0) bits += 6.0;
    if (components.storage) bits += 2.0;

    return bits;
  }

  function calculateConfidence(entropyBits) {
    const maxEntropy = 50;
    return Math.min(99.9, (entropyBits / maxEntropy) * 100);
  }

  /**
   * Core Fingerprinter - Orchestrates all modules
   */

  class Fingerprinter {
    constructor(modules = []) {
      this.modules = modules;
    }

    async generate() {
      const components = {};
      const metadata = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        moduleCount: 0,
        failedModules: []
      };

      // Collect from all modules
      for (const Module of this.modules) {
        const moduleName = Module.name;

        // Check if module is available
        if (Module.isAvailable && !Module.isAvailable()) {
          metadata.failedModules.push(`${moduleName} (not available)`);
          continue;
        }

        // Collect data
        const data = await safely(
          () => Module.collect(),
          null
        );

        if (data !== null) {
          components[moduleName] = data;
          metadata.moduleCount++;
        } else {
          metadata.failedModules.push(`${moduleName} (collection failed)`);
        }
      }

      // Calculate entropy and confidence
      const entropyBits = calculateEntropy(components);
      const confidence = calculateConfidence(entropyBits);

      // Generate fingerprint hash
      const visitorId = hashObject(components);

      return {
        visitorId,
        confidence,
        entropyBits,
        components,
        metadata
      };
    }

    async generateDeviceId() {
      // For cross-browser matching, use only hardware-based signals
      const hardwareModules = this.modules.filter(m =>
        m.hardware === true
      );

      const fingerprinter = new Fingerprinter(hardwareModules);
      const result = await fingerprinter.generate();

      return {
        deviceId: result.visitorId,
        confidence: result.confidence,
        components: result.components
      };
    }
  }

  /**
   * Canvas Fingerprinting Module
   * Entropy: ~5.7 bits
   * Stability: Very High
   * Hardware-based: Yes (GPU differences)
   */
  class CanvasModule {
    static name = 'canvas';
    static entropy = 5.7;
    static hardware = true;

    static isAvailable() {
      return typeof document !== 'undefined';
    }

    static collect() {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 240, 60);
      gradient.addColorStop(0, '#4a90e2');
      gradient.addColorStop(0.5, '#e74c3c');
      gradient.addColorStop(1, '#9013fe');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 240, 60);

      // Draw text with specific font
      ctx.font = '18px "Arial", "Helvetica", sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.fillText('ThumbmarkJS 🔍', 10, 40);

      // Add shapes for more entropy
      ctx.beginPath();
      ctx.arc(200, 30, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();

      // Add emoji (different rendering across systems)
      ctx.font = '20px Arial';
      ctx.fillText('🌐🔒', 150, 45);

      // Extract data URL
      const dataUrl = canvas.toDataURL();

      return {
        hash: this.hashString(dataUrl),
        length: dataUrl.length
      };
    }

    static hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    }
  }

  /**
   * WebGL Fingerprinting Module
   * Entropy: ~7 bits
   * Stability: Very High
   * Hardware-based: Yes (GPU identification)
   */
  class WebGLModule {
    static name = 'webgl';
    static entropy = 7.0;
    static hardware = true;

    static isAvailable() {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    }

    static collect() {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      const data = {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        extensions: gl.getSupportedExtensions(),

        // Hardware-specific parameters
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
      };

      // Unmasked vendor and renderer (most valuable for identification)
      if (debugInfo) {
        data.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        data.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }

      return data;
    }
  }

  /**
   * Navigator Properties Module
   * Entropy: ~8 bits
   * Stability: High
   * Hardware-based: Partial (hardware concurrency, device memory)
   */
  class NavigatorModule {
    static name = 'navigator';
    static entropy = 8.0;
    static hardware = true;

    static isAvailable() {
      return typeof navigator !== 'undefined';
    }

    static collect() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub,
        productSub: navigator.productSub,
        oscpu: navigator.oscpu,

        // Connection info
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        } : null,

        // Permissions
        permissions: typeof navigator.permissions !== 'undefined',

        // Media capabilities
        mediaDevices: typeof navigator.mediaDevices !== 'undefined',

        // Service worker support
        serviceWorker: 'serviceWorker' in navigator,

        // Geolocation support
        geolocation: 'geolocation' in navigator,

        // WebDriver detection
        webdriver: navigator.webdriver,

        // Plugins (deprecated but still available)
        plugins: Array.from(navigator.plugins || []).map(p => ({
          name: p.name,
          description: p.description,
          filename: p.filename
        }))
      };
    }
  }

  /**
   * Screen Properties Module
   * Entropy: ~5 bits
   * Stability: Medium-High
   * Hardware-based: Yes (physical display)
   */
  class ScreenModule {
    static name = 'screen';
    static entropy = 5.0;
    static hardware = true;

    static isAvailable() {
      return typeof screen !== 'undefined';
    }

    static collect() {
      return {
        // Screen dimensions
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,

        // Color
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,

        // Pixel ratio
        devicePixelRatio: window.devicePixelRatio,

        // Orientation
        orientation: screen.orientation ? {
          type: screen.orientation.type,
          angle: screen.orientation.angle
        } : null,

        // Window dimensions
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,

        // Screen position
        screenX: window.screenX,
        screenY: window.screenY,

        // Available screen space (excluding taskbar)
        availableScreenSize: {
          width: screen.availWidth,
          height: screen.availHeight
        },

        // Total screen size
        totalScreenSize: {
          width: screen.width,
          height: screen.height
        }
      };
    }
  }

  /**
   * Timezone and Locale Module
   * Entropy: ~3.5 bits
   * Stability: High
   * Hardware-based: No
   */
  class TimezoneModule {
    static name = 'timezone';
    static entropy = 3.5;
    static hardware = false;

    static isAvailable() {
      return true;
    }

    static collect() {
      const date = new Date();

      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: date.getTimezoneOffset(),

        // Locale information
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
        numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem,

        // Date formatting
        dateFormat: date.toLocaleDateString(),
        timeFormat: date.toLocaleTimeString(),

        // Language
        language: navigator.language,
        languages: navigator.languages,

        // Date string samples
        samples: {
          date: new Date(2026, 0, 1).toLocaleDateString(),
          time: new Date(2026, 0, 1, 13, 30, 45).toLocaleTimeString(),
          dateTime: new Date(2026, 0, 1, 13, 30, 45).toLocaleString()
        }
      };
    }
  }

  /**
   * Audio Fingerprinting Module
   * Entropy: ~4.5 bits
   * Stability: Very High
   * Hardware-based: Yes (audio processing hardware)
   */
  class AudioModule {
    static name = 'audio';
    static entropy = 4.5;
    static hardware = true;

    static isAvailable() {
      return typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
    }

    static async collect() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();

      try {
        // Create offline context for consistent results
        const offlineContext = new OfflineAudioContext(1, 44100, 44100);

        // Create oscillator (1kHz sine wave)
        const oscillator = offlineContext.createOscillator();
        oscillator.frequency.value = 1000;

        // Create dynamics compressor (introduces variations)
        const compressor = offlineContext.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        // Connect nodes
        oscillator.connect(compressor);
        compressor.connect(offlineContext.destination);

        // Start oscillator
        oscillator.start(0);

        // Render audio
        const audioBuffer = await offlineContext.startRendering();
        const channelData = audioBuffer.getChannelData(0);

        // Calculate fingerprint from audio data
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += Math.abs(channelData[i]);
        }

        // Get compressor properties (hardware-specific)
        const fingerprint = {
          sum: sum.toString(),
          hash: this.hashAudioData(channelData),
          sampleRate: audioContext.sampleRate,
          maxChannels: audioContext.destination.maxChannelCount,
          channelCount: audioContext.destination.channelCount,
          numberOfInputs: compressor.numberOfInputs,
          numberOfOutputs: compressor.numberOfOutputs,
          compressorReduction: compressor.reduction
        };

        audioContext.close();
        return fingerprint;

      } catch (e) {
        audioContext.close();
        throw e;
      }
    }

    static hashAudioData(data) {
      // Sample data points for faster hashing
      let hash = 0;
      const step = Math.floor(data.length / 50);
      for (let i = 0; i < data.length; i += step) {
        const value = Math.floor(data[i] * 1000000);
        hash = ((hash << 5) - hash) + value;
        hash = hash & hash;
      }
      return hash.toString(36);
    }
  }

  /**
   * Font Detection Module
   * Entropy: ~5 bits
   * Stability: Medium-High
   * Hardware-based: No (but system-level)
   */
  class FontsModule {
    static name = 'fonts';
    static entropy = 5.0;
    static hardware = false;

    static baseFonts = ['monospace', 'sans-serif', 'serif'];

    static testFonts = [
      // Common Windows fonts
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino Linotype', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
      'Tahoma', 'Calibri', 'Cambria', 'Consolas', 'Candara',

      // Common Mac fonts
      'Helvetica', 'Helvetica Neue', 'Geneva', 'Monaco', 'Menlo',
      'American Typewriter', 'Andale Mono', 'Apple Chancery',

      // Common Linux fonts
      'DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Droid Sans',

      // Other common fonts
      'Century Gothic', 'Franklin Gothic Medium', 'Optima',
      'Segoe UI', 'Lucida Console', 'Lucida Sans Unicode',
      'MS Sans Serif', 'MS Serif', 'Garamond', 'Bookman Old Style'
    ];

    static isAvailable() {
      return typeof document !== 'undefined';
    }

    static collect() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';

      // Measure base font widths
      const baseSizes = {};
      this.baseFonts.forEach(baseFont => {
        ctx.font = `${testSize} ${baseFont}`;
        baseSizes[baseFont] = ctx.measureText(testString).width;
      });

      // Test each font
      const detectedFonts = [];
      this.testFonts.forEach(font => {
        let detected = false;

        this.baseFonts.forEach(baseFont => {
          ctx.font = `${testSize} "${font}", ${baseFont}`;
          const size = ctx.measureText(testString).width;

          // If size differs from base, font is available
          if (size !== baseSizes[baseFont]) {
            detected = true;
          }
        });

        if (detected) {
          detectedFonts.push(font);
        }
      });

      return {
        fonts: detectedFonts,
        count: detectedFonts.length,
        hash: this.hashFonts(detectedFonts)
      };
    }

    static hashFonts(fonts) {
      const str = fonts.sort().join(',');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return hash.toString(36);
    }
  }

  /**
   * Protocol Handler Detection Module
   * Entropy: ~6 bits
   * Stability: Very High (users rarely uninstall apps)
   * Hardware-based: No (but device-level)
   */
  class ProtocolsModule {
    static name = 'protocols';
    static entropy = 6.0;
    static hardware = false;

    // Protocol handlers to test
    static protocols = {
      gaming: [
        { protocol: 'steam://', name: 'Steam' },
        { protocol: 'com.epicgames.launcher://', name: 'Epic Games' },
        { protocol: 'origin://', name: 'EA Origin' },
        { protocol: 'battlenet://', name: 'Battle.net' },
        { protocol: 'uplay://', name: 'Ubisoft Connect' }
      ],
      communication: [
        { protocol: 'discord://', name: 'Discord' },
        { protocol: 'slack://', name: 'Slack' },
        { protocol: 'zoommtg://', name: 'Zoom' },
        { protocol: 'msteams://', name: 'Microsoft Teams' },
        { protocol: 'skype://', name: 'Skype' },
        { protocol: 'tg://', name: 'Telegram' }
      ],
      development: [
        { protocol: 'vscode://', name: 'VS Code' },
        { protocol: 'idea://', name: 'IntelliJ IDEA' },
        { protocol: 'github-mac://', name: 'GitHub Desktop' },
        { protocol: 'gitkraken://', name: 'GitKraken' }
      ],
      media: [
        { protocol: 'spotify://', name: 'Spotify' },
        { protocol: 'itunes://', name: 'iTunes' },
        { protocol: 'vlc://', name: 'VLC' }
      ],
      crypto: [
        { protocol: 'metamask://', name: 'MetaMask' },
        { protocol: 'coinbase://', name: 'Coinbase' }
      ]
    };

    static isAvailable() {
      return typeof document !== 'undefined' && typeof window !== 'undefined';
    }

    static async collect() {
      const detected = [];
      const timeout = 1000; // 1 second timeout per protocol

      // Flatten all protocols
      const allProtocols = Object.values(this.protocols).flat();

      for (const { protocol, name } of allProtocols) {
        const isDetected = await this.testProtocol(protocol, timeout);
        if (isDetected) {
          detected.push(name);
        }
      }

      return {
        detected,
        count: detected.length
      };
    }

    static testProtocol(protocol, timeout) {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        let blurred = false;

        // Detect window blur (app launched)
        const onBlur = () => {
          blurred = true;
          cleanup();
          resolve(true);
        };

        // Cleanup function
        const cleanup = () => {
          window.removeEventListener('blur', onBlur);
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        };

        // Set timeout
        const timer = setTimeout(() => {
          cleanup();
          resolve(blurred);
        }, timeout);

        // Listen for blur
        window.addEventListener('blur', onBlur);

        // Try to open protocol
        try {
          iframe.contentWindow.location.href = protocol;
        } catch (e) {
          cleanup();
          clearTimeout(timer);
          resolve(false);
        }
      });
    }
  }

  /**
   * VPN Detection Module
   * Detects if user is behind a VPN
   * Methods: WebRTC leaks, timezone mismatches, IP analysis, latency patterns
   */
  class VPNDetectorModule {
    static name = 'vpn-detector';
    static entropy = 0; // Binary detection (yes/no)
    static hardware = false;

    static isAvailable() {
      return typeof RTCPeerConnection !== 'undefined';
    }

    static async collect() {
      const signals = {};

      // 1. WebRTC IP Leak Detection
      signals.webrtcLeak = await this.detectWebRTCLeak();

      // 2. Timezone vs Expected from IP (requires server-side IP lookup)
      signals.timezoneMismatch = this.detectTimezoneMismatch();

      // 3. DNS Leak Detection (requires server-side)
      // signals.dnsLeak = await this.detectDNSLeak();

      // 4. Latency Analysis (VPNs add latency)
      signals.latency = await this.measureLatency();

      // Calculate VPN probability
      const probability = this.calculateVPNProbability(signals);

      return {
        signals,
        probability,
        likely: probability > 0.5
      };
    }

    static async detectWebRTCLeak() {
      const ips = new Set();

      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.createDataChannel('');

        pc.onicecandidate = (e) => {
          if (!e.candidate) return;
          const ipMatch = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(e.candidate.candidate);
          if (ipMatch) ips.add(ipMatch[0]);
        };

        await pc.createOffer().then(offer => pc.setLocalDescription(offer));

        // Wait for ICE gathering
        await new Promise(resolve => setTimeout(resolve, 2000));

        pc.close();

        return {
          ips: Array.from(ips),
          count: ips.size,
          hasMultiple: ips.size > 1
        };
      } catch (e) {
        return {
          error: e.message,
          blocked: true
        };
      }
    }

    static detectTimezoneMismatch() {
      // Get browser timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset();

      // Note: Actual IP-based geolocation requires server-side lookup
      return {
        timezone,
        offset,
        // serverTimezone: null, // Would be filled by server
        // mismatch: false
      };
    }

    static async measureLatency() {
      const measurements = [];

      // Measure latency to external resource
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        try {
          await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
          const latency = performance.now() - start;
          measurements.push(latency);
        } catch (e) {
          // Ignore errors
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;

      return {
        measurements,
        average: avg,
        suspiciouslyHigh: avg > 150 // VPNs typically add 50-150ms
      };
    }

    static calculateVPNProbability(signals) {
      let score = 0;
      let factors = 0;

      // WebRTC leak detection
      if (signals.webrtcLeak?.blocked) {
        score += 0.3; // Blocking WebRTC is suspicious
        factors++;
      } else if (signals.webrtcLeak?.hasMultiple) {
        score += 0.2; // Multiple IPs might indicate VPN
        factors++;
      }

      // High latency
      if (signals.latency?.suspiciouslyHigh) {
        score += 0.4;
        factors++;
      }

      return factors > 0 ? score / factors : 0;
    }
  }

  /**
   * Tor Browser Detection Module
   * Detects if user is using Tor Browser
   * Methods: Exit node detection, fingerprint patterns, latency analysis
   */
  class TorDetectorModule {
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

  /**
   * Cross-Browser Device Fingerprinting Module
   * Generates hardware-based device ID that persists across browsers
   * Uses only hardware-level signals that don't change between browsers
   */
  class CrossBrowserModule {
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

  /**
   * ThumbmarkJS - Advanced Modular Browser Fingerprinting
   *
   * A comprehensive fingerprinting library with support for:
   * - Basic signals (Canvas, WebGL, Audio, Fonts, Navigator, Screen, Timezone)
   * - Protocol handler detection
   * - VPN/Tor/Proxy detection
   * - Cross-browser device matching
   */


  // Default modules (basic fingerprinting)
  const DEFAULT_MODULES = [
    CanvasModule,
    WebGLModule,
    NavigatorModule,
    ScreenModule,
    TimezoneModule,
    AudioModule,
    FontsModule
  ];

  // All available modules
  const ALL_MODULES = [
    ...DEFAULT_MODULES,
    ProtocolsModule,
    VPNDetectorModule,
    TorDetectorModule,
    CrossBrowserModule
  ];

  /**
   * ThumbmarkJS API
   */
  const ThumbmarkJS = {
    /**
     * Generate a complete fingerprint
     * @param {Object} options - Configuration options
     * @param {Array} options.modules - Array of modules to use (default: all)
     * @returns {Promise<Object>} Fingerprint result
     */
    async generate(options = {}) {
      const modules = options.modules || DEFAULT_MODULES;
      const fingerprinter = new Fingerprinter(modules);
      return await fingerprinter.generate();
    },

    /**
     * Generate fingerprint with all modules including advanced detection
     * @returns {Promise<Object>} Complete fingerprint
     */
    async generateComplete() {
      const fingerprinter = new Fingerprinter(ALL_MODULES);
      return await fingerprinter.generate();
    },

    /**
     * Generate device ID for cross-browser matching
     * Only uses hardware-based signals
     * @returns {Promise<Object>} Device fingerprint
     */
    async generateDeviceId() {
      const fingerprinter = new Fingerprinter([CrossBrowserModule]);
      return await fingerprinter.generate();
    },

    /**
     * Detect VPN usage
     * @returns {Promise<Object>} VPN detection result
     */
    async detectVPN() {
      const fingerprinter = new Fingerprinter([VPNDetectorModule]);
      const result = await fingerprinter.generate();
      return result.components['vpn-detector'];
    },

    /**
     * Detect Tor Browser
     * @returns {Promise<Object>} Tor detection result
     */
    async detectTor() {
      const fingerprinter = new Fingerprinter([TorDetectorModule]);
      const result = await fingerprinter.generate();
      return result.components['tor-detector'];
    },

    /**
     * Detect installed applications via protocol handlers
     * @returns {Promise<Object>} Protocol detection result
     */
    async detectProtocols() {
      const fingerprinter = new Fingerprinter([ProtocolsModule]);
      const result = await fingerprinter.generate();
      return result.components['protocols'];
    },

    // Export modules for custom usage
    modules: {
      Canvas: CanvasModule,
      WebGL: WebGLModule,
      Navigator: NavigatorModule,
      Screen: ScreenModule,
      Timezone: TimezoneModule,
      Audio: AudioModule,
      Fonts: FontsModule,
      Protocols: ProtocolsModule,
      VPNDetector: VPNDetectorModule,
      TorDetector: TorDetectorModule,
      CrossBrowser: CrossBrowserModule
    },

    // Presets
    presets: {
      DEFAULT: DEFAULT_MODULES,
      ALL: ALL_MODULES,
      HARDWARE_ONLY: [CanvasModule, WebGLModule, ScreenModule, AudioModule, CrossBrowserModule],
      DETECTION_ONLY: [VPNDetectorModule, TorDetectorModule, ProtocolsModule]
    }
  };

  return ThumbmarkJS;

}));
