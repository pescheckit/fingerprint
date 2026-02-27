/**
 * Canvas Properties Module (Tor-Resistant)
 * Uses canvas CAPABILITIES, not rendering output
 * Entropy: ~2 bits | Stability: 95% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class CanvasPropertiesModule implements ModuleInterface {
  name = 'canvas-properties';
  entropy = 2;
  stability = 95;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof document !== 'undefined';
  }

  collect(): any {
    const canvas = document.createElement('canvas');

    // Test different context types (capabilities, not rendering!)
    const contexts = {
      '2d': !!canvas.getContext('2d'),
      'webgl': !!canvas.getContext('webgl'),
      'webgl2': !!canvas.getContext('webgl2'),
      'bitmaprenderer': !!canvas.getContext('bitmaprenderer')
    };

    // Canvas size limits (hardware-dependent)
    const ctx2d = canvas.getContext('2d');

    return {
      contexts,
      maxCanvasSize: this.testMaxCanvasSize(),
      imageSmoothingSupported: ctx2d ? 'imageSmoothingEnabled' in ctx2d : false,
      willReadFrequently: this.testWillReadFrequently(),
      signature: this.generateSignature(contexts)
    };
  }

  private testMaxCanvasSize(): number {
    // Binary search for max canvas size (GPU memory-dependent)
    let max = 32768;
    let min = 4096;

    while (min < max) {
      const mid = Math.floor((min + max) / 2);
      const canvas = document.createElement('canvas');

      try {
        canvas.width = mid;
        canvas.height = mid;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          min = mid + 1;
        } else {
          max = mid;
        }
      } catch {
        max = mid;
      }
    }

    return min - 1;
  }

  private testWillReadFrequently(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      return !!ctx;
    } catch {
      return false;
    }
  }

  private generateSignature(contexts: Record<string, boolean>): string {
    const str = Object.entries(contexts)
      .filter(([, supported]) => supported)
      .map(([name]) => name)
      .join('|');

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
