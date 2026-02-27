// Math floating-point fingerprint - different CPU/browser implementations
// produce slightly different results for trig functions
export function getMathFingerprint() {
  return {
    acos: Math.acos(0.5),
    asin: Math.asin(0.5),
    atan: Math.atan(2),
    cos: Math.cos(21 * Math.LN2),
    sin: Math.sin(21 * Math.LN2),
    tan: Math.tan(21 * Math.LN2),
    largeCos: Math.cos(1e10),
    largeSin: Math.sin(1e10),
    largeTan: Math.tan(1e10),
    exp: Math.exp(1),
    log: Math.log(10),
    sqrt: Math.sqrt(2),
    cbrt: Math.cbrt(100),
    cosh: Math.cosh(1),
    sinh: Math.sinh(1),
    tanh: Math.tanh(1),
    expm1: Math.expm1(1),
    log1p: Math.log1p(10),
    log2: Math.log2(10),
    log10: Math.log10(2),
  };
}
