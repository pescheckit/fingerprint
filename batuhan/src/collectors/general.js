export async function getGeneralInfo(signals) {
  const ua = navigator.userAgent;
  const nav = signals.navigator;

  // Parse browser name/version from userAgent
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) {
    browser = 'Firefox ' + ua.match(/Firefox\/([\d.]+)/)?.[1];
  } else if (ua.includes('Edg/')) {
    browser = 'Edge ' + ua.match(/Edg\/([\d.]+)/)?.[1];
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera ' + (ua.match(/OPR\/([\d.]+)/)?.[1] || ua.match(/Opera\/([\d.]+)/)?.[1]);
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome ' + ua.match(/Chrome\/([\d.]+)/)?.[1];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari ' + ua.match(/Version\/([\d.]+)/)?.[1];
  }

  // Parse OS
  let os = 'Unknown';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.');
    os = 'macOS ' + (ver || '');
  } else if (ua.includes('Android')) {
    os = 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
  } else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('CrOS')) os = 'ChromeOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const ver = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.');
    os = 'iOS ' + (ver || '');
  }

  // Device type
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

  // Fetch IP + geolocation from free API
  let ip = null;
  let location = null;
  try {
    // ip-api.com: free, CORS-enabled, but HTTP only (fine for dev)
    const res = await fetch('http://ip-api.com/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        ip = data.query;
        location = {
          city: data.city,
          region: data.regionName,
          country: data.country,
          countryCode: data.countryCode,
          isp: data.isp,
          org: data.org,
          latitude: data.lat,
          longitude: data.lon,
        };
      }
    }
  } catch { /* offline or blocked */ }

  return {
    browser,
    os,
    platform: nav.platform,
    deviceType,
    language: nav.language,
    languages: nav.languages,
    screenResolution: `${signals.screen.screenWidth} x ${signals.screen.screenHeight}`,
    pixelRatio: signals.screen.devicePixelRatio,
    colorDepth: signals.screen.colorDepth + '-bit',
    timezone: signals.timing.timezone,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory !== 'N/A' ? nav.deviceMemory + ' GB' : 'N/A',
    touchscreen: nav.maxTouchPoints > 0,
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    ip,
    location,
  };
}
