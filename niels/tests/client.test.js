import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FingerprintClient } from '../src/client.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function makeCollectorResult() {
  return {
    fingerprint: 'fp-hash-abc',
    deviceId: 'device-hash-xyz',
    visitorId: 'visitor-123',
    signals: [
      {
        name: 'audio',
        data: { sampleSum: 124.567 },
      },
      {
        name: 'timezone',
        data: { timezone: 'Europe/Amsterdam', timezoneOffset: -60 },
      },
      {
        name: 'navigator',
        data: {
          languages: ['en', 'nl'],
          hardwareConcurrency: 8,
          deviceMemory: 16,
          platform: 'Linux x86_64',
        },
      },
      {
        name: 'screen',
        data: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          touchSupport: false,
        },
      },
    ],
  };
}

describe('FingerprintClient', () => {
  let client;

  beforeEach(() => {
    client = new FingerprintClient('http://localhost:3001');
    mockFetch.mockReset();
    localStorageMock.clear();
  });

  describe('constructor', () => {
    it('stores the endpoint without trailing slash', () => {
      const c = new FingerprintClient('http://localhost:3001/');
      expect(c.endpoint).toBe('http://localhost:3001');
    });

    it('keeps the endpoint as-is if no trailing slash', () => {
      const c = new FingerprintClient('http://localhost:3001');
      expect(c.endpoint).toBe('http://localhost:3001');
    });
  });

  describe('_extractSignals', () => {
    it('extracts all signal data from collector result', () => {
      const result = makeCollectorResult();
      const signals = client._extractSignals(result);

      expect(signals.fingerprint).toBe('fp-hash-abc');
      expect(signals.deviceId).toBe('device-hash-xyz');
      expect(signals.visitorId).toBe('visitor-123');
      expect(signals.audioSum).toBe(124.567);
      expect(signals.timezone).toBe('Europe/Amsterdam');
      expect(signals.timezoneOffset).toBe(-60);
      expect(signals.languages).toBe('["en","nl"]');
      expect(signals.hardwareConcurrency).toBe(8);
      expect(signals.deviceMemory).toBe(16);
      expect(signals.platform).toBe('Linux x86_64');
      expect(signals.screenWidth).toBe(1920);
      expect(signals.screenHeight).toBe(1080);
      expect(signals.colorDepth).toBe(24);
      expect(signals.touchSupport).toBe(0);
    });

    it('converts touchSupport true to 1', () => {
      const result = makeCollectorResult();
      result.signals.find(s => s.name === 'screen').data.touchSupport = true;
      const signals = client._extractSignals(result);
      expect(signals.touchSupport).toBe(1);
    });

    it('handles missing signal data gracefully', () => {
      const result = {
        fingerprint: 'fp-hash',
        deviceId: 'dev-hash',
        visitorId: 'v-123',
        signals: [
          { name: 'audio', data: null },
          { name: 'unknown', data: { foo: 'bar' } },
        ],
      };
      const signals = client._extractSignals(result);
      expect(signals.fingerprint).toBe('fp-hash');
      expect(signals.audioSum).toBeUndefined();
      expect(signals.timezone).toBeUndefined();
    });
  });

  describe('submit', () => {
    it('posts extracted signals to /api/fingerprint', async () => {
      const serverResponse = {
        matchedVisitorId: 'visitor-123',
        confidence: 0.95,
        matchedSignals: ['audio', 'timezone'],
        visitorId: 'visitor-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serverResponse,
      });

      const result = await client.submit(makeCollectorResult());

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/fingerprint');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.fingerprint).toBe('fp-hash-abc');
      expect(body.audioSum).toBe(124.567);

      expect(result).toEqual(serverResponse);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.submit(makeCollectorResult())).rejects.toThrow('Server error: 500');
    });
  });

  describe('resolveEtag', () => {
    it('sends If-None-Match header from localStorage', async () => {
      localStorageMock.setItem('_fp_etag', '"stored-etag"');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ visitorId: 'visitor-from-etag' }),
        headers: new Headers({ ETag: '"stored-etag"' }),
      });

      const visitorId = await client.resolveEtag();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/etag-store');
      expect(options.headers['If-None-Match']).toBe('"stored-etag"');
      expect(visitorId).toBe('visitor-from-etag');
    });

    it('saves etag to localStorage on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ visitorId: 'v-123' }),
        headers: new Headers({ ETag: '"new-etag"' }),
      });

      await client.resolveEtag();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('_fp_etag', '"new-etag"');
    });

    it('returns null on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 204,
      });

      const result = await client.resolveEtag();
      expect(result).toBeNull();
    });

    it('sends empty string when no etag in localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 204,
      });

      await client.resolveEtag();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['If-None-Match']).toBe('');
    });
  });

  describe('storeEtag', () => {
    it('posts visitorId and stores returned etag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stored: true, etag: '"visitor-456"' }),
      });

      const result = await client.storeEtag('visitor-456');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/etag-store');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ visitorId: 'visitor-456' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('_fp_etag', '"visitor-456"');
    });

    it('returns false on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await client.storeEtag('visitor-456');
      expect(result).toBe(false);
    });
  });
});
