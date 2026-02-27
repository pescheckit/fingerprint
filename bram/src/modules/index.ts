/**
 * DeviceCreep Modules - Organized by UUID Type
 *
 * DEVICE UUID (Tor-Resistant, Cross-Browser - 27 bits):
 * - Works across ALL browsers including Tor
 * - Uses hardware capabilities that can't be spoofed
 * - Same device = same ID regardless of browser
 *
 * FINGERPRINT UUID (Browser-Specific, Deep - 70+ bits):
 * - Deep browser fingerprinting
 * - Works best on normal browsers
 * - May be spoofed/randomized on Tor
 *
 * DETECTION (Special Environments):
 * - Tor Browser detection
 * - VPN/Proxy detection
 * - Anonymization tool identification
 */

// Device UUID modules (Tor-resistant, cross-browser)
export {
  FloatingPointModule,
  WebGLCapabilitiesModule,
  PerformanceRatioModule,
  ScreenAspectModule,
  HardwareModule,
  CanvasPropertiesModule,
  TouchCapabilitiesModule,
  ColorDepthModule
} from './device';

// Fingerprint UUID modules (browser-specific, deep)
export {
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
  ExtensionsModule,
  OffscreenCanvasModule,
  KeystrokeDynamicsModule,
  MouseDynamicsModule,
  WebAssemblyCPUModule,
  GamepadModule
} from './fingerprint';

// Detection modules
export {
  TorDetectionModule,
  VPNDetectorModule,
  ProxyDetectorModule
} from './detection';

// Note: Server-side modules (tor-detection-server) are excluded from browser build
// as they use Node.js APIs. Import directly if needed for server-side usage.
