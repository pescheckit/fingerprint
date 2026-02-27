import { Collector } from '../collector.js';

/**
 * Collects a canvas fingerprint by rendering text, shapes, and gradients
 * onto a hidden canvas element, then extracting the resulting image data.
 *
 * Different browsers/GPUs/OS render these operations with subtle differences,
 * producing a high-entropy fingerprint signal.
 */
export class CanvasCollector extends Collector {
  constructor() {
    super('canvas', 'Canvas rendering fingerprint');
  }

  async collect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { supported: false, geometry: null, text: null };
    }

    return {
      supported: true,
      geometry: this.#drawGeometry(canvas, ctx),
      text: this.#drawText(canvas, ctx),
    };
  }

  /**
   * Draws geometry-only shapes (arcs, rectangles, gradients).
   * These tend to be more stable across sessions than text rendering.
   */
  #drawGeometry(canvas, ctx) {
    canvas.width = 200;
    canvas.height = 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient-filled rectangle
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, 180, 180);

    // Overlapping arc
    ctx.beginPath();
    ctx.arc(100, 100, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.fill();

    // Stroked triangle
    ctx.beginPath();
    ctx.moveTo(50, 150);
    ctx.lineTo(150, 150);
    ctx.lineTo(100, 50);
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toDataURL();
  }

  /**
   * Draws text with various fonts and an emoji.
   * Text rendering is highly variable across environments, giving high entropy.
   */
  #drawText(canvas, ctx) {
    canvas.width = 300;
    canvas.height = 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rendered text with specific fonts
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ff6600';
    ctx.fillText('Fingerprint 🖐️', 10, 30);

    ctx.font = 'italic 14px Georgia';
    ctx.fillStyle = '#33ccff';
    ctx.strokeText('Canvas Test', 10, 60);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('<!@#$%^&*()>', 10, 85);

    return canvas.toDataURL();
  }
}
