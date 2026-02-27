import { Collector } from '../collector.js';

/**
 * Collects screen and display properties as fingerprint signals.
 *
 * Screen dimensions, color depth, pixel ratio, and the "screen frame"
 * (taskbar/dock size derived from the difference between total and
 * available screen area) combine into a medium-entropy signal that
 * varies across device configurations.
 */
export class ScreenCollector extends Collector {
  constructor() {
    super('screen', 'Screen and display properties', [
      'width', 'height', 'availWidth', 'availHeight',
      'colorDepth', 'devicePixelRatio', 'maxTouchPoints',
      'touchSupport', 'screenFrame',
    ]);
  }

  async collect() {
    const s = globalThis.screen || {};
    const w = globalThis.window || {};
    const n = globalThis.navigator || {};

    const width = s.width ?? null;
    const height = s.height ?? null;
    const availWidth = s.availWidth ?? null;
    const availHeight = s.availHeight ?? null;
    const colorDepth = s.colorDepth ?? null;
    const devicePixelRatio = w.devicePixelRatio ?? null;
    const maxTouchPoints = n.maxTouchPoints ?? 0;
    const touchSupport = 'ontouchstart' in globalThis;

    // screenFrame: the pixels consumed by OS chrome (taskbar, dock, menu bar).
    // Calculated as the difference between total and available dimensions.
    const screenFrame = (width != null && height != null && availWidth != null && availHeight != null)
      ? {
          top: height - availHeight,
          left: width - availWidth,
          right: width - availWidth,
          bottom: height - availHeight,
        }
      : null;

    return {
      width,
      height,
      availWidth,
      availHeight,
      colorDepth,
      devicePixelRatio,
      maxTouchPoints,
      touchSupport,
      screenFrame,
    };
  }
}
