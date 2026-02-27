/**
 * Color Depth Module (Tor-Resistant)
 * Display color capabilities
 * Entropy: ~1-2 bits | Stability: 98% | Hardware-based: Yes
 */

import { ModuleInterface } from '../../types';

export class ColorDepthModule implements ModuleInterface {
  name = 'color-depth';
  entropy = 2;
  stability = 98;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof screen !== 'undefined';
  }

  collect(): any {
    return {
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,

      // Additional color-related capabilities
      supportsHDR: this.testHDRSupport(),
      supportsWideGamut: this.testWideGamutSupport(),

      // Color profile (derived from depth)
      colorProfile: this.getColorProfile(screen.colorDepth),

      signature: `${screen.colorDepth}-${screen.pixelDepth}`
    };
  }

  private testHDRSupport(): boolean {
    return (screen as any).luminance !== undefined ||
           window.matchMedia('(dynamic-range: high)').matches;
  }

  private testWideGamutSupport(): boolean {
    return window.matchMedia('(color-gamut: p3)').matches ||
           window.matchMedia('(color-gamut: rec2020)').matches;
  }

  private getColorProfile(depth: number): string {
    if (depth >= 30) return 'deep-color';
    if (depth === 24) return 'true-color';
    if (depth === 16) return 'high-color';
    return 'standard';
  }
}
