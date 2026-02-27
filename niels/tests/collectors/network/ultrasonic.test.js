import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UltrasonicCollector } from '../../../src/collectors/network/ultrasonic.js';
import { Collector } from '../../../src/collector.js';

describe('UltrasonicCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new UltrasonicCollector();
  });

  afterEach(() => {
    collector.destroy();
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('ultrasonic');
    expect(collector.description).toBe('Ultrasonic audio pairing beacon');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns idle mode from collect()', async () => {
    const result = await collector.collect();

    expect(result.mode).toBe('idle');
    expect(result).toHaveProperty('supported');
    expect(result).toHaveProperty('audioContextSupported');
    expect(result).toHaveProperty('micSupported');
  });

  it('reports AudioContext support correctly', async () => {
    const result = await collector.collect();

    // In test env, AudioContext may or may not exist
    expect(typeof result.supported).toBe('boolean');
    expect(typeof result.audioContextSupported).toBe('boolean');
    expect(result.supported).toBe(result.audioContextSupported);
  });

  it('converts pairing code to 16 bits correctly', () => {
    // 0 → all zeros
    expect(collector._codeToBits(0)).toEqual(new Array(16).fill(0));

    // 65535 (0xFFFF) → all ones
    expect(collector._codeToBits(65535)).toEqual(new Array(16).fill(1));

    // 42 = 0b0000000000101010
    const bits42 = collector._codeToBits(42);
    expect(bits42).toHaveLength(16);
    expect(bits42[10]).toBe(1); // bit 5
    expect(bits42[12]).toBe(1); // bit 3
    expect(bits42[14]).toBe(1); // bit 1
  });

  it('round-trips pairing code through bits', () => {
    for (const code of [0, 1, 42, 255, 1024, 65535]) {
      const bits = collector._codeToBits(code);
      const result = collector._bitsToCode(bits);
      expect(result).toBe(code);
    }
  });

  it('converts bits back to code correctly', () => {
    // All zeros
    expect(collector._bitsToCode(new Array(16).fill(0))).toBe(0);

    // All ones
    expect(collector._bitsToCode(new Array(16).fill(1))).toBe(65535);
  });

  it('destroy cleans up state', () => {
    collector.destroy();
    expect(collector._emitting).toBe(false);
    expect(collector._receiving).toBe(false);
  });

  it('startReceiving returns not detected when AudioContext unsupported', async () => {
    // Remove AudioContext from globals
    const origAC = globalThis.AudioContext;
    const origWebkitAC = globalThis.webkitAudioContext;
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;

    try {
      const result = await collector.startReceiving(100);
      expect(result.detected).toBe(false);
      expect(result.pairingCode).toBeNull();
      expect(result.confidence).toBe(0);
    } finally {
      if (origAC) globalThis.AudioContext = origAC;
      if (origWebkitAC) globalThis.webkitAudioContext = origWebkitAC;
    }
  });
});
