import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatchScore, findBestMatch, calculateCrossDeviceScore, findBestCrossDeviceMatch, CROSS_DEVICE_WEIGHTS } from './matching.js';

// Helper: a full stored profile row (as returned from SQLite)
function makeStoredProfile(overrides = {}) {
  return {
    id: 1,
    visitor_id: 'visitor-abc',
    fingerprint: 'fp-hash-123',
    device_id: 'device-hash-456',
    ip: '192.168.1.42',
    ip_subnet: '192.168.1',
    audio_sum: 124.567890,
    timezone: 'Europe/Amsterdam',
    timezone_offset: -60,
    languages: '["en","nl"]',
    screen_width: 1920,
    screen_height: 1080,
    hardware_concurrency: 8,
    device_memory: 16,
    platform: 'Linux x86_64',
    touch_support: 0,
    color_depth: 24,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
    ...overrides,
  };
}

// Helper: incoming signals (camelCase, as sent by client)
function makeIncoming(overrides = {}) {
  return {
    fingerprint: 'fp-hash-123',
    deviceId: 'device-hash-456',
    ipSubnet: '192.168.1',
    audioSum: 124.567890,
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

describe('calculateMatchScore', () => {
  it('returns a perfect score (1.0) when all signals match', () => {
    const incoming = makeIncoming();
    const stored = makeStoredProfile();
    const { score, matchedSignals } = calculateMatchScore(incoming, stored);

    assert.equal(score, 1.0);
    assert.equal(matchedSignals.length, 12);
  });

  it('returns 0 when no signals match', () => {
    const incoming = makeIncoming({
      ipSubnet: '10.0.0',
      audioSum: 999.999,
      timezone: 'US/Pacific',
      timezoneOffset: 480,
      languages: '["zh"]',
      screenWidth: 3840,
      screenHeight: 2160,
      hardwareConcurrency: 4,
      deviceMemory: 8,
      platform: 'Win32',
      touchSupport: 1,
      colorDepth: 32,
      deviceId: 'different-device',
    });
    const stored = makeStoredProfile();
    const { score, matchedSignals } = calculateMatchScore(incoming, stored);

    assert.equal(score, 0);
    assert.deepEqual(matchedSignals, []);
  });

  it('matches audio with fuzzy 1% tolerance', () => {
    const stored = makeStoredProfile({ audio_sum: 100.0 });

    // Within 1% tolerance (0.5% off)
    const withinTolerance = makeIncoming({ audioSum: 100.5 });
    const result1 = calculateMatchScore(withinTolerance, stored);
    assert.ok(result1.matchedSignals.includes('audio'), 'Should match audio within 1% tolerance');

    // Exactly at 1% boundary
    const atBoundary = makeIncoming({ audioSum: 101.0 });
    const result2 = calculateMatchScore(atBoundary, stored);
    assert.ok(result2.matchedSignals.includes('audio'), 'Should match audio at exactly 1% boundary');

    // Beyond 1% tolerance
    const beyondTolerance = makeIncoming({ audioSum: 101.1 });
    const result3 = calculateMatchScore(beyondTolerance, stored);
    assert.ok(!result3.matchedSignals.includes('audio'), 'Should NOT match audio beyond 1% tolerance');
  });

  it('handles null/undefined signal values gracefully', () => {
    const incoming = makeIncoming({ audioSum: null, timezone: undefined, languages: null });
    const stored = makeStoredProfile({ audio_sum: null, timezone: null });
    const { score, matchedSignals } = calculateMatchScore(incoming, stored);

    // Should not crash, and should not match null signals
    assert.ok(!matchedSignals.includes('audio'));
    assert.ok(!matchedSignals.includes('timezone'));
    assert.ok(!matchedSignals.includes('languages'));
    assert.ok(typeof score === 'number');
  });

  it('correctly weights individual signals', () => {
    const stored = makeStoredProfile();

    // Only IP subnet matches
    const ipOnly = makeIncoming({
      audioSum: 999, timezone: 'US/Pacific', timezoneOffset: 480,
      languages: '["zh"]', screenWidth: 3840, screenHeight: 2160,
      hardwareConcurrency: 4, deviceMemory: 8, platform: 'Win32',
      touchSupport: 1, colorDepth: 32, deviceId: 'different',
    });
    const { score } = calculateMatchScore(ipOnly, stored);
    assert.ok(Math.abs(score - 0.15) < 0.001, `IP subnet weight should be 0.15, got ${score}`);
  });

  it('compares languages as JSON strings regardless of input type', () => {
    const stored = makeStoredProfile({ languages: '["en","nl"]' });

    // Incoming as string
    const asString = makeIncoming({ languages: '["en","nl"]' });
    const result1 = calculateMatchScore(asString, stored);
    assert.ok(result1.matchedSignals.includes('languages'));

    // Incoming as array (will be JSON.stringified for comparison)
    const asArray = makeIncoming({ languages: ['en', 'nl'] });
    const result2 = calculateMatchScore(asArray, stored);
    assert.ok(result2.matchedSignals.includes('languages'));
  });

  it('requires both width and height to match for screen signal', () => {
    const stored = makeStoredProfile({ screen_width: 1920, screen_height: 1080 });

    // Only width matches
    const widthOnly = makeIncoming({ screenWidth: 1920, screenHeight: 900 });
    const result = calculateMatchScore(widthOnly, stored);
    assert.ok(!result.matchedSignals.includes('screen'));
  });
});

describe('findBestMatch', () => {
  it('returns the best match above threshold', () => {
    const incoming = makeIncoming();
    const profiles = [
      makeStoredProfile({ visitor_id: 'exact-match' }),
      makeStoredProfile({
        visitor_id: 'partial-match',
        audio_sum: 999,
        timezone: 'US/Pacific',
        platform: 'Win32',
      }),
    ];

    const result = findBestMatch(incoming, profiles);
    assert.ok(result !== null);
    assert.equal(result.visitorId, 'exact-match');
    assert.equal(result.confidence, 1.0);
  });

  it('returns null when no profiles exceed the threshold', () => {
    const incoming = makeIncoming({
      ipSubnet: '10.0.0',
      audioSum: 999,
      timezone: 'US/Pacific',
      timezoneOffset: 480,
      languages: '["zh"]',
      screenWidth: 3840,
      screenHeight: 2160,
      hardwareConcurrency: 4,
      deviceMemory: 8,
      platform: 'Win32',
      touchSupport: 1,
      colorDepth: 32,
      deviceId: 'different',
    });
    const profiles = [makeStoredProfile()];
    const result = findBestMatch(incoming, profiles);
    assert.equal(result, null);
  });

  it('returns null for empty profiles array', () => {
    const result = findBestMatch(makeIncoming(), []);
    assert.equal(result, null);
  });

  it('respects custom threshold', () => {
    const incoming = makeIncoming();
    const profiles = [makeStoredProfile()];

    // With threshold 1.0, a perfect match should still pass
    const highThreshold = findBestMatch(incoming, profiles, 1.0);
    assert.ok(highThreshold !== null);

    // With threshold 0.0, even a weak match would pass
    const lowThreshold = findBestMatch(
      makeIncoming({
        ipSubnet: '10.0.0', audioSum: 999, timezone: 'US/Pacific',
        timezoneOffset: 480, languages: '["zh"]', screenWidth: 3840,
        screenHeight: 2160, hardwareConcurrency: 4, deviceMemory: 8,
        platform: 'Win32', touchSupport: 1, colorDepth: 32,
        deviceId: 'different',
      }),
      profiles,
      0.0,
    );
    // Score is 0 and threshold is 0, but score must be >= threshold, so 0 >= 0 is true
    // However score must also be > bestScore (0), so first iteration 0 > 0 is false
    assert.equal(lowThreshold, null);
  });

  it('picks the highest-scoring profile among multiple candidates', () => {
    const incoming = makeIncoming();

    const profiles = [
      makeStoredProfile({
        visitor_id: 'partial',
        audio_sum: 999,
        timezone: 'US/Pacific',
        platform: 'Win32',
        device_id: 'different',
      }),
      makeStoredProfile({ visitor_id: 'perfect' }),
    ];

    const result = findBestMatch(incoming, profiles);
    assert.equal(result.visitorId, 'perfect');
  });
});

// Helper for cross-device stored profiles
function makeCrossDeviceProfile(overrides = {}) {
  return {
    visitor_id: 'cross-device-visitor',
    household_id: 'hh-abc',
    local_ip_subnet: '192.168.1',
    ip_subnet: '192.168.1',
    timezone: 'Europe/Amsterdam',
    languages: '["en","nl"]',
    last_active: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ...overrides,
  };
}

function makeCrossDeviceIncoming(overrides = {}) {
  return {
    visitorId: 'incoming-visitor',
    householdId: 'hh-abc',
    localSubnet: '192.168.1',
    ipSubnet: '192.168.1',
    timezone: 'Europe/Amsterdam',
    languages: '["en","nl"]',
    ...overrides,
  };
}

describe('calculateCrossDeviceScore', () => {
  it('returns full score when all cross-device signals match', () => {
    const incoming = makeCrossDeviceIncoming();
    const stored = makeCrossDeviceProfile();
    const { score, matchedSignals } = calculateCrossDeviceScore(incoming, stored);

    // All weights sum to 1.0
    const expectedMax = CROSS_DEVICE_WEIGHTS.household + CROSS_DEVICE_WEIGHTS.localSubnet +
      CROSS_DEVICE_WEIGHTS.timezone + CROSS_DEVICE_WEIGHTS.languages +
      CROSS_DEVICE_WEIGHTS.ipSubnet + CROSS_DEVICE_WEIGHTS.timingCorr;
    assert.ok(Math.abs(score - expectedMax) < 0.001, `Expected score ~${expectedMax}, got ${score}`);
    assert.ok(matchedSignals.includes('household'));
    assert.ok(matchedSignals.includes('localSubnet'));
    assert.ok(matchedSignals.includes('timezone'));
    assert.ok(matchedSignals.includes('languages'));
    assert.ok(matchedSignals.includes('ipSubnet'));
    assert.ok(matchedSignals.includes('timingCorr'));
  });

  it('returns 0 when no signals match', () => {
    const incoming = makeCrossDeviceIncoming({
      householdId: 'different-hh',
      localSubnet: '10.0.0',
      ipSubnet: '10.0.0',
      timezone: 'US/Pacific',
      languages: '["zh"]',
    });
    const stored = makeCrossDeviceProfile({ last_active: null });
    const { score, matchedSignals } = calculateCrossDeviceScore(incoming, stored);

    assert.equal(score, 0);
    assert.deepEqual(matchedSignals, []);
  });

  it('gives timing bonus for recently active profiles', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now - 2 * 60000).toISOString().replace('T', ' ').slice(0, 19);

    const incoming = makeCrossDeviceIncoming({
      householdId: null, localSubnet: null, ipSubnet: null,
      timezone: null, languages: null,
    });
    const stored = makeCrossDeviceProfile({
      household_id: null, local_ip_subnet: null, ip_subnet: null,
      timezone: null, languages: null,
      last_active: twoMinutesAgo,
    });

    const { score, matchedSignals } = calculateCrossDeviceScore(incoming, stored);
    assert.ok(Math.abs(score - CROSS_DEVICE_WEIGHTS.timingCorr) < 0.001);
    assert.ok(matchedSignals.includes('timingCorr'));
  });

  it('gives half timing bonus for 5-30 minute gap', () => {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now - 15 * 60000).toISOString().replace('T', ' ').slice(0, 19);

    const incoming = makeCrossDeviceIncoming({
      householdId: null, localSubnet: null, ipSubnet: null,
      timezone: null, languages: null,
    });
    const stored = makeCrossDeviceProfile({
      household_id: null, local_ip_subnet: null, ip_subnet: null,
      timezone: null, languages: null,
      last_active: fifteenMinutesAgo,
    });

    const { score, matchedSignals } = calculateCrossDeviceScore(incoming, stored);
    assert.ok(Math.abs(score - CROSS_DEVICE_WEIGHTS.timingCorr * 0.5) < 0.001);
    assert.ok(matchedSignals.includes('timingCorr'));
  });
});

describe('findBestCrossDeviceMatch', () => {
  it('returns best match above threshold', () => {
    const incoming = makeCrossDeviceIncoming();
    const members = [
      makeCrossDeviceProfile({ visitor_id: 'device-A' }),
      makeCrossDeviceProfile({ visitor_id: 'device-B', timezone: 'US/Pacific' }),
    ];

    const result = findBestCrossDeviceMatch(incoming, members);
    assert.ok(result !== null);
    assert.equal(result.visitorId, 'device-A');
    assert.ok(result.confidence >= 0.55);
  });

  it('skips profiles with same visitor ID', () => {
    const incoming = makeCrossDeviceIncoming({ visitorId: 'same-visitor' });
    const members = [
      makeCrossDeviceProfile({ visitor_id: 'same-visitor' }),
    ];

    const result = findBestCrossDeviceMatch(incoming, members);
    assert.equal(result, null);
  });

  it('returns null when below threshold', () => {
    const incoming = makeCrossDeviceIncoming({
      householdId: 'different',
      localSubnet: '10.0.0',
      timezone: 'US/Pacific',
      languages: '["zh"]',
      ipSubnet: '10.0.0',
    });
    const members = [
      makeCrossDeviceProfile({ visitor_id: 'other-device', last_active: null }),
    ];

    const result = findBestCrossDeviceMatch(incoming, members);
    assert.equal(result, null);
  });

  it('returns null for empty household', () => {
    const incoming = makeCrossDeviceIncoming();
    const result = findBestCrossDeviceMatch(incoming, []);
    assert.equal(result, null);
  });
});
