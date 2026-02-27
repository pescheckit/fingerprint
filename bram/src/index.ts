/**
 * Device Thumbmark - Cross-Browser Device Detection
 *
 * Main export for library usage
 */

export { DeviceThumbmark } from './device-thumbmark';
export type {
  DeviceThumbmarkResult,
  DeviceThumbmarkOptions,
  ModuleResult,
  ModuleInterface
} from './types';

// Re-export modules for advanced usage
export {
  // Device modules (Tor-resistant)
  FloatingPointModule,
  WebGLCapabilitiesModule,
  PerformanceRatioModule,
  ScreenAspectModule,
  HardwareModule,
  CanvasPropertiesModule,
  TouchCapabilitiesModule,
  ColorDepthModule,

  // Fingerprint modules (browser-specific)
  WebGLModule,
  WebGLRenderModule,
  CanvasModule,
  AudioModule,
  ScreenModule,
  PerformanceModule,
  SystemModule,

  // Detection modules
  TorDetectionModule
} from './modules';
