export function getScreenSignals() {
  const mq = (query) => window.matchMedia(query).matches;

  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    availTop: screen.availTop,
    availLeft: screen.availLeft,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio,
    orientation: screen.orientation?.type,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    colorGamut: mq('(color-gamut: rec2020)') ? 'rec2020'
      : mq('(color-gamut: p3)') ? 'p3'
      : 'srgb',
    hdrSupport: mq('(dynamic-range: high)'),
    forcedColors: mq('(forced-colors: active)'),
  };
}
