export function getNavigatorSignals() {
  const nav = navigator;

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    languages: [...(nav.languages || [])],
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory ?? 'N/A',
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    globalPrivacyControl: nav.globalPrivacyControl ?? 'N/A',
    pdfViewerEnabled: nav.pdfViewerEnabled,
    maxTouchPoints: nav.maxTouchPoints,
    webdriver: nav.webdriver,
    vendor: nav.vendor,
    vendorSub: nav.vendorSub,
    productSub: nav.productSub,
    connection: nav.connection ? {
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
      saveData: nav.connection.saveData,
    } : null,
    plugins: Array.from(nav.plugins || []).map(p => p.name),
    mimeTypes: Array.from(nav.mimeTypes || []).map(m => m.type),
    userAgentData: nav.userAgentData ? {
      brands: nav.userAgentData.brands,
      mobile: nav.userAgentData.mobile,
      platform: nav.userAgentData.platform,
    } : null,
    // Feature detection
    features: {
      bluetooth: 'bluetooth' in nav,
      usb: 'usb' in nav,
      xr: 'xr' in nav,
      wakeLock: 'wakeLock' in nav,
      credentials: 'credentials' in nav,
      serviceWorker: 'serviceWorker' in nav,
      share: 'share' in nav,
      clipboard: 'clipboard' in nav,
    },
  };
}
