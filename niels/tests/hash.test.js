import { describe, it, expect } from 'vitest';
import { hashSignals } from '../src/hash.js';

describe('hashSignals', () => {
  it('produces a 64-char hex string (SHA-256)', async () => {
    const hash = await hashSignals([
      { name: 'test', data: { value: 'hello' } },
    ]);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('ignores signals with null data', async () => {
    const hash1 = await hashSignals([
      { name: 'a', data: { v: 1 } },
    ]);

    const hash2 = await hashSignals([
      { name: 'a', data: { v: 1 } },
      { name: 'b', data: null },
    ]);

    expect(hash1).toBe(hash2);
  });

  it('is deterministic for same input', async () => {
    const signals = [{ name: 'x', data: { a: 1, b: 2 } }];
    const h1 = await hashSignals(signals);
    const h2 = await hashSignals(signals);
    expect(h1).toBe(h2);
  });

  it('excludes keys starting with _ from hash', async () => {
    const hash1 = await hashSignals([
      { name: 'test', data: { value: 'hello' } },
    ]);

    const hash2 = await hashSignals([
      { name: 'test', data: { value: 'hello', _image: 'data:image/png;base64,huge' } },
    ]);

    expect(hash1).toBe(hash2);
  });

  it('properly hashes nested objects', async () => {
    const hash1 = await hashSignals([
      { name: 'test', data: { metrics: { width: 100, height: 50 } } },
    ]);

    const hash2 = await hashSignals([
      { name: 'test', data: { metrics: { width: 100, height: 99 } } },
    ]);

    // Different nested values should produce different hashes
    expect(hash1).not.toBe(hash2);
  });

  it('sorts keys at all nesting levels for stability', async () => {
    const hash1 = await hashSignals([
      { name: 'test', data: { a: 1, b: { x: 10, y: 20 } } },
    ]);

    // Same data but with keys in different insertion order
    const hash2 = await hashSignals([
      { name: 'test', data: { b: { y: 20, x: 10 }, a: 1 } },
    ]);

    expect(hash1).toBe(hash2);
  });
});
