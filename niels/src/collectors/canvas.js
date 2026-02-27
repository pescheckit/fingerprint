import { Collector } from '../collector.js';

/**
 * Collects a canvas fingerprint using text measurement metrics and rendered images.
 *
 * Text metrics (measureText) are used for the hash because they are NOT affected
 * by Firefox's canvas noise injection in private browsing mode. The rendered
 * images are kept as display-only fields (prefixed with '_') for visual inspection.
 *
 * Different browsers/GPUs/OS produce different text metrics due to font rendering
 * engine differences, providing a high-entropy fingerprint signal.
 */
export class CanvasCollector extends Collector {
  constructor() {
    super('canvas', 'Canvas rendering fingerprint');
  }

  async collect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { supported: false, textMetrics: null, _geometryImage: null, _textImage: null };
    }

    return {
      supported: true,
      textMetrics: this.#collectTextMetrics(ctx),
      _geometryImage: this.#drawGeometry(canvas, ctx),
      _textImage: this.#drawText(canvas, ctx),
    };
  }

  /**
   * Collect text measurement metrics across multiple fonts.
   * These are deterministic per browser/OS and NOT affected by canvas noise.
   */
  #collectTextMetrics(ctx) {
    const testString = 'mmmmmmmmmmlli Fingerprint <!@#$>';
    const fonts = [
      '18px Arial',
      'italic 14px Georgia',
      'bold 16px monospace',
      '20px sans-serif',
      '16px serif',
      '12px Courier New',
      'bold 14px Helvetica',
      '18px Times New Roman',
    ];

    const metrics = {};
    for (const font of fonts) {
      ctx.font = font;
      const m = ctx.measureText(testString);
      metrics[font] = {
        width: m.width,
        ascent: m.actualBoundingBoxAscent ?? null,
        descent: m.actualBoundingBoxDescent ?? null,
      };
    }
    return metrics;
  }

  /**
   * Draws geometry-only shapes (arcs, rectangles, gradients).
   * Returns a data URL for display only (prefixed with _ so excluded from hash).
   */
  #drawGeometry(canvas, ctx) {
    canvas.width = 200;
    canvas.height = 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, 180, 180);

    ctx.beginPath();
    ctx.arc(100, 100, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.fill();

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
   * Returns a data URL for display only (prefixed with _ so excluded from hash).
   */
  #drawText(canvas, ctx) {
    canvas.width = 300;
    canvas.height = 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
