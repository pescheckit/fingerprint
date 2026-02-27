import { Collector } from '../../collector.js';

const PROBE_TARGETS = [
  { name: 'google',    url: 'https://accounts.google.com/CheckCookie?continue=https://www.google.com/favicon.ico' },
  { name: 'facebook',  url: 'https://www.facebook.com/login/device-based/regular/login/?next=https://www.facebook.com/favicon.ico' },
  { name: 'reddit',    url: 'https://www.reddit.com/favicon.ico' },
  { name: 'github',    url: 'https://github.com/login?return_to=https://github.com/favicon.ico' },
  { name: 'twitter',   url: 'https://abs.twimg.com/favicons/twitter.3.ico' },
  { name: 'linkedin',  url: 'https://www.linkedin.com/favicon.ico' },
  { name: 'amazon',    url: 'https://www.amazon.com/favicon.ico' },
  { name: 'microsoft', url: 'https://login.microsoftonline.com/favicon.ico' },
];

export class LoginDetectCollector extends Collector {
  constructor() {
    super('loginDetect', 'Login state detection', []);
  }

  async collect() {
    if (typeof document === 'undefined') {
      return { services: {}, loginBitmask: '00000000', detectedCount: 0 };
    }

    const results = await Promise.all(
      PROBE_TARGETS.map(target => this._probeService(target.url))
    );

    const services = {};
    let bitmask = '';
    let detectedCount = 0;

    PROBE_TARGETS.forEach((target, i) => {
      services[target.name] = results[i];
      bitmask += results[i] ? '1' : '0';
      if (results[i]) detectedCount++;
    });

    return { services, loginBitmask: bitmask, detectedCount };
  }

  _probeService(url, timeout = 2500) {
    return new Promise(resolve => {
      const img = new Image();
      const start = performance.now();
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          img.src = '';
          resolve(null);
        }
      }, timeout);

      img.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(true);
        }
      };

      img.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const elapsed = performance.now() - start;
          // Fast error (<500ms) often means redirect to login page was blocked (logged in)
          // Slow error means timeout/no response (logged out or blocked)
          resolve(elapsed < 500);
        }
      };

      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.src = url;
    });
  }
}
