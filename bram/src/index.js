/**
 * ThumbmarkJS - Advanced Modular Browser Fingerprinting
 *
 * A comprehensive fingerprinting library with support for:
 * - Basic signals (Canvas, WebGL, Audio, Fonts, Navigator, Screen, Timezone)
 * - Protocol handler detection
 * - VPN/Tor/Proxy detection
 * - Cross-browser device matching
 */

import { Fingerprinter } from './core/fingerprinter.js';

// Import all modules
import CanvasModule from './modules/canvas.js';
import WebGLModule from './modules/webgl.js';
import NavigatorModule from './modules/navigator.js';
import ScreenModule from './modules/screen.js';
import TimezoneModule from './modules/timezone.js';
import AudioModule from './modules/audio.js';
import FontsModule from './modules/fonts.js';
import ProtocolsModule from './modules/protocols.js';
import VPNDetectorModule from './modules/vpn-detector.js';
import TorDetectorModule from './modules/tor-detector.js';
import CrossBrowserModule from './modules/cross-browser.js';

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

// Export for UMD
export default ThumbmarkJS;
