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
  WebGLModule,
  CanvasModule,
  AudioModule,
  ScreenModule,
  HardwareModule,
  SystemModule,
  ProtocolsModule
} from './modules';
