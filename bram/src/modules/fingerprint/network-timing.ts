/**
 * Network Timing Fingerprinting Module
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 * Demonstrates how network latency patterns can fingerprint connections.
 * Research on RTT-based fingerprinting (Aroma 2025 paper).
 *
 * Entropy: ~8 bits | Stability: 75% | Hardware-based: No
 * Proxy-Resistant: PARTIAL (latency patterns change but remain measurable)
 */

import { ModuleInterface } from '../../types';

export class NetworkTimingModule implements ModuleInterface {
  name = 'network-timing';
  entropy = 8;
  stability = 75;
  hardwareBased = false;

  isAvailable(): boolean {
    return typeof fetch !== 'undefined' && typeof performance !== 'undefined';
  }

  async collect(): Promise<any> {
    const measurements = await this.measureRTT();

    return {
      minRTT: measurements.minRTT,
      maxRTT: measurements.maxRTT,
      avgRTT: measurements.avgRTT,
      stdDev: measurements.stdDev,
      variance: measurements.variance,

      // Pattern analysis
      rttPattern: this.analyzePattern(measurements.sorted),
      jitter: this.calculateJitter(measurements.measurements),

      // Proxy indicators
      highLatency: measurements.avgRTT > 150,
      suspiciousVariance: measurements.variance > 100,

      // Hash for fingerprinting
      timingSignature: this.hashPattern(measurements.measurements)
    };
  }

  private async measureRTT(): Promise<any> {
    const measurements: number[] = [];
    const testCount = 10;

    // Measure latency to a lightweight resource
    for (let i = 0; i < testCount; i++) {
      const start = performance.now();

      try {
        await fetch(window.location.origin + '/favicon.ico?' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache'
        });

        measurements.push(performance.now() - start);
      } catch (e) {
        // Network error
      }

      // Small delay between measurements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / measurements.length;
    const stdDev = Math.sqrt(variance);

    return {
      measurements,
      sorted,
      minRTT: sorted[0],
      maxRTT: sorted[sorted.length - 1],
      avgRTT: avg,
      variance,
      stdDev
    };
  }

  private analyzePattern(sorted: number[]): string {
    if (sorted.length < 3) return 'insufficient-data';

    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    return `Q1:${q1.toFixed(1)},Med:${median.toFixed(1)},Q3:${q3.toFixed(1)}`;
  }

  private calculateJitter(measurements: number[]): number {
    if (measurements.length < 2) return 0;

    let totalJitter = 0;
    for (let i = 1; i < measurements.length; i++) {
      totalJitter += Math.abs(measurements[i] - measurements[i - 1]);
    }

    return totalJitter / (measurements.length - 1);
  }

  private hashPattern(measurements: number[]): string {
    const pattern = measurements.map(m => Math.round(m)).join(',');
    let hash = 0;

    for (let i = 0; i < pattern.length; i++) {
      hash = ((hash << 5) - hash) + pattern.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
