/**
 * Screen Properties Module
 * Entropy: ~5 bits
 * Stability: Medium-High
 * Hardware-based: Yes (physical display)
 */
export default class ScreenModule {
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
