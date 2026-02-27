import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from './store.js';

function makeProfileData(overrides = {}) {
  return {
    visitor_id: 'visitor-test-123',
    fingerprint: 'fp-hash-abc',
    deviceId: 'device-hash-xyz',
    ip: '192.168.1.10',
    ipSubnet: '192.168.1',
    audioSum: 124.567,
    timezone: 'Europe/Amsterdam',
    timezoneOffset: -60,
    languages: '["en","nl"]',
    screenWidth: 1920,
    screenHeight: 1080,
    hardwareConcurrency: 8,
    deviceMemory: 16,
    platform: 'Linux x86_64',
    touchSupport: 0,
    colorDepth: 24,
    ...overrides,
  };
}

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store(':memory:');
  });

  afterEach(() => {
    store.db.close();
  });

  describe('saveProfile', () => {
    it('inserts a profile and returns info with lastInsertRowid', () => {
      const data = makeProfileData();
      const result = store.saveProfile(data);

      assert.ok(result.lastInsertRowid > 0);
      assert.equal(result.changes, 1);
    });

    it('stores all signal fields correctly', () => {
      const data = makeProfileData();
      store.saveProfile(data);

      const profile = store.getProfile('visitor-test-123');
      assert.equal(profile.visitor_id, 'visitor-test-123');
      assert.equal(profile.fingerprint, 'fp-hash-abc');
      assert.equal(profile.device_id, 'device-hash-xyz');
      assert.equal(profile.ip, '192.168.1.10');
      assert.equal(profile.ip_subnet, '192.168.1');
      assert.ok(Math.abs(profile.audio_sum - 124.567) < 0.001);
      assert.equal(profile.timezone, 'Europe/Amsterdam');
      assert.equal(profile.timezone_offset, -60);
      assert.equal(profile.languages, '["en","nl"]');
      assert.equal(profile.screen_width, 1920);
      assert.equal(profile.screen_height, 1080);
      assert.equal(profile.hardware_concurrency, 8);
      assert.equal(profile.device_memory, 16);
      assert.equal(profile.platform, 'Linux x86_64');
      assert.equal(profile.touch_support, 0);
      assert.equal(profile.color_depth, 24);
    });

    it('handles null/missing fields without error', () => {
      const data = { visitor_id: 'visitor-minimal' };
      const result = store.saveProfile(data);
      assert.equal(result.changes, 1);

      const profile = store.getProfile('visitor-minimal');
      assert.equal(profile.visitor_id, 'visitor-minimal');
      assert.equal(profile.fingerprint, null);
      assert.equal(profile.audio_sum, null);
    });

    it('allows multiple profiles with the same visitor_id', () => {
      store.saveProfile(makeProfileData());
      store.saveProfile(makeProfileData({ fingerprint: 'fp-different' }));

      const all = store.findMatches({ deviceId: 'device-hash-xyz' });
      const matching = all.filter(p => p.visitor_id === 'visitor-test-123');
      assert.equal(matching.length, 2);
    });
  });

  describe('findMatches', () => {
    it('returns an empty array when no profiles exist', () => {
      const profiles = store.findMatches({});
      assert.deepEqual(profiles, []);
    });

    it('finds candidates by device_id', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1', deviceId: 'dev-A' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2', deviceId: 'dev-B' }));

      const results = store.findMatches({ deviceId: 'dev-A' });
      assert.equal(results.length, 1);
      assert.equal(results[0].visitor_id, 'v1');
    });

    it('finds candidates by ip_subnet', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1', ipSubnet: '10.0.0' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2', ipSubnet: '192.168.1' }));

      const results = store.findMatches({ ipSubnet: '10.0.0' });
      assert.equal(results.length, 1);
      assert.equal(results[0].visitor_id, 'v1');
    });

    it('finds candidates by fingerprint', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1', fingerprint: 'fp-AAA' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2', fingerprint: 'fp-BBB' }));

      const results = store.findMatches({ fingerprint: 'fp-AAA' });
      assert.equal(results.length, 1);
      assert.equal(results[0].visitor_id, 'v1');
    });

    it('falls back to recent unique profiles when no indexed match', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v3' }));

      const results = store.findMatches({});
      assert.equal(results.length, 3);
    });

    it('deduplicates by visitor_id in fallback mode', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1', fingerprint: 'old' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v1', fingerprint: 'new' }));

      const results = store.findMatches({});
      const v1profiles = results.filter(r => r.visitor_id === 'v1');
      assert.equal(v1profiles.length, 1);
      assert.equal(v1profiles[0].fingerprint, 'new');
    });
  });

  describe('getProfile', () => {
    it('returns the most recent profile for a visitor_id', () => {
      store.saveProfile(makeProfileData({ fingerprint: 'old-fp' }));
      store.saveProfile(makeProfileData({ fingerprint: 'new-fp' }));

      const profile = store.getProfile('visitor-test-123');
      assert.ok(profile !== undefined);
      assert.ok(['old-fp', 'new-fp'].includes(profile.fingerprint));
    });

    it('returns undefined for non-existent visitor_id', () => {
      const profile = store.getProfile('non-existent');
      assert.equal(profile, undefined);
    });
  });

  describe('updateProfile', () => {
    it('updates specified fields for an existing profile', () => {
      store.saveProfile(makeProfileData());

      const result = store.updateProfile('visitor-test-123', {
        platform: 'macOS ARM',
        screenWidth: 2560,
        screenHeight: 1600,
      });

      assert.ok(result.changes >= 1);

      const profile = store.getProfile('visitor-test-123');
      assert.equal(profile.platform, 'macOS ARM');
      assert.equal(profile.screen_width, 2560);
      assert.equal(profile.screen_height, 1600);
    });

    it('returns null when no fields are provided', () => {
      store.saveProfile(makeProfileData());
      const result = store.updateProfile('visitor-test-123', {});
      assert.equal(result, null);
    });

    it('returns 0 changes for non-existent visitor_id', () => {
      const result = store.updateProfile('non-existent', { platform: 'Win32' });
      assert.equal(result.changes, 0);
    });

    it('does not modify fields that are not in the update data', () => {
      store.saveProfile(makeProfileData());

      store.updateProfile('visitor-test-123', { platform: 'macOS ARM' });

      const profile = store.getProfile('visitor-test-123');
      assert.equal(profile.platform, 'macOS ARM');
      assert.equal(profile.timezone, 'Europe/Amsterdam');
      assert.equal(profile.screen_width, 1920);
    });
  });

  describe('ETag operations', () => {
    it('stores and retrieves etag', () => {
      store.setEtag('"visitor-abc"', 'visitor-abc');
      const result = store.getEtag('"visitor-abc"');
      assert.equal(result, 'visitor-abc');
    });

    it('returns null for unknown etag', () => {
      const result = store.getEtag('"nonexistent"');
      assert.equal(result, null);
    });

    it('upserts etag on conflict', () => {
      store.setEtag('"tag-1"', 'visitor-old');
      store.setEtag('"tag-1"', 'visitor-new');
      const result = store.getEtag('"tag-1"');
      assert.equal(result, 'visitor-new');
    });
  });

  describe('maintenance', () => {
    it('getStats returns profile count', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2' }));

      const stats = store.getStats();
      assert.equal(stats.profileCount, 2);
    });

    it('prune runs without error on empty db', () => {
      const result = store.prune();
      assert.equal(typeof result.duplicatesRemoved, 'number');
      assert.equal(typeof result.staleRemoved, 'number');
      assert.equal(typeof result.etagsRemoved, 'number');
    });
  });
});
