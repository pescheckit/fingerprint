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
// Removed: protocols, battery, media-devices (blocked/unreliable on Tor)
// Server-side module excluded from browser build (uses Node.js APIs)
// export { ServerTorDetectionModule, createTorDetectionMiddleware } from './tor-detection-server';
