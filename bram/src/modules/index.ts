/**
 * Export all modules
 */

export { WebGLModule } from './webgl';
export { WebGLRenderModule } from './webgl-render';
export { CanvasModule } from './canvas';
export { AudioModule } from './audio';
export { ScreenModule } from './screen';
export { HardwareModule } from './hardware';
export { SystemModule } from './system';
export { PerformanceModule } from './performance';
export { TorDetectionModule } from './tor-detection';
export { FloatingPointModule } from './floating-point';
export { WebGLCapabilitiesModule } from './webgl-capabilities';
export { PerformanceRatioModule } from './performance-ratios';
export { ScreenAspectModule } from './screen-aspect';
export { CanvasPropertiesModule } from './canvas-properties';
export { TouchCapabilitiesModule } from './touch-capabilities';
export { ColorDepthModule } from './color-depth';
// Removed: protocols, battery, media-devices (blocked/unreliable on Tor)
// Server-side module excluded from browser build (uses Node.js APIs)
// export { ServerTorDetectionModule, createTorDetectionMiddleware } from './tor-detection-server';
