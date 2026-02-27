import { useState, useEffect } from 'react';
import { collectAllSignals } from './collectors';
import './App.css';

const LOGO_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/75.0.0';

function getBrowserIcon(browser) {
  const b = browser.toLowerCase();
  if (b.includes('chrome')) return `${LOGO_CDN}/chrome/chrome_64x64.png`;
  if (b.includes('firefox')) return `${LOGO_CDN}/firefox/firefox_64x64.png`;
  if (b.includes('safari')) return `${LOGO_CDN}/safari/safari_64x64.png`;
  if (b.includes('edge')) return `${LOGO_CDN}/edge/edge_64x64.png`;
  if (b.includes('opera')) return `${LOGO_CDN}/opera/opera_64x64.png`;
  return null;
}

function getOSIcon(os) {
  const o = os.toLowerCase();
  if (o.includes('windows')) return '🪟';
  if (o.includes('mac') || o.includes('ios')) return '🍎';
  if (o.includes('linux')) return '🐧';
  if (o.includes('android')) return '🤖';
  if (o.includes('chrome')) return '💻';
  return '🖥️';
}

function getDeviceIcon(type) {
  if (type === 'Mobile') return '📱';
  if (type === 'Tablet') return '📋';
  return '🖥️';
}

function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌍';
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

function InfoItem({ icon, label, value, highlight }) {
  return (
    <div className={`info-item ${highlight ? 'info-highlight' : ''}`}>
      <span className="info-icon">{icon}</span>
      <div className="info-text">
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
      </div>
    </div>
  );
}

function SignalCard({ title, icon, entropy, data }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="signal-card" onClick={() => setExpanded(!expanded)}>
      <div className="signal-header">
        <span className="signal-icon">{icon}</span>
        <span className="signal-title">{title}</span>
        <span className={`entropy-badge entropy-${entropy}`}>
          {entropy}
        </span>
        <span className="expand-icon">{expanded ? '−' : '+'}</span>
      </div>
      {expanded && (
        <pre className="signal-data">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectAllSignals().then((r) => {
      setResult(r);
      setLoading(false);
    });
  }, []);

  const recollect = () => {
    setLoading(true);
    collectAllSignals().then((r) => {
      setResult(r);
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <p>Collecting fingerprint signals...</p>
        </div>
      </div>
    );
  }

  const { fingerprintId, stableFingerprint, thumbmarkId, thumbmarkComponents, categoryFingerprints, scanList, collectionTimeMs, signals, general, privacyCheck, collectedAt } = result;

  const signalCards = [
    { title: 'Canvas', icon: '🎨', entropy: 'high', data: { ...signals.canvas, dataURL: signals.canvas.dataURL ? `[${signals.canvas.length} chars]` : null } },
    { title: 'WebGL', icon: '🔺', entropy: 'high', data: signals.webgl },
    { title: 'Audio', icon: '🔊', entropy: 'high', data: { ...signals.audio, ...signals.audioContext } },
    { title: 'Screen & Display', icon: '🖥️', entropy: 'medium', data: signals.screen },
    { title: 'Fonts', icon: '🔤', entropy: 'high', data: signals.fonts },
    { title: 'Navigator', icon: '🧭', entropy: 'medium', data: signals.navigator },
    { title: 'CSS Media Queries', icon: '📐', entropy: 'medium', data: signals.cssMedia },
    { title: 'Media Devices', icon: '📷', entropy: 'medium', data: signals.mediaDevices },
    { title: 'Storage', icon: '💾', entropy: 'low', data: signals.storage },
    { title: 'Timing & Timezone', icon: '⏱️', entropy: 'medium', data: signals.timing },
    { title: 'WebRTC', icon: '🌐', entropy: 'high', data: signals.webrtc },
    { title: 'Math Fingerprint', icon: '🧮', entropy: 'medium', data: signals.math },
    { title: 'Permissions', icon: '🔒', entropy: 'medium', data: signals.permissions },
    { title: 'ThumbmarkJS Components', icon: '👆', entropy: 'high', data: thumbmarkComponents },
  ];

  const totalSignals = Object.values(signals).reduce((acc, section) => {
    return acc + Object.keys(section).length;
  }, 0);

  return (
    <div className="app">
      <header className="header">
        <h1>Batu's Browser Fingerprint</h1>
        <p className="subtitle">Signal Collection Dashboard</p>
      </header>

      <div className="fingerprint-box">
        <div className="fp-main">
          <div className="fp-label">Your Visitor Fingerprint</div>
          <div className="fp-hash-big">{stableFingerprint}</div>
          <div className="fp-sublabel">Cross-browser stable ID (Device + Network + Locale + Fonts)</div>
        </div>

        <div className="fp-secondary-row">
          <div className="fp-secondary">
            <div className="fp-sec-label">Full Fingerprint</div>
            <div className="fp-sec-hash">{fingerprintId}</div>
            <div className="fp-sec-note">All signals (browser-specific)</div>
          </div>
          <div className="fp-sec-divider" />
          <div className="fp-secondary">
            <div className="fp-sec-label">ThumbmarkJS</div>
            <div className="fp-sec-hash fp-sec-hash-tm">{thumbmarkId || 'N/A'}</div>
            <div className="fp-sec-note">Third-party library</div>
          </div>
        </div>

        <div className="fp-scans">
          <div className="fp-scans-title">{scanList.length} scans performed in {collectionTimeMs}ms</div>
          <div className="fp-scans-list">
            {scanList.map((scan) => {
              const stable = ['device', 'fonts', 'network', 'locale'].includes(scan.category);
              return (
                <span key={scan.name} className={`fp-scan-tag ${stable ? 'scan-stable' : 'scan-varies'}`}>
                  <span className="scan-icon">{scan.icon}</span>
                  {scan.name}
                </span>
              );
            })}
          </div>
        </div>

        <div className="fp-meta">
          <span>{totalSignals} signals</span>
          <span>{new Date(collectedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <button className="recollect-btn" onClick={recollect}>
        Re-collect Fingerprint
      </button>

      <div className="general-card">
        <div className="general-header">
          <div className="general-hero">
            {getBrowserIcon(general.browser) && (
              <img src={getBrowserIcon(general.browser)} alt="" className="browser-logo" />
            )}
            <div>
              <div className="general-browser">{general.browser}</div>
              <div className="general-os">{getOSIcon(general.os)} {general.os} &middot; {getDeviceIcon(general.deviceType)} {general.deviceType}</div>
            </div>
          </div>
          {general.location && (
            <div className="general-location">
              <span className="location-flag">{getFlagEmoji(general.location.countryCode)}</span>
              <div>
                <div className="location-city">{general.location.city}, {general.location.country}</div>
                <div className="location-detail">{general.ip} &middot; {general.location.isp}</div>
              </div>
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="info-section-title">Display</div>
          <div className="info-grid">
            <InfoItem icon="🖥️" label="Resolution" value={`${general.screenResolution} @ ${general.pixelRatio}x`} />
            <InfoItem icon="🎨" label="Color Depth" value={general.colorDepth} />
            <InfoItem icon="👆" label="Touchscreen" value={general.touchscreen ? 'Yes' : 'No'} />
          </div>
        </div>

        <div className="info-section">
          <div className="info-section-title">Hardware</div>
          <div className="info-grid">
            <InfoItem icon="⚡" label="CPU Cores" value={general.cores} />
            <InfoItem icon="🧠" label="Memory" value={general.memory} />
            <InfoItem icon="📐" label="Platform" value={general.platform} />
          </div>
        </div>

        <div className="info-section">
          <div className="info-section-title">Locale & Privacy</div>
          <div className="info-grid">
            <InfoItem icon="🌐" label="Language" value={general.language} />
            <InfoItem icon="🕐" label="Timezone" value={general.timezone} />
            <InfoItem icon="🍪" label="Cookies" value={general.cookiesEnabled ? 'Enabled' : 'Disabled'} />
            <InfoItem icon="🛡️" label="Do Not Track" value={general.doNotTrack || 'Not set'} />
            {general.location && (
              <InfoItem icon="📍" label="Coordinates" value={`${general.location.latitude}, ${general.location.longitude}`} />
            )}
          </div>
        </div>
      </div>

      <div className="privacy-card">
        <div className="privacy-header">
          <span className={`privacy-verdict verdict-${privacyCheck.verdict}`}>
            {privacyCheck.verdict === 'tor' && '🧅 Tor Detected'}
            {privacyCheck.verdict === 'vpn' && '🛡️ VPN / Proxy Detected'}
            {privacyCheck.verdict === 'suspicious' && '⚠️ Suspicious'}
            {privacyCheck.verdict === 'clean' && '✅ No VPN/Proxy Detected'}
          </span>
          <span className="privacy-scores">
            Tor: {privacyCheck.tor.score}/{privacyCheck.tor.total} &middot; VPN: {privacyCheck.vpn.score}/{privacyCheck.vpn.total}
          </span>
        </div>

        <div className="privacy-signals">
          <div className="privacy-col">
            <div className="privacy-col-title">Tor Signals</div>
            {privacyCheck.tor.signals.map((s) => (
              <div key={s.name} className={`privacy-signal ${s.detected ? 'signal-detected' : 'signal-clear'}`}>
                <span className="signal-dot">{s.detected ? '🔴' : '🟢'}</span>
                <span className="signal-name">{s.name}</span>
                <span className={`signal-weight weight-${s.weight}`}>{s.weight}</span>
              </div>
            ))}
          </div>
          <div className="privacy-col">
            <div className="privacy-col-title">VPN Signals</div>
            {privacyCheck.vpn.signals.map((s) => (
              <div key={s.name} className={`privacy-signal ${s.detected ? 'signal-detected' : 'signal-clear'}`}>
                <span className="signal-dot">{s.detected ? '🔴' : '🟢'}</span>
                <span className="signal-name">{s.name}</span>
                <span className={`signal-weight weight-${s.weight}`}>{s.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="category-section">
        <div className="category-section-title">Fingerprint Breakdown</div>
        <p className="category-section-desc">
          Separate hashes for different signal categories. Device, Network, Locale, and Fonts should stay
          the <strong>same</strong> across browsers on the same machine. Browser and Rendering will <strong>differ</strong>.
        </p>
        <div className="category-grid">
          {Object.entries(categoryFingerprints).map(([key, cat]) => {
            const stable = ['device', 'network', 'locale', 'fonts'].includes(key);
            return (
              <div key={key} className={`category-card ${stable ? 'category-stable' : 'category-varies'}`}>
                <div className="category-card-header">
                  <span className="category-card-icon">{cat.icon}</span>
                  <span className="category-card-label">{cat.label}</span>
                  <span className={`category-badge ${stable ? 'badge-stable' : 'badge-varies'}`}>
                    {stable ? 'cross-browser' : 'browser-specific'}
                  </span>
                </div>
                <div className="category-hash">{cat.hash}</div>
                <div className="category-desc">{cat.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {signals.canvas.dataURL && (
        <div className="canvas-preview">
          <div className="canvas-label">Canvas Rendering</div>
          <img src={signals.canvas.dataURL} alt="Canvas fingerprint" />
        </div>
      )}

      <div className="signals-grid">
        {signalCards.map((card) => (
          <SignalCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

export default App;
