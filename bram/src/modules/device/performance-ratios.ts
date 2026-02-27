/**
 * Performance Ratio Module (Tor-Resistant)
 * Uses RELATIVE timing ratios, not absolute times
 * Entropy: ~4 bits | Stability: 85% | Hardware-based: Yes
 *
 * Tor clamps timing to 100ms, but RATIOS reveal CPU architecture!
 */

import { ModuleInterface } from '../../types';

export class PerformanceRatioModule implements ModuleInterface {
  name = 'perf-ratios';
  entropy = 4;
  stability = 85;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof performance !== 'undefined';
  }

  collect(): any {
    // Run multiple test types
    const tests = {
      math: this.timeMathOps(),
      array: this.timeArrayOps(),
      string: this.timeStringOps(),
      object: this.timeObjectOps()
    };

    // Calculate ratios (Tor-resistant!)
    const ratios = {
      mathToArray: this.safeRatio(tests.math, tests.array),
      stringToObject: this.safeRatio(tests.string, tests.object),
      mathToString: this.safeRatio(tests.math, tests.string),
      arrayToObject: this.safeRatio(tests.array, tests.object)
    };

    return {
      rawTimes: tests,
      ratios,
      ratioPattern: this.hashRatios(ratios)
    };
  }

  private timeMathOps(): number {
    const start = performance.now();
    let result = 0;

    for (let i = 0; i < 10000; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }

    return performance.now() - start;
  }

  private timeArrayOps(): number {
    const start = performance.now();
    const arr = Array.from({ length: 10000 }, (_, i) => i);
    arr.sort(() => Math.random() - 0.5);
    arr.reduce((a, b) => a + b, 0);
    return performance.now() - start;
  }

  private timeStringOps(): number {
    const start = performance.now();
    let str = '';

    for (let i = 0; i < 1000; i++) {
      str += String.fromCharCode(65 + (i % 26));
    }

    str.split('').reverse().join('');
    return performance.now() - start;
  }

  private timeObjectOps(): number {
    const start = performance.now();
    const objects = [];

    for (let i = 0; i < 1000; i++) {
      objects.push({ x: i, y: i * 2, z: i * 3 });
    }

    JSON.stringify(objects);
    return performance.now() - start;
  }

  private safeRatio(a: number, b: number): number {
    if (b === 0) return 0;
    return Math.round((a / b) * 1000) / 1000;
  }

  private hashRatios(ratios: Record<string, number>): string {
    const str = Object.values(ratios).map(r => r.toFixed(3)).join('|');
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
