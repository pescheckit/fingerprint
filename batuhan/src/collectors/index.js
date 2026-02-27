import { Thumbmark } from '@thumbmarkjs/thumbmarkjs';
import { getCanvasFingerprint } from './canvas';
import { getWebGLFingerprint } from './webgl';
import { getAudioFingerprint, getAudioContextProperties } from './audio';
import { getScreenSignals } from './screen';
import { detectFonts } from './fonts';
import { getNavigatorSignals } from './navigator';
import { getCSSMediaSignals, getMediaDevices } from './media';
import { getStorageSignals } from './storage';
import { getTimingSignals } from './timing';
import { getWebRTCIPs } from './webrtc';
import { getMathFingerprint } from './math';
import { getPermissions } from './permissions';
import { getGeneralInfo } from './general';
import { detectVPNProxyTor } from './vpn-detection';
import { hashComponents, murmurhash3 } from './hash';

async function getThumbmark() {
  try {
    const t = new Thumbmark();
    const result = await t.get();
    return result;
  } catch (e) {
    return { error: e.message };
  }
}

export async function collectAllSignals() {
  const startTime = performance.now();

  // Sync collectors
  const canvas = getCanvasFingerprint();
  const webgl = getWebGLFingerprint();
  const screen = getScreenSignals();
  const fonts = detectFonts();
  const nav = getNavigatorSignals();
  const cssMedia = getCSSMediaSignals();
  const audioContext = getAudioContextProperties();
  const timing = getTimingSignals();
  const math = getMathFingerprint();

  // Async collectors (run in parallel)
  const [audio, mediaDevices, storage, webrtc, permissions, thumbmark] =
    await Promise.all([
      getAudioFingerprint(),
      getMediaDevices(),
      getStorageSignals(),
      getWebRTCIPs(),
      getPermissions(),
      getThumbmark(),
    ]);

  const signals = {
    canvas,
    webgl,
    audio,
    audioContext,
    screen,
    fonts,
    navigator: nav,
    cssMedia,
    mediaDevices,
    storage,
    timing,
    webrtc,
    math,
    permissions,
  };

  // General info (needs signals for context, fetches IP/location)
  const general = await getGeneralInfo(signals);

  // VPN/Proxy/Tor detection
  const privacyCheck = await detectVPNProxyTor();

  const collectionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  // Our own composite hash
  const fingerprintId = hashComponents(signals);

  // ThumbmarkJS fingerprint
  const thumbmarkId = thumbmark.thumbmark || null;
  const thumbmarkComponents = thumbmark;

  // ── Category fingerprints ──
  // Device: only hardware values that EVERY browser reports identically
  const deviceFingerprint = hashComponents({
    screenWidth: screen.screenWidth,
    screenHeight: screen.screenHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: screen.devicePixelRatio,
    hardwareConcurrency: nav.hardwareConcurrency,
    maxTouchPoints: nav.maxTouchPoints,
    platform: nav.platform,
  });

  // Browser: signals specific to which browser/engine is used
  const browserFingerprint = hashComponents({
    userAgent: nav.userAgent,
    vendor: nav.vendor,
    vendorSub: nav.vendorSub,
    productSub: nav.productSub,
    plugins: nav.plugins,
    mimeTypes: nav.mimeTypes,
    userAgentData: nav.userAgentData,
    features: nav.features,
    permissions,
    storage,
    pdfViewerEnabled: nav.pdfViewerEnabled,
    deviceMemory: nav.deviceMemory,
    unmaskedRenderer: webgl.unmaskedRenderer,
    unmaskedVendor: webgl.unmaskedVendor,
    connection: nav.connection,
    mediaDevices,
    language: nav.language,
    languages: nav.languages,
  });

  // Rendering: canvas + webgl + audio (engine-dependent)
  const renderingFingerprint = hashComponents({
    canvas,
    webgl,
    audio,
    audioContext,
    math,
  });

  // Network: only IP (WebRTC behavior differs between browsers)
  const networkFingerprint = hashComponents({
    ip: general.ip,
  });

  // Locale: only OS-level values (languages list is per-browser config!)
  const localeFingerprint = hashComponents({
    timezone: timing.timezone,
    timezoneOffset: timing.timezoneOffset,
  });

  // Fonts: only the sorted name list (not canvas measurements which vary by engine)
  const fontsFingerprint = hashComponents({
    installedFonts: [...fonts.detected].sort(),
  });

  const categoryFingerprints = {
    device:    { hash: deviceFingerprint,    label: 'Device',    icon: '🖥️', stable: true,  description: 'Hardware: screen, GPU, CPU, memory, touch. Same across browsers on the same machine.' },
    browser:   { hash: browserFingerprint,   label: 'Browser',   icon: '🌐', stable: false, description: 'Engine-specific: user agent, plugins, features, permissions. Changes between browsers.' },
    rendering: { hash: renderingFingerprint, label: 'Rendering', icon: '🎨', stable: false, description: 'Canvas, WebGL, Audio, Math. Engine-dependent, changes between browsers.' },
    network:   { hash: networkFingerprint,   label: 'Network',   icon: '📡', stable: true,  description: 'IP address, WebRTC, connection. Same on the same network regardless of browser.' },
    locale:    { hash: localeFingerprint,    label: 'Locale',    icon: '🌍', stable: true,  description: 'Language, timezone, date format, preferences. Same across browsers on the same OS.' },
    fonts:     { hash: fontsFingerprint,     label: 'Fonts',     icon: '🔤', stable: true,  description: 'Installed fonts. Same across browsers on the same OS (OS + installed software).' },
  };

  // Stable fingerprint: only truly cross-browser identical values
  const stableRaw = [
    screen.screenWidth,
    screen.screenHeight,
    screen.colorDepth,
    screen.pixelDepth,
    screen.devicePixelRatio,
    nav.hardwareConcurrency,
    nav.maxTouchPoints,
    nav.platform,
    timing.timezone,
    timing.timezoneOffset,
  ].join('|');
  const stableFingerprint = murmurhash3(stableRaw);

  // List of scans performed
  const scanList = [
    { name: 'Screen & Display',  icon: '🖥️', category: 'device' },
    { name: 'GPU (WebGL)',       icon: '🔺', category: 'device' },
    { name: 'CPU & Memory',      icon: '⚡', category: 'device' },
    { name: 'Touch & Input',     icon: '👆', category: 'device' },
    { name: 'Media Devices',     icon: '📷', category: 'device' },
    { name: 'Installed Fonts',   icon: '🔤', category: 'fonts' },
    { name: 'IP & Geolocation',  icon: '📡', category: 'network' },
    { name: 'WebRTC',            icon: '🌐', category: 'network' },
    { name: 'Language & Timezone',icon: '🌍', category: 'locale' },
    { name: 'User Preferences',  icon: '🎨', category: 'locale' },
    { name: 'Canvas Rendering',  icon: '🖼️', category: 'rendering' },
    { name: 'Audio Processing',  icon: '🔊', category: 'rendering' },
    { name: 'Math Precision',    icon: '🧮', category: 'rendering' },
    { name: 'User Agent & Plugins', icon: '🧭', category: 'browser' },
    { name: 'Permissions',       icon: '🔒', category: 'browser' },
    { name: 'Storage APIs',      icon: '💾', category: 'browser' },
    { name: 'ThumbmarkJS',       icon: '👆', category: 'all' },
  ];

  return {
    fingerprintId,
    stableFingerprint,
    thumbmarkId,
    thumbmarkComponents,
    categoryFingerprints,
    scanList,
    collectionTimeMs,
    signals,
    general,
    privacyCheck,
    collectedAt: new Date().toISOString(),
  };
}
