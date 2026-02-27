/**
 * Helper utilities for device detection
 */

export async function safely<T>(
  fn: () => Promise<T> | T,
  fallback: T | null = null
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.warn('Module collection failed:', error);
    return fallback;
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateTotalEntropy(modules: { entropy: number }[]): number {
  return modules.reduce((sum, m) => sum + m.entropy, 0);
}

export function calculateAverageStability(modules: { stability: number }[]): number {
  if (modules.length === 0) return 0;
  const sum = modules.reduce((acc, m) => acc + m.stability, 0);
  return Math.round(sum / modules.length);
}

export function calculateConfidence(entropy: number, stability: number): number {
  // Confidence based on both entropy and stability
  const entropyScore = Math.min(100, (entropy / 40) * 100);
  const stabilityScore = stability;
  return Math.round((entropyScore * 0.6) + (stabilityScore * 0.4));
}
