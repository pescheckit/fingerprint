/**
 * Navigator Properties Module
 * Entropy: ~8 bits
 * Stability: High
 * Hardware-based: Partial (hardware concurrency, device memory)
 */
export default class NavigatorModule {
  static name = 'navigator';
  static entropy = 8.0;
  static hardware = true;

  static isAvailable() {
    return typeof navigator !== 'undefined';
  }

  static collect() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub,
      productSub: navigator.productSub,
      oscpu: navigator.oscpu,

      // Connection info
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,

      // Permissions
      permissions: typeof navigator.permissions !== 'undefined',

      // Media capabilities
      mediaDevices: typeof navigator.mediaDevices !== 'undefined',

      // Service worker support
      serviceWorker: 'serviceWorker' in navigator,

      // Geolocation support
      geolocation: 'geolocation' in navigator,

      // WebDriver detection
      webdriver: navigator.webdriver,

      // Plugins (deprecated but still available)
      plugins: Array.from(navigator.plugins || []).map(p => ({
        name: p.name,
        description: p.description,
        filename: p.filename
      }))
    };
  }
}
