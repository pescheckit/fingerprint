export function getCSSMediaSignals() {
  const mq = (query) => window.matchMedia(query).matches;

  return {
    prefersColorScheme: mq('(prefers-color-scheme: dark)') ? 'dark' : 'light',
    prefersReducedMotion: mq('(prefers-reduced-motion: reduce)'),
    prefersReducedTransparency: mq('(prefers-reduced-transparency: reduce)'),
    prefersContrast: mq('(prefers-contrast: more)') ? 'more'
      : mq('(prefers-contrast: less)') ? 'less' : 'no-preference',
    colorGamutP3: mq('(color-gamut: p3)'),
    colorGamutRec2020: mq('(color-gamut: rec2020)'),
    hdr: mq('(dynamic-range: high)'),
    hover: mq('(hover: hover)'),
    anyHover: mq('(any-hover: hover)'),
    pointer: mq('(pointer: fine)') ? 'fine'
      : mq('(pointer: coarse)') ? 'coarse' : 'none',
    anyPointer: mq('(any-pointer: fine)') ? 'fine'
      : mq('(any-pointer: coarse)') ? 'coarse' : 'none',
    forcedColors: mq('(forced-colors: active)'),
    invertedColors: mq('(inverted-colors: inverted)'),
    scripting: mq('(scripting: enabled)'),
    portrait: mq('(orientation: portrait)'),
  };
}

export async function getMediaDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return { supported: false };
    const devices = await navigator.mediaDevices.enumerateDevices();
    const counts = { audioinput: 0, audiooutput: 0, videoinput: 0 };
    for (const d of devices) {
      if (counts[d.kind] !== undefined) counts[d.kind]++;
    }
    return { supported: true, ...counts, total: devices.length };
  } catch (e) {
    return { supported: false, error: e.message };
  }
}
