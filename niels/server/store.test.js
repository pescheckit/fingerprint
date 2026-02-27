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

      const all = store.findMatches();
      const matching = all.filter(p => p.visitor_id === 'visitor-test-123');
      assert.equal(matching.length, 2);
    });
  });

  describe('findMatches', () => {
    it('returns an empty array when no profiles exist', () => {
      const profiles = store.findMatches();
      assert.deepEqual(profiles, []);
    });

    it('returns all stored profiles', () => {
      store.saveProfile(makeProfileData({ visitor_id: 'v1' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v2' }));
      store.saveProfile(makeProfileData({ visitor_id: 'v3' }));

      const profiles = store.findMatches();
      assert.equal(profiles.length, 3);
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
});
