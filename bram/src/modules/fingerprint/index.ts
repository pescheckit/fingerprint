/**
 * Fingerprint UUID Modules (Browser-Specific, Deep)
 *
 * These modules provide 70+ bits of entropy for deep browser fingerprinting.
 * They work best on normal browsers but may be spoofed/randomized on Tor.
 *
 * Key characteristics:
 * - Browser-specific: Creates unique fingerprints per browser
 * - Deep entropy: 70+ bits of identifying information
 * - Hardware-based: Primarily uses GPU/audio/timing signals
 * - Spoofable on Tor: Some values are randomized by Tor Browser
 */

export { WebGLModule } from './webgl';
export { WebGLRenderModule } from './webgl-render';
export { CanvasModule } from './canvas';
export { AudioModule } from './audio';
export { ScreenModule } from './screen';
export { PerformanceModule } from './performance';
export { SystemModule } from './system';

// Proxy-resistant modules (Educational/Research)
export { WebRTCLeakModule } from './webrtc-leak';
export { NetworkTimingModule } from './network-timing';
