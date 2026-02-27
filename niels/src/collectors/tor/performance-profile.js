import { Collector } from '../../collector.js';

export class PerformanceProfileCollector extends Collector {
  constructor() {
    super('performanceProfile', 'Relative performance profiling of operations', []);
  }

  async collect() {
    const iterations = 10000;

    const sortTime = this._measure(() => {
      const arr = Array.from({length: 100}, (_, i) => 100 - i);
      arr.sort((a, b) => a - b);
    }, iterations);

    const mathTime = this._measure(() => {
      Math.sin(0.5) * Math.cos(0.5) + Math.tan(0.5);
    }, iterations);

    const regexTime = this._measure(() => {
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test('test@example.com');
    }, iterations);

    const jsonTime = this._measure(() => {
      JSON.parse(JSON.stringify({ a: 1, b: [2, 3], c: { d: 'test' } }));
    }, iterations);

    // Use the fastest as baseline (1.0) and compute ratios
    const baseline = Math.min(sortTime, mathTime, regexTime, jsonTime);

    return {
      sortRatio: baseline > 0 ? Math.round((sortTime / baseline) * 100) / 100 : 0,
      mathRatio: baseline > 0 ? Math.round((mathTime / baseline) * 100) / 100 : 0,
      regexRatio: baseline > 0 ? Math.round((regexTime / baseline) * 100) / 100 : 0,
      jsonRatio: baseline > 0 ? Math.round((jsonTime / baseline) * 100) / 100 : 0,
    };
  }

  _measure(fn, iterations) {
    const now = typeof performance !== 'undefined' && performance.now
      ? () => performance.now()
      : () => Date.now();

    const start = now();
    for (let i = 0; i < iterations; i++) fn();
    return now() - start;
  }
}
