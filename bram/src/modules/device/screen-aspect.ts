/**
 * Screen Aspect Ratio Module (Tor-Resistant)
 * Uses resolution patterns, not exact dimensions
 * Entropy: ~3 bits | Stability: 92% | Hardware-based: Yes
 *
 * Tor rounds to 100s, but aspect ratio and patterns still leak device info!
 */

import { ModuleInterface } from '../../types';

export class ScreenAspectModule implements ModuleInterface {
  name = 'screen-aspect';
  entropy = 3;
  stability = 92;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof screen !== 'undefined';
  }

  collect(): any {
    const w = screen.width;
    const h = screen.height;
    const ratio = w / h;

    return {
      // Aspect ratio (even rounded, reveals device)
      aspectRatio: ratio.toFixed(4),
      ratioClass: this.classifyRatio(ratio),

      // GCD reveals physical resolution characteristics
      gcd: this.gcd(w, h),

      // Diagonal pixels (unique signature)
      diagonalPixels: Math.round(Math.sqrt(w * w + h * h)),

      // Megapixels (device class indicator)
      megapixels: ((w * h) / 1000000).toFixed(2),

      // Remainders (leak through rounding)
      widthMod: w % 100,
      heightMod: h % 100,

      // Orientation characteristics
      orientation: screen.orientation?.type || 'unknown',
      angle: screen.orientation?.angle || 0,

      // Signature from pattern
      signature: this.generateSignature(w, h, ratio)
    };
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private classifyRatio(ratio: number): string {
    const ratios: [number, string][] = [
      [16/9, '16:9'],
      [16/10, '16:10'],
      [4/3, '4:3'],
      [21/9, '21:9'],
      [32/9, '32:9'],
      [5/4, '5:4'],
      [3/2, '3:2']
    ];

    for (const [target, name] of ratios) {
      if (Math.abs(ratio - target) < 0.05) return name;
    }

    if (ratio > 2) return 'ultrawide';
    if (ratio < 1) return 'portrait';
    return 'custom:' + ratio.toFixed(2);
  }

  private generateSignature(w: number, h: number, ratio: number): string {
    const data = `${this.gcd(w, h)}_${ratio.toFixed(3)}_${w%100}_${h%100}`;
    let hash = 0;

    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
