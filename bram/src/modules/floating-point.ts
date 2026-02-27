/**
 * Floating-Point Precision Module
 * CPU-specific FP implementation differences
 * Entropy: ~5 bits | Stability: 95% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class FloatingPointModule implements ModuleInterface {
  name = 'floating-point';
  entropy = 5;
  stability = 95;
  hardwareBased = true;

  isAvailable(): boolean {
    return true;
  }

  collect(): any {
    const results: Record<string, string> = {};

    // Mathematical constants (precision varies by CPU)
    results['pi'] = Math.PI.toString();
    results['e'] = Math.E.toString();
    results['sqrt2'] = Math.sqrt(2).toString();
    results['ln2'] = Math.LN2.toString();

    // Trigonometric operations
    results['sin_pi_4'] = Math.sin(Math.PI / 4).toString();
    results['cos_pi_3'] = Math.cos(Math.PI / 3).toString();
    results['tan_pi_6'] = Math.tan(Math.PI / 6).toString();

    // Division precision (known variation point)
    results['one_div_3'] = (1 / 3).toString();
    results['one_div_7'] = (1 / 7).toString();

    // TypedArray precision
    results['float32'] = this.testFloat32Precision();
    results['float64'] = this.testFloat64Precision();

    return {
      precisionTests: results,
      hash: this.hashPrecision(results)
    };
  }

  private testFloat32Precision(): string {
    const arr = new Float32Array([1/3, Math.PI, Math.sqrt(2)]);
    let hash = 0;

    for (let i = 0; i < arr.length; i++) {
      const bits = new Uint32Array(new Float32Array([arr[i]]).buffer);
      hash = ((hash << 5) - hash) + bits[0];
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private testFloat64Precision(): string {
    const arr = new Float64Array([1/3, Math.PI, Math.sqrt(2)]);
    let hash = 0;

    const uint32View = new Uint32Array(arr.buffer);
    for (let i = 0; i < uint32View.length; i++) {
      hash = ((hash << 5) - hash) + uint32View[i];
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private hashPrecision(obj: Record<string, string>): string {
    const sorted = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
    let hash = 0;

    for (const [key, value] of sorted) {
      const str = key + value;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
    }

    return Math.abs(hash).toString(36);
  }
}
