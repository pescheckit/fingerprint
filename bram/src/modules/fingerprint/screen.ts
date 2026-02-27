/**
 * Screen Hardware Module - Physical display characteristics
 * Entropy: ~8 bits | Stability: 95% | Hardware-based: Yes
 */

import { ModuleInterface } from '../../types';

export class ScreenModule implements ModuleInterface {
  name = 'screen';
  entropy = 8;
  stability = 95;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof screen !== 'undefined';
  }

  collect(): any {
    return {
      // Physical screen dimensions (hardware-specific)
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,

      // Color capabilities (hardware)
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,

      // Pixel ratio (hardware + OS)
      devicePixelRatio: window.devicePixelRatio,

      // Orientation
      orientation: screen.orientation ? {
        type: screen.orientation.type,
        angle: screen.orientation.angle
      } : null,

      // Additional display properties
      isExtended: (screen as any).isExtended || false,

      // Calculated properties
      aspectRatio: (screen.width / screen.height).toFixed(3),
      totalPixels: screen.width * screen.height,

      // Available screen space (accounting for OS elements)
      availableArea: screen.availWidth * screen.availHeight
    };
  }
}
