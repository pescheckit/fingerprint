import { Collector } from '../../collector.js';

export class FontMetricsCollector extends Collector {
  constructor() {
    super('fontMetrics', 'Font rendering metrics via measureText', []);
  }

  async collect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return { supported: false };

    const fonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
    const testStrings = [
      'mmmmmmmmmmlli',
      'The quick brown fox jumps over the lazy dog',
      'WMwi1lI0O',
      ',.;:!?(){}[]',
    ];
    const sizes = ['12px', '16px', '24px'];

    const metrics = {};

    for (const font of fonts) {
      for (const size of sizes) {
        ctx.font = `${size} ${font}`;
        for (const str of testStrings) {
          const m = ctx.measureText(str);
          const key = `${font}_${size}_${str.substring(0, 8)}`;
          metrics[key] = {
            width: Math.round(m.width * 100) / 100,
            // Advanced metrics if available
            ...(m.actualBoundingBoxAscent !== undefined && {
              ascent: Math.round(m.actualBoundingBoxAscent * 100) / 100,
              descent: Math.round(m.actualBoundingBoxDescent * 100) / 100,
            }),
          };
        }
      }
    }

    return { supported: true, metrics };
  }
}
