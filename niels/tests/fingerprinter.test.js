import { describe, it, expect, vi } from 'vitest';
import { Fingerprinter } from '../src/fingerprinter.js';
import { Collector } from '../src/collector.js';

vi.mock('../src/persistence/visitor-id-manager.js', () => ({
  VisitorIdManager: class {
    async resolve() {
      return { visitorId: 'mock-uuid-1234-5678-9abc', isNew: true, sources: [] };
    }
  },
}));

class FakeCollector extends Collector {
  constructor(name, data, deviceKeys = []) {
    super(name, `Fake ${name}`, deviceKeys);
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

    expect(result.fingerprint).toBeTruthy();
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

    expect(r1.fingerprint).toBe(r2.fingerprint);
  });

  it('produces different hashes for different inputs', async () => {
    const fp1 = new Fingerprinter();
    fp1.register(new FakeCollector('x', { val: 'hello' }));

    const fp2 = new Fingerprinter();
    fp2.register(new FakeCollector('x', { val: 'world' }));

    const r1 = await fp1.collect();
    const r2 = await fp2.collect();

    expect(r1.fingerprint).not.toBe(r2.fingerprint);
  });

  it('supports method chaining for register()', () => {
    const fp = new Fingerprinter();
    const result = fp.register(new FakeCollector('a', {}));
    expect(result).toBe(fp);
  });

  it('produces a device ID from tagged keys', async () => {
    const fp = new Fingerprinter();
    fp.register(new FakeCollector('screen', { width: 1920, height: 1080, ua: 'Chrome' }, ['width', 'height']));
    fp.register(new FakeCollector('canvas', { rendered: 'abc123' }));

    const result = await fp.collect();

    expect(result.fingerprint).toBeTruthy();
    expect(result.deviceId).toBeTruthy();
    expect(result.deviceId).not.toBe(result.fingerprint);

    // deviceData should only have tagged keys
    expect(result.signals[0].deviceData).toEqual({ width: 1920, height: 1080 });
    // canvas has no device keys
    expect(result.signals[1].deviceData).toBeNull();
  });

  it('device ID is same regardless of browser-specific signals', async () => {
    const fp1 = new Fingerprinter();
    fp1.register(new FakeCollector('hw', { cores: 8, ua: 'Chrome/120' }, ['cores']));

    const fp2 = new Fingerprinter();
    fp2.register(new FakeCollector('hw', { cores: 8, ua: 'Firefox/121' }, ['cores']));

    const r1 = await fp1.collect();
    const r2 = await fp2.collect();

    // Full hashes differ (different ua)
    expect(r1.fingerprint).not.toBe(r2.fingerprint);
    // Device IDs match (same cores)
    expect(r1.deviceId).toBe(r2.deviceId);
  });

  it('device ID is null when no collectors have device keys', async () => {
    const fp = new Fingerprinter();
    fp.register(new FakeCollector('canvas', { data: 'abc' }));

    const result = await fp.collect();

    expect(result.fingerprint).toBeTruthy();
    expect(result.deviceId).toBeNull();
  });

  it('returns the full result shape with all expected fields', async () => {
    const fp = new Fingerprinter();
    fp.register(new FakeCollector('screen', { width: 1920 }, ['width']));

    const result = await fp.collect();

    expect(result).toHaveProperty('fingerprint');
    expect(result).toHaveProperty('deviceId');
    expect(result).toHaveProperty('visitorId');
    expect(result).toHaveProperty('readableFingerprint');
    expect(result).toHaveProperty('readableDeviceId');
    expect(result).toHaveProperty('serverMatch', null);
    expect(result).toHaveProperty('signals');

    expect(typeof result.fingerprint).toBe('string');
    expect(typeof result.readableFingerprint).toBe('string');
    expect(result.readableFingerprint).toMatch(/^.+-.+-.+-.+$/);
    expect(typeof result.readableDeviceId).toBe('string');
    expect(result.readableDeviceId).toMatch(/^.+-.+-.+-.+$/);
  });

  it('includes visitorId from VisitorIdManager', async () => {
    const fp = new Fingerprinter();
    fp.register(new FakeCollector('a', { value: 1 }));

    const result = await fp.collect();

    expect(result.visitorId).toBe('mock-uuid-1234-5678-9abc');
  });

  it('disables visitor ID when options.visitorId is false', async () => {
    const fp = new Fingerprinter({ visitorId: false });
    fp.register(new FakeCollector('a', { value: 1 }));

    const result = await fp.collect();

    expect(result.visitorId).toBeNull();
  });
});
