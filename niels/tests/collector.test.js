import { describe, it, expect } from 'vitest';
import { Collector } from '../src/collector.js';

describe('Collector base class', () => {
  it('stores name and description', () => {
    const c = new Collector('test', 'A test collector');
    expect(c.name).toBe('test');
    expect(c.description).toBe('A test collector');
  });

  it('throws if collect() is not implemented', async () => {
    const c = new Collector('test', 'A test collector');
    await expect(c.collect()).rejects.toThrow('collect() not implemented');
  });
});
