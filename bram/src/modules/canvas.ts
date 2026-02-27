/**
 * Canvas Module - GPU rendering fingerprint
 * Entropy: ~8 bits | Stability: 90% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class CanvasModule implements ModuleInterface {
  name = 'canvas';
  entropy = 8;
  stability = 90;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof document !== 'undefined';
  }

  collect(): any {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Draw complex scene to maximize GPU differences
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 240, 60);
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(0.5, '#e74c3c');
    gradient.addColorStop(1, '#9013fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 240, 60);

    // Text with subpixel rendering (GPU-dependent)
    ctx.font = '18px "Arial", "Helvetica", sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.fillText('Device@2026', 10, 40);

    // Emoji (rendering varies by GPU)
    ctx.font = '20px Arial';
    ctx.fillText('🖥️🔒', 150, 45);

    // Geometric shapes
    ctx.beginPath();
    ctx.arc(200, 30, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();

    // Extract hash
    const dataUrl = canvas.toDataURL();

    return {
      hash: this.simpleHash(dataUrl),
      length: dataUrl.length,
      // Get actual pixel data for more entropy
      pixelHash: this.getPixelHash(ctx)
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getPixelHash(ctx: CanvasRenderingContext2D): string {
    try {
      const imageData = ctx.getImageData(0, 0, 10, 10);
      const pixels = Array.from(imageData.data).slice(0, 100);
      return this.simpleHash(pixels.join(','));
    } catch {
      return 'blocked';
    }
  }
}
