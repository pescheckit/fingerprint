/**
 * Device UUID Modules (Tor-Resistant, Cross-Browser)
 *
 * These modules provide ~27 bits of entropy that work across ALL browsers,
 * including Tor Browser. They use hardware capabilities that cannot be
 * easily spoofed or randomized.
 *
 * Key characteristics:
 * - Tor-resistant: Works even with Tor's anonymization
 * - Cross-browser stable: Same device = same ID across browsers
 * - Hardware-based: Uses actual device capabilities
 * - Privacy-preserving: No PII, only hardware signatures
 */

export { FloatingPointModule } from './floating-point';
export { WebGLCapabilitiesModule } from './webgl-capabilities';
export { PerformanceRatioModule } from './performance-ratios';
export { ScreenAspectModule } from './screen-aspect';
export { HardwareModule } from './hardware';
export { CanvasPropertiesModule } from './canvas-properties';
export { TouchCapabilitiesModule } from './touch-capabilities';
export { ColorDepthModule } from './color-depth';
