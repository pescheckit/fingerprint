import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebRTCCollector } from '../../../src/collectors/network/webrtc.js';
import { Collector } from '../../../src/collector.js';

describe('WebRTCCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new WebRTCCollector();
  });

  afterEach(() => {
    delete globalThis.RTCPeerConnection;
    delete globalThis.webkitRTCPeerConnection;
  });

  it('extends Collector with correct name and description', () => {
    expect(collector).toBeInstanceOf(Collector);
    expect(collector.name).toBe('webrtc');
    expect(collector.description).toBe('WebRTC local IP leak');
  });

  it('has empty deviceKeys', () => {
    expect(collector.deviceKeys).toEqual([]);
  });

  it('returns supported: false when RTCPeerConnection is unavailable', async () => {
    const result = await collector.collect();
    expect(result.supported).toBe(false);
    expect(result.localIPs).toEqual([]);
    expect(result.publicIPs).toEqual([]);
    expect(result.localSubnet).toBeNull();
  });

  it('collects local and public IPs from ICE candidates', async () => {
    let onIceCandidate;

    const mockPC = {
      onicecandidate: null,
      createDataChannel: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock' }),
      setLocalDescription: vi.fn().mockImplementation(() => {
        // Fire ICE candidates after setLocalDescription
        setTimeout(() => {
          onIceCandidate({ candidate: { candidate: 'candidate:1 1 udp 2122260223 192.168.1.100 54321 typ host' } });
          onIceCandidate({ candidate: { candidate: 'candidate:2 1 udp 1686052607 203.0.113.5 12345 typ srflx' } });
          onIceCandidate({ candidate: null }); // End of candidates
        }, 10);
      }),
      close: vi.fn(),
    };

    Object.defineProperty(mockPC, 'onicecandidate', {
      get() { return onIceCandidate; },
      set(fn) { onIceCandidate = fn; },
    });

    globalThis.RTCPeerConnection = vi.fn().mockReturnValue(mockPC);

    const result = await collector.collect();

    expect(result.supported).toBe(true);
    expect(result.localIPs).toContain('192.168.1.100');
    expect(result.publicIPs).toContain('203.0.113.5');
    expect(result.localSubnet).toBe('192.168.1');
    expect(mockPC.close).toHaveBeenCalled();
  });

  it('correctly identifies local IPs', () => {
    expect(collector._isLocalIP('192.168.1.1')).toBe(true);
    expect(collector._isLocalIP('10.0.0.1')).toBe(true);
    expect(collector._isLocalIP('172.16.0.1')).toBe(true);
    expect(collector._isLocalIP('172.20.0.1')).toBe(true);
    expect(collector._isLocalIP('172.31.255.255')).toBe(true);
    expect(collector._isLocalIP('127.0.0.1')).toBe(true);
    expect(collector._isLocalIP('169.254.1.1')).toBe(true);
    expect(collector._isLocalIP('8.8.8.8')).toBe(false);
    expect(collector._isLocalIP('203.0.113.5')).toBe(false);
  });

  it('extracts localSubnet from first local IP', async () => {
    let onIceCandidate;

    const mockPC = {
      onicecandidate: null,
      createDataChannel: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock' }),
      setLocalDescription: vi.fn().mockImplementation(() => {
        setTimeout(() => {
          onIceCandidate({ candidate: { candidate: 'candidate:1 1 udp 2122260223 10.0.5.42 54321 typ host' } });
          onIceCandidate({ candidate: null });
        }, 10);
      }),
      close: vi.fn(),
    };

    Object.defineProperty(mockPC, 'onicecandidate', {
      get() { return onIceCandidate; },
      set(fn) { onIceCandidate = fn; },
    });

    globalThis.RTCPeerConnection = vi.fn().mockReturnValue(mockPC);

    const result = await collector.collect();

    expect(result.localSubnet).toBe('10.0.5');
  });

  it('resolves via timeout when no end-of-candidates signal', async () => {
    vi.useFakeTimers();

    const mockPC = {
      onicecandidate: null,
      createDataChannel: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock' }),
      setLocalDescription: vi.fn(),
      close: vi.fn(),
    };

    globalThis.RTCPeerConnection = vi.fn().mockReturnValue(mockPC);

    const promise = collector.collect();

    await vi.advanceTimersByTimeAsync(3000);

    const result = await promise;
    expect(result.supported).toBe(true);
    expect(result.localIPs).toEqual([]);
    expect(result.localSubnet).toBeNull();
    expect(mockPC.close).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
