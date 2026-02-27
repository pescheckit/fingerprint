/**
 * Utility functions for fingerprinting
 */

export function isAvailable(test) {
  try {
    return test();
  } catch (e) {
    return false;
  }
}

export async function safely(fn, fallback = null) {
  try {
    return await fn();
  } catch (e) {
    console.warn('Fingerprint collection failed:', e);
    return fallback;
  }
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateEntropy(components) {
  let bits = 0;

  if (components.canvas) bits += 5.7;
  if (components.webgl) bits += 7.0;
  if (components.audio) bits += 4.5;
  if (components.fonts?.length > 0) bits += 5.0;
  if (components.navigator) bits += 8.0;
  if (components.screen) bits += 5.0;
  if (components.timezone) bits += 3.5;
  if (components.protocols?.length > 0) bits += 6.0;
  if (components.storage) bits += 2.0;

  return bits;
}

export function calculateConfidence(entropyBits) {
  const maxEntropy = 50;
  return Math.min(99.9, (entropyBits / maxEntropy) * 100);
}
