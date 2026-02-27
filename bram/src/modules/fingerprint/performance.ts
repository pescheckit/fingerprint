/**
 * Performance/Timing Fingerprint - CPU and memory performance characteristics
 * Entropy: ~5 bits | Stability: 80% | Hardware-based: Yes
 *
 * Different CPUs have different performance characteristics
 */

import { ModuleInterface } from '../../types';

export class PerformanceModule implements ModuleInterface {
  name = 'performance';
  entropy = 5;
  stability = 80;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof performance !== 'undefined';
  }

  collect(): any {
    const timings: number[] = [];

    // Test 1: Math operations speed
    const mathStart = performance.now();
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    timings.push(performance.now() - mathStart);

    // Test 2: Array operations
    const arrayStart = performance.now();
    const arr = Array.from({ length: 10000 }, (_, i) => i);
    arr.sort(() => Math.random() - 0.5);
    arr.reduce((a, b) => a + b, 0);
    timings.push(performance.now() - arrayStart);

    // Test 3: String operations
    const stringStart = performance.now();
    let str = '';
    for (let i = 0; i < 1000; i++) {
      str += String.fromCharCode(65 + (i % 26));
    }
    str.split('').reverse().join('');
    timings.push(performance.now() - stringStart);

    // Test 4: Object creation
    const objectStart = performance.now();
    const objects = [];
    for (let i = 0; i < 1000; i++) {
      objects.push({ x: i, y: i * 2, z: i * 3 });
    }
    JSON.stringify(objects);
    timings.push(performance.now() - objectStart);

    // Performance memory info (if available)
    const memory = (performance as any).memory ? {
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize
    } : null;

    // Create fingerprint from timing patterns
    const timingPattern = timings.map(t => Math.round(t * 100) / 100);
    const timingHash = this.hashTimings(timingPattern);

    return {
      timings: timingPattern,
      timingHash,
      memory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      // Navigation timing (if available)
      navigationTiming: performance.timing ? {
        connectTime: performance.timing.connectEnd - performance.timing.connectStart,
        domComplete: performance.timing.domComplete - performance.timing.domLoading,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
      } : null
    };
  }

  private hashTimings(timings: number[]): string {
    let hash = 0;
    const str = timings.join(',');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
