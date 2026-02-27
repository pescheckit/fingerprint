/**
 * Font Detection Module
 *
 * SCHOOL RESEARCH PROJECT - Educational Purposes
 * Demonstrates how installed fonts can be detected for device fingerprinting.
 * Research use: Understanding OS and user customization detection
 *
 * Entropy: ~7 bits | Stability: 92% | Hardware-based: No
 */

import { ModuleInterface } from '../../types';

export class FontsModule implements ModuleInterface {
  name = 'fonts';
  entropy = 7;
  stability = 92;
  hardwareBased = false;

  private baseFonts = ['monospace', 'sans-serif', 'serif'];

  private testFonts = [
    // Windows fonts
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Tahoma', 'Calibri',

    // macOS fonts
    'Helvetica', 'Helvetica Neue', 'Geneva', 'Monaco', 'Menlo',

    // Linux fonts
    'DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Droid Sans',

    // Common fonts
    'Segoe UI', 'Roboto', 'Open Sans'
  ];

  isAvailable(): boolean {
    return typeof document !== 'undefined';
  }

  collect(): any {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    // Measure base font widths
    const baseSizes: Record<string, number> = {};
    for (const baseFont of this.baseFonts) {
      ctx.font = `${testSize} ${baseFont}`;
      baseSizes[baseFont] = ctx.measureText(testString).width;
    }

    // Detect available fonts
    const detectedFonts: string[] = [];
    for (const font of this.testFonts) {
      let detected = false;

      for (const baseFont of this.baseFonts) {
        ctx.font = `${testSize} "${font}", ${baseFont}`;
        const width = ctx.measureText(testString).width;

        if (width !== baseSizes[baseFont]) {
          detected = true;
          break;
        }
      }

      if (detected) {
        detectedFonts.push(font);
      }
    }

    return {
      fonts: detectedFonts,
      count: detectedFonts.length,
      signature: this.hashFonts(detectedFonts),

      // Educational: Explain what this means
      research: {
        windowsFonts: detectedFonts.filter(f => ['Calibri', 'Segoe UI'].includes(f)).length,
        macFonts: detectedFonts.filter(f => ['Helvetica Neue', 'Menlo'].includes(f)).length,
        linuxFonts: detectedFonts.filter(f => ['Ubuntu', 'DejaVu Sans'].includes(f)).length,
        likelyOS: this.guessOS(detectedFonts)
      }
    };
  }

  private hashFonts(fonts: string[]): string {
    const str = fonts.sort().join('|');
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private guessOS(fonts: string[]): string {
    const hasWindows = fonts.some(f => ['Calibri', 'Segoe UI'].includes(f));
    const hasMac = fonts.some(f => ['Helvetica Neue', 'Menlo'].includes(f));
    const hasLinux = fonts.some(f => ['Ubuntu', 'DejaVu Sans'].includes(f));

    if (hasWindows && !hasMac && !hasLinux) return 'Windows';
    if (hasMac && !hasWindows) return 'macOS';
    if (hasLinux) return 'Linux';
    return 'Unknown';
  }
}
