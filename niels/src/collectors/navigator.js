import { Collector } from '../collector.js';

/**
 * Collects navigator (browser and device) properties as fingerprint signals.
 *
 * The navigator object exposes user-agent details, hardware hints, language
 * preferences, and feature flags. Combined, these form a medium-high entropy
 * signal useful for distinguishing browsers and devices.
 */
export class NavigatorCollector extends Collector {
  constructor() {
    super('navigator', 'Browser and device properties', [
      'maxTouchPoints',
    ]);
  }

  async collect() {
    const n = globalThis.navigator || {};

    return {
      userAgent: n.userAgent ?? null,
      platform: n.platform ?? null,
      languages: Array.isArray(n.languages) ? [...n.languages] : null,
      hardwareConcurrency: n.hardwareConcurrency ?? null,
      deviceMemory: n.deviceMemory ?? null,
      vendor: n.vendor ?? null,
      cookieEnabled: typeof n.cookieEnabled === 'boolean' ? n.cookieEnabled : null,
      doNotTrack: n.doNotTrack ?? null,
      pdfViewerEnabled: typeof n.pdfViewerEnabled === 'boolean' ? n.pdfViewerEnabled : null,
      maxTouchPoints: n.maxTouchPoints ?? null,
    };
  }
}
