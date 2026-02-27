// ── Tor Browser Detection ──

function detectTorLetterboxing() {
  const innerW = window.innerWidth;
  const innerH = window.innerHeight;
  const screenW = screen.width;
  const innerWRounded = innerW % 100 === 0;
  const innerHRounded = innerH % 100 === 0;

  return {
    letterboxing: innerWRounded && innerHRounded && innerW < screenW,
    viewport: `${innerW}x${innerH}`,
    rounded: innerWRounded && innerHRounded,
  };
}

function detectTimingClamping() {
  const samples = [];
  for (let i = 0; i < 200; i++) samples.push(performance.now());
  const diffs = [];
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i] - samples[i - 1];
    if (d > 0) diffs.push(d);
  }
  const minDiff = diffs.length > 0 ? Math.min(...diffs) : 0;
  return {
    resolution: Math.round(minDiff * 1000) / 1000,
    clamped100ms: minDiff >= 90,
  };
}

function detectCanvasRandomization() {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  const hashes = [];

  for (let i = 0; i < 3; i++) {
    ctx.clearRect(0, 0, 300, 50);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(10, 5, 100, 20);
    ctx.fillStyle = '#006699';
    ctx.fillText('Canvas noise test', 10, 35);
    const data = ctx.getImageData(0, 0, 300, 50).data;
    let hash = 0;
    for (let j = 0; j < data.length; j++) {
      hash = ((hash << 5) - hash) + data[j];
      hash |= 0;
    }
    hashes.push(hash);
  }

  return {
    consistent: hashes.every((h) => h === hashes[0]),
    noiseInjected: !hashes.every((h) => h === hashes[0]),
  };
}

function detectNavigatorAnomalies() {
  const ua = navigator.userAgent;
  const isFirefox = ua.includes('Firefox');

  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory ?? null,
    spoofedHardware: navigator.hardwareConcurrency === 2 && (navigator.deviceMemory === 2 || navigator.deviceMemory === undefined),
    singleLanguage: navigator.languages?.length === 1 && navigator.languages[0] === 'en-US',
    noPlugins: navigator.plugins?.length === 0,
    noUserAgentData: !navigator.userAgentData,
    isFirefox,
    doNotTrack: navigator.doNotTrack === '1',
    webglDebugBlocked: (() => {
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl');
        return gl ? !gl.getExtension('WEBGL_debug_renderer_info') : true;
      } catch { return true; }
    })(),
  };
}

// ── IP Reputation Checks ──

async function checkTorExitNode() {
  try {
    const res = await fetch('https://check.torproject.org/api/ip');
    if (res.ok) {
      const data = await res.json();
      return { ip: data.IP, isTor: data.IsTor };
    }
  } catch { /* blocked */ }
  return { ip: null, isTor: null };
}

async function checkIPReputation() {
  const result = { proxy: null, hosting: null, org: null, warp: null };

  // ip-api.com (HTTP only, free)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,org,isp,proxy,hosting,query');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        result.proxy = data.proxy;
        result.hosting = data.hosting;
        result.org = data.org;
        result.isp = data.isp;
      }
    }
  } catch { /* blocked */ }

  // Cloudflare WARP check
  try {
    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    if (res.ok) {
      const text = await res.text();
      const lines = Object.fromEntries(text.trim().split('\n').map((l) => l.split('=')));
      result.warp = lines.warp === 'on';
      result.cfIP = lines.ip;
      result.cfLoc = lines.loc;
    }
  } catch { /* blocked */ }

  return result;
}

// ── Latency Analysis ──

async function measureLatency() {
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        cache: 'no-store',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* ok */ }
    times.push(performance.now() - start);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  return {
    median: Math.round(median),
    min: Math.round(min),
    torPattern: median > 300 && min > 100,
    vpnPattern: median > 50 && median < 300,
  };
}

// ── Main Detection ──

export async function detectVPNProxyTor() {
  // Sync checks
  const letterboxing = detectTorLetterboxing();
  const timing = detectTimingClamping();
  const canvas = detectCanvasRandomization();
  const nav = detectNavigatorAnomalies();

  // Async checks in parallel
  const [torCheck, ipReputation, latency] = await Promise.all([
    checkTorExitNode(),
    checkIPReputation(),
    measureLatency(),
  ]);

  // Scoring
  const torSignals = [
    { name: 'Tor Exit Node (torproject.org)', detected: torCheck.isTor === true, weight: 'definitive' },
    { name: 'Timer Clamped to 100ms', detected: timing.clamped100ms, weight: 'strong' },
    { name: 'Canvas Noise Injection', detected: canvas.noiseInjected, weight: 'strong' },
    { name: 'WebGL Debug Info Blocked', detected: nav.webglDebugBlocked, weight: 'medium' },
    { name: 'Spoofed Hardware (2 cores)', detected: nav.spoofedHardware, weight: 'medium' },
    { name: 'Letterboxed Viewport', detected: letterboxing.letterboxing, weight: 'medium' },
    { name: 'Single Language (en-US)', detected: nav.singleLanguage, weight: 'weak' },
    { name: 'Do Not Track Enabled', detected: nav.doNotTrack, weight: 'weak' },
    { name: 'No Plugins', detected: nav.noPlugins && nav.isFirefox, weight: 'weak' },
    { name: 'High Latency Pattern', detected: latency.torPattern, weight: 'medium' },
  ];

  const vpnSignals = [
    { name: 'IP Flagged as Proxy', detected: ipReputation.proxy === true, weight: 'strong' },
    { name: 'IP Flagged as Hosting/DC', detected: ipReputation.hosting === true, weight: 'strong' },
    { name: 'Cloudflare WARP Active', detected: ipReputation.warp === true, weight: 'definitive' },
    { name: 'Elevated Latency', detected: latency.vpnPattern, weight: 'weak' },
  ];

  const torScore = torSignals.filter((s) => s.detected).length;
  const vpnScore = vpnSignals.filter((s) => s.detected).length;

  let verdict = 'clean';
  if (torCheck.isTor === true || torScore >= 4) verdict = 'tor';
  else if (vpnScore >= 2) verdict = 'vpn';
  else if (vpnScore >= 1 || torScore >= 2) verdict = 'suspicious';

  return {
    verdict,
    tor: {
      score: torScore,
      total: torSignals.length,
      signals: torSignals,
      exitNode: torCheck,
    },
    vpn: {
      score: vpnScore,
      total: vpnSignals.length,
      signals: vpnSignals,
      ipReputation,
    },
    details: {
      letterboxing,
      timing,
      canvas,
      navigator: nav,
      latency,
    },
  };
}
