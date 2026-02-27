import { describe, it, expect } from 'vitest';
import { Fingerprinter } from '../src/fingerprinter.js';
import { Collector } from '../src/collector.js';

class FakeCollector extends Collector {
  constructor(name, data) {
    super(name, `Fake ${name}`);
    this._data = data;
  }

  async collect() {
    return this._data;
  }
}

class FailingCollector extends Collector {
  constructor() {
    super('failing', 'Always fails');
  }

  async collect() {
    throw new Error('Something went wrong');
  }
}

describe('Fingerprinter', () => {
  it('collects signals from all registered collectors', async () => {
    const fp = new Fingerprinter();
    fp.register(new FakeCollector('a', { value: 1 }));
    fp.register(new FakeCollector('b', { value: 2 }));

    const result = await fp.collect();

    expect(result.hash).toBeTruthy();
    expect(result.signals).toHaveLength(2);
    expect(result.signals[0].name).toBe('a');
    expect(result.signals[0].data).toEqual({ value: 1 });
    expect(result.signals[0].error).toBeNull();
    expect(result.signals[0].duration).toBeGreaterThanOrEqual(0);
    expect(result.signals[1].name).toBe('b');
  });

  it('handles collector errors gracefully', async () => {
    const fp = new Fingerprinter();
    fp.register(new FailingCollector());

    const result = await fp.collect();

    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].data).toBeNull();
    expect(result.signals[0].error).toBe('Something went wrong');
  });

  it('produces a consistent hash for same inputs', async () => {
    const fp1 = new Fingerprinter();
    fp1.register(new FakeCollector('x', { val: 'hello' }));

    const fp2 = new Fingerprinter();
    fp2.register(new FakeCollector('x', { val: 'hello' }));

    const r1 = await fp1.collect();
    const r2 = await fp2.collect();

    expect(r1.hash).toBe(r2.hash);
  });

  it('produces different hashes for different inputs', async () => {
    const fp1 = new Fingerprinter();
    fp1.register(new FakeCollector('x', { val: 'hello' }));

    const fp2 = new Fingerprinter();
    fp2.register(new FakeCollector('x', { val: 'world' }));

    const r1 = await fp1.collect();
    const r2 = await fp2.collect();

    expect(r1.hash).not.toBe(r2.hash);
  });

  it('supports method chaining for register()', () => {
    const fp = new Fingerprinter();
    const result = fp.register(new FakeCollector('a', {}));
    expect(result).toBe(fp);
  });
});
