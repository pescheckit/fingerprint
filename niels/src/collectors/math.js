import { Collector } from '../collector.js';

/**
 * Collects results of math operations as fingerprint signals.
 *
 * Floating-point arithmetic can produce subtly different results across
 * browser engines and platforms due to differences in their underlying
 * math library implementations (e.g. fdlibm vs system libm). These tiny
 * variations make the combined set of results a useful fingerprint signal.
 *
 * Because the differences are engine-dependent (not hardware/OS-dependent),
 * deviceKeys is empty — these values are NOT stable across browsers.
 */
export class MathCollector extends Collector {
  constructor() {
    super('math', 'Math operation fingerprint', []);
  }

  async collect() {
    return {
      tanNeg1e300: Math.tan(-1e300),
      acos: Math.acos(0.123456789),
      asin: Math.asin(0.123456789),
      atan: Math.atan(0.123456789),
      atan2: Math.atan2(0.123456789, 0.987654321),
      sinNeg1e300: Math.sin(-1e300),
      cosNeg1e300: Math.cos(-1e300),
      exp: Math.exp(1),
      log: Math.log(Math.PI),
      sqrt: Math.sqrt(2),
      powPiNeg100: Math.pow(Math.PI, -100),
      cosh: Math.cosh(1),
      sinh: Math.sinh(1),
      tanh: Math.tanh(1),
      expm1: Math.expm1(1),
      log1p: Math.log1p(0.5),
      cbrt: Math.cbrt(2),
    };
  }
}
