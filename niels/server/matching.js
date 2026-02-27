const WEIGHTS = {
  ipSubnet:           0.15,
  audio:              0.12,
  timezone:           0.10,
  languages:          0.10,
  screen:             0.10,
  hardwareConcurrency: 0.08,
  deviceMemory:       0.08,
  platform:           0.07,
  touchSupport:       0.05,
  colorDepth:         0.05,
  timezoneOffset:     0.05,
  deviceId:           0.05,
};

export function calculateMatchScore(incoming, stored) {
  let score = 0;
  const matchedSignals = [];

  // IP /24 subnet comparison
  if (incoming.ipSubnet && stored.ip_subnet && incoming.ipSubnet === stored.ip_subnet) {
    score += WEIGHTS.ipSubnet;
    matchedSignals.push('ipSubnet');
  }

  // Audio fingerprint (fuzzy: 1% tolerance)
  if (incoming.audioSum != null && stored.audio_sum != null) {
    const tolerance = Math.abs(stored.audio_sum) * 0.01;
    if (Math.abs(incoming.audioSum - stored.audio_sum) <= tolerance) {
      score += WEIGHTS.audio;
      matchedSignals.push('audio');
    }
  }

  // Timezone (exact)
  if (incoming.timezone && stored.timezone && incoming.timezone === stored.timezone) {
    score += WEIGHTS.timezone;
    matchedSignals.push('timezone');
  }

  // Languages (JSON array comparison)
  if (incoming.languages && stored.languages) {
    const incomingLangs = typeof incoming.languages === 'string' ? incoming.languages : JSON.stringify(incoming.languages);
    const storedLangs = typeof stored.languages === 'string' ? stored.languages : JSON.stringify(stored.languages);
    if (incomingLangs === storedLangs) {
      score += WEIGHTS.languages;
      matchedSignals.push('languages');
    }
  }

  // Screen (WxH exact match)
  if (incoming.screenWidth != null && incoming.screenHeight != null &&
      stored.screen_width != null && stored.screen_height != null &&
      incoming.screenWidth === stored.screen_width &&
      incoming.screenHeight === stored.screen_height) {
    score += WEIGHTS.screen;
    matchedSignals.push('screen');
  }

  // Hardware concurrency (exact)
  if (incoming.hardwareConcurrency != null && stored.hardware_concurrency != null &&
      incoming.hardwareConcurrency === stored.hardware_concurrency) {
    score += WEIGHTS.hardwareConcurrency;
    matchedSignals.push('hardwareConcurrency');
  }

  // Device memory (exact)
  if (incoming.deviceMemory != null && stored.device_memory != null &&
      incoming.deviceMemory === stored.device_memory) {
    score += WEIGHTS.deviceMemory;
    matchedSignals.push('deviceMemory');
  }

  // Platform (exact)
  if (incoming.platform && stored.platform && incoming.platform === stored.platform) {
    score += WEIGHTS.platform;
    matchedSignals.push('platform');
  }

  // Touch support (exact)
  if (incoming.touchSupport != null && stored.touch_support != null &&
      incoming.touchSupport === stored.touch_support) {
    score += WEIGHTS.touchSupport;
    matchedSignals.push('touchSupport');
  }

  // Color depth (exact)
  if (incoming.colorDepth != null && stored.color_depth != null &&
      incoming.colorDepth === stored.color_depth) {
    score += WEIGHTS.colorDepth;
    matchedSignals.push('colorDepth');
  }

  // Timezone offset (exact)
  if (incoming.timezoneOffset != null && stored.timezone_offset != null &&
      incoming.timezoneOffset === stored.timezone_offset) {
    score += WEIGHTS.timezoneOffset;
    matchedSignals.push('timezoneOffset');
  }

  // Device ID (exact hash)
  if (incoming.deviceId && stored.device_id && incoming.deviceId === stored.device_id) {
    score += WEIGHTS.deviceId;
    matchedSignals.push('deviceId');
  }

  return { score, matchedSignals };
}

export function findBestMatch(incoming, profiles, threshold = 0.7) {
  let bestMatch = null;
  let bestScore = 0;

  for (const profile of profiles) {
    const { score, matchedSignals } = calculateMatchScore(incoming, profile);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = { visitorId: profile.visitor_id, confidence: score, matchedSignals };
    }
  }

  return bestMatch;
}
