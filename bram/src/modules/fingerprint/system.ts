/**
 * System Module - OS and system-level information
 * Entropy: ~4 bits | Stability: 90% | Hardware-based: Partial
 */

import { ModuleInterface } from '../../types';

export class SystemModule implements ModuleInterface {
  name = 'system';
  entropy = 4;
  stability = 90;
  hardwareBased = false; // Mixed hardware/software

  isAvailable(): boolean {
    return typeof navigator !== 'undefined';
  }

  collect(): any {
    return {
      // Platform info
      platform: navigator.platform,
      oscpu: (navigator as any).oscpu || null,

      // Timezone (system-level)
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Locale
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      language: navigator.language,
      languages: navigator.languages,

      // Capabilities
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,

      // Vendor (can indicate OS/device)
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub,

      // PDF viewer (system-level)
      pdfViewerEnabled: navigator.pdfViewerEnabled || false
    };
  }
}
