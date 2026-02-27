import { Fingerprinter } from './src/fingerprinter.js';
import { CanvasCollector } from './src/collectors/canvas.js';
import { WebGLCollector } from './src/collectors/webgl.js';
import { NavigatorCollector } from './src/collectors/navigator.js';
import { ScreenCollector } from './src/collectors/screen.js';
import { TimezoneCollector } from './src/collectors/timezone.js';
import { AudioCollector } from './src/collectors/audio.js';
import { FontCollector } from './src/collectors/fonts.js';
import { MathCollector } from './src/collectors/math.js';
import { StorageCollector } from './src/collectors/storage.js';
import { JSEngineCollector } from './src/collectors/tor/js-engine.js';
import { CSSFeaturesCollector } from './src/collectors/tor/css-features.js';
import { PerformanceProfileCollector } from './src/collectors/tor/performance-profile.js';
import { FontMetricsCollector } from './src/collectors/tor/font-metrics.js';
import { WebGPUCollector } from './src/collectors/webgpu.js';
import { MediaCollector } from './src/collectors/media.js';
import { IntlCollector } from './src/collectors/intl.js';
import { WebRTCCollector } from './src/collectors/network/webrtc.js';
import { DnsProbeCollector } from './src/collectors/network/dns-probe.js';
import { BatteryCollector } from './src/collectors/network/battery.js';
import { FingerprintClient } from './src/client.js';

const API_ENDPOINT = 'https://bingo-barry.nl/fingerprint';

const results = document.getElementById('results');

const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const CHEVRON_ICON = '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

// Verbose signal groups that should be collapsed by default
const COLLAPSED_BY_DEFAULT = ['webgl', 'fonts', 'math'];

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

function isLongArray(value) {
  return Array.isArray(value) && value.length > 5;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = CHECK_ICON + ' Copied';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = COPY_ICON + ' Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

function renderValue(key, value) {
  const container = document.createElement('div');
  container.style.display = 'contents';

  // Canvas data URLs: render as images
  if (isDataUrl(value)) {
    const label = document.createElement('span');
    label.className = 'signal-value';
    label.textContent = 'Canvas image';

    const img = document.createElement('img');
    img.src = value;
    img.className = 'canvas-preview';
    img.alt = key + ' canvas render';

    container.appendChild(label);
    container.appendChild(img);
    return container;
  }

  // Long arrays: show count with expandable list
  if (isLongArray(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'signal-value';

    const summary = document.createElement('span');
    summary.className = 'value-summary';
    summary.textContent = value.length + ' items - show';

    const expanded = document.createElement('div');
    expanded.className = 'value-expanded';
    expanded.textContent = value.join('\n');

    summary.addEventListener('click', () => {
      const isVisible = expanded.classList.toggle('visible');
      summary.textContent = value.length + ' items - ' + (isVisible ? 'hide' : 'show');
    });

    wrapper.appendChild(summary);
    wrapper.appendChild(expanded);
    container.appendChild(wrapper);
    return container;
  }

  // Nested objects: render as mini table
  if (isObject(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'signal-value';

    const entries = Object.entries(value);

    // Simple flat object: show inline
    if (entries.length <= 4 && entries.every(([, v]) => typeof v !== 'object')) {
      wrapper.textContent = entries.map(([k, v]) => k + ': ' + v).join(', ');
      container.appendChild(wrapper);
      return container;
    }

    // Nested or large object: collapsible
    const summary = document.createElement('span');
    summary.className = 'value-summary';
    summary.textContent = entries.length + ' properties - show';

    const expanded = document.createElement('div');
    expanded.className = 'value-expanded';
    expanded.textContent = JSON.stringify(value, null, 2);

    summary.addEventListener('click', () => {
      const isVisible = expanded.classList.toggle('visible');
      summary.textContent = entries.length + ' properties - ' + (isVisible ? 'hide' : 'show');
    });

    wrapper.appendChild(summary);
    wrapper.appendChild(expanded);
    container.appendChild(wrapper);
    return container;
  }

  // Simple values
  const span = document.createElement('span');
  span.className = 'signal-value';
  span.textContent = String(value);
  container.appendChild(span);
  return container;
}

function renderSignalGroup(signal, index) {
  const group = document.createElement('div');
  group.className = 'signal-group fade-in fade-in-delay-' + Math.min(index + 3, 8);

  const collapsed = COLLAPSED_BY_DEFAULT.includes(signal.name.toLowerCase());

  if (!collapsed) {
    group.classList.add('expanded');
  }

  // Header
  const header = document.createElement('div');
  header.className = 'signal-group-header';

  const titleSection = document.createElement('div');
  titleSection.className = 'signal-group-title';

  const statusBadge = document.createElement('div');
  statusBadge.className = 'signal-status-badge ' + (signal.error ? 'error' : 'success');

  const h3 = document.createElement('h3');
  h3.textContent = signal.name;

  const desc = document.createElement('span');
  desc.className = 'description';
  desc.textContent = signal.description;

  titleSection.appendChild(statusBadge);
  titleSection.appendChild(h3);
  titleSection.appendChild(desc);

  const meta = document.createElement('div');
  meta.className = 'signal-group-meta';

  const duration = document.createElement('span');
  duration.className = 'signal-duration';
  duration.textContent = signal.duration.toFixed(1) + 'ms';

  meta.appendChild(duration);
  meta.insertAdjacentHTML('beforeend', CHEVRON_ICON);

  header.appendChild(titleSection);
  header.appendChild(meta);

  header.addEventListener('click', () => {
    group.classList.toggle('expanded');
  });

  group.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'signal-group-body';

  const content = document.createElement('div');
  content.className = 'signal-group-content';

  if (signal.error) {
    const row = document.createElement('div');
    row.className = 'signal-row';
    row.innerHTML = '<span class="signal-label">Error</span><span class="signal-value error-value">' + escapeHtml(signal.error) + '</span>';
    content.appendChild(row);
  } else if (signal.data) {
    for (const [key, value] of Object.entries(signal.data)) {
      const row = document.createElement('div');
      row.className = 'signal-row';

      const displayKey = key.startsWith('_') ? key.slice(1) : key;
      const label = document.createElement('span');
      label.className = 'signal-label';
      label.textContent = displayKey;
      row.appendChild(label);

      const rendered = renderValue(key, value);

      // If renderValue returned a container with an image, use a vertical layout
      if (rendered.querySelector && rendered.querySelector('.canvas-preview')) {
        row.style.flexDirection = 'column';
        row.style.gap = '0.4rem';
        const children = Array.from(rendered.childNodes);
        children.forEach(child => row.appendChild(child));
      } else {
        const children = Array.from(rendered.childNodes);
        children.forEach(child => row.appendChild(child));
      }

      content.appendChild(row);
    }
  }

  body.appendChild(content);
  group.appendChild(body);

  return group;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showLoading() {
  const collectors = ['canvas', 'webgl', 'navigator', 'screen', 'timezone'];

  results.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'loading-container';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = 'Collecting browser signals...';

  const dots = document.createElement('div');
  dots.className = 'loading-signals';

  collectors.forEach(name => {
    const dot = document.createElement('span');
    dot.className = 'loading-signal-dot';
    dot.textContent = name;
    dot.dataset.collector = name;
    dots.appendChild(dot);
  });

  container.appendChild(spinner);
  container.appendChild(text);
  container.appendChild(dots);
  results.appendChild(container);

  // Animate dots
  let i = 0;
  const interval = setInterval(() => {
    if (i < collectors.length) {
      const dot = dots.querySelector('[data-collector="' + collectors[i] + '"]');
      if (dot) dot.classList.add('active');
      i++;
    } else {
      clearInterval(interval);
    }
  }, 200);

  return () => clearInterval(interval);
}

async function collectFingerprint() {
  const stopLoading = showLoading();
  const client = new FingerprintClient(API_ENDPOINT);

  // Try to recover visitor ID from server ETag before collecting
  let serverVisitorId = null;
  try {
    serverVisitorId = await client.resolveEtag();
  } catch {
    // Server unavailable, continue without
  }

  // If server had our visitor ID, respawn it to local persistence
  if (serverVisitorId) {
    const { VisitorIdManager } = await import('./src/persistence/visitor-id-manager.js');
    const manager = new VisitorIdManager();
    // Write server's ID to all local mechanisms so fingerprinter picks it up
    try {
      const available = await Promise.all(
        manager.mechanisms.map(async m => {
          try { return (await m.isAvailable()) ? m : null; } catch { return null; }
        })
      );
      await Promise.all(
        available.filter(Boolean).map(m => m.write(serverVisitorId).catch(() => {}))
      );
    } catch {
      // Best effort
    }
  }

  const dnsProbeCollector = new DnsProbeCollector();
  try {
    const probes = await client.fetchDnsProbes();
    dnsProbeCollector.setProbes(probes);
  } catch {
    // Server unavailable
  }

  const fingerprinter = new Fingerprinter();
  fingerprinter
    .register(new CanvasCollector())
    .register(new WebGLCollector())
    .register(new NavigatorCollector())
    .register(new ScreenCollector())
    .register(new TimezoneCollector())
    .register(new AudioCollector())
    .register(new FontCollector())
    .register(new MathCollector())
    .register(new StorageCollector())
    .register(new JSEngineCollector())
    .register(new CSSFeaturesCollector())
    .register(new PerformanceProfileCollector())
    .register(new FontMetricsCollector())
    .register(new WebGPUCollector())
    .register(new MediaCollector())
    .register(new IntlCollector())
    .register(new WebRTCCollector())
    .register(new BatteryCollector())
    .register(dnsProbeCollector);

  const startTime = performance.now();
  const result = await fingerprinter.collect();
  const totalTime = performance.now() - startTime;

  stopLoading();
  results.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'dashboard-header fade-in';
  header.innerHTML =
    '<h1>Browser Fingerprint</h1>' +
    '<div class="subtitle">Unique browser identification signals</div>' +
    '<div class="total-time">Collected in ' + totalTime.toFixed(0) + 'ms</div>';
  results.appendChild(header);

  // Hash cards
  const hashCards = document.createElement('div');
  hashCards.className = 'hash-cards fade-in fade-in-delay-1';

  // Browser fingerprint card (green)
  const browserCard = document.createElement('div');
  browserCard.className = 'hash-card browser';

  const browserLabel = document.createElement('div');
  browserLabel.className = 'hash-card-label';
  browserLabel.textContent = 'Browser Fingerprint';

  const browserId = document.createElement('div');
  browserId.className = 'hash-card-readable';
  browserId.textContent = result.readableFingerprint;

  const browserHash = document.createElement('div');
  browserHash.id = 'fingerprint-hash';
  browserHash.className = 'hash-card-value hash-card-raw';
  browserHash.textContent = result.fingerprint;

  const browserActions = document.createElement('div');
  browserActions.className = 'hash-card-actions';

  const browserCopy = document.createElement('button');
  browserCopy.className = 'copy-btn';
  browserCopy.innerHTML = COPY_ICON + ' Copy';
  browserCopy.addEventListener('click', () => copyToClipboard(result.fingerprint, browserCopy));

  browserActions.appendChild(browserCopy);
  browserCard.appendChild(browserLabel);
  browserCard.appendChild(browserId);
  browserCard.appendChild(browserHash);
  browserCard.appendChild(browserActions);

  // Device ID card (orange)
  const deviceCard = document.createElement('div');
  deviceCard.className = 'hash-card device-id';

  const deviceLabel = document.createElement('div');
  deviceLabel.className = 'hash-card-label';
  deviceLabel.textContent = 'Device ID';

  const deviceReadable = document.createElement('div');
  deviceReadable.className = 'hash-card-readable';
  deviceReadable.textContent = result.readableDeviceId || 'N/A';

  const deviceHash = document.createElement('div');
  deviceHash.id = 'device-id';
  deviceHash.className = 'hash-card-value hash-card-raw';
  deviceHash.textContent = result.deviceId || 'N/A';

  const deviceActions = document.createElement('div');
  deviceActions.className = 'hash-card-actions';

  const deviceCopy = document.createElement('button');
  deviceCopy.className = 'copy-btn';
  deviceCopy.innerHTML = COPY_ICON + ' Copy';
  deviceCopy.addEventListener('click', () => copyToClipboard(result.deviceId || 'N/A', deviceCopy));

  deviceActions.appendChild(deviceCopy);
  deviceCard.appendChild(deviceLabel);
  deviceCard.appendChild(deviceReadable);
  deviceCard.appendChild(deviceHash);
  deviceCard.appendChild(deviceActions);

  // Visitor ID card (blue)
  const visitorCard = document.createElement('div');
  visitorCard.className = 'hash-card visitor-id';

  const visitorLabel = document.createElement('div');
  visitorLabel.className = 'hash-card-label';
  visitorLabel.textContent = 'Visitor ID';

  const visitorReadable = document.createElement('div');
  visitorReadable.className = 'hash-card-readable';
  visitorReadable.textContent = result.visitorId || 'N/A';

  const visitorHash = document.createElement('div');
  visitorHash.id = 'visitor-id';
  visitorHash.className = 'hash-card-value hash-card-raw';
  visitorHash.textContent = result.visitorId || 'N/A';

  const visitorActions = document.createElement('div');
  visitorActions.className = 'hash-card-actions';

  const visitorCopy = document.createElement('button');
  visitorCopy.className = 'copy-btn';
  visitorCopy.innerHTML = COPY_ICON + ' Copy';
  visitorCopy.addEventListener('click', () => copyToClipboard(result.visitorId || 'N/A', visitorCopy));

  visitorActions.appendChild(visitorCopy);
  visitorCard.appendChild(visitorLabel);
  visitorCard.appendChild(visitorReadable);
  visitorCard.appendChild(visitorHash);
  visitorCard.appendChild(visitorActions);

  hashCards.appendChild(browserCard);
  hashCards.appendChild(deviceCard);
  hashCards.appendChild(visitorCard);
  results.appendChild(hashCards);

  // Submit to server for probabilistic matching
  client.submit(result).then(async serverResult => {
    // Store ETag for server-side persistence
    const effectiveVisitorId = serverResult.matchedVisitorId || result.visitorId;
    if (effectiveVisitorId) {
      client.storeEtag(effectiveVisitorId).catch(() => {});
    }

    if (serverResult.matchedVisitorId && serverResult.matchedVisitorId !== result.visitorId) {
      // Server matched us to an existing visitor (cross-device or post-clear)
      // Adopt the server's visitor ID and respawn to all local storage
      visitorHash.textContent = serverResult.matchedVisitorId;
      visitorReadable.textContent = 'Server matched (' + (serverResult.confidence * 100).toFixed(0) + '%)';
      visitorReadable.style.color = 'var(--accent-green)';

      // Respawn server's ID to all local persistence layers
      try {
        const { VisitorIdManager } = await import('./src/persistence/visitor-id-manager.js');
        const manager = new VisitorIdManager();
        const available = await Promise.all(
          manager.mechanisms.map(async m => {
            try { return (await m.isAvailable()) ? m : null; } catch { return null; }
          })
        );
        await Promise.all(
          available.filter(Boolean).map(m => m.write(serverResult.matchedVisitorId).catch(() => {}))
        );
      } catch {
        // Best effort
      }
    } else if (serverResult.confidence > 0) {
      // Same visitor ID confirmed by server
      visitorReadable.textContent = 'Confirmed (' + (serverResult.confidence * 100).toFixed(0) + '%)';
      visitorReadable.style.color = 'var(--accent-green)';
    } else {
      visitorReadable.textContent = 'New visitor';
    }

    // Show server match details below the visitor ID card
    const matchInfo = document.createElement('div');
    matchInfo.className = 'server-match-info fade-in';
    if (serverResult.matchedSignals && serverResult.matchedSignals.length > 0) {
      matchInfo.innerHTML =
        '<span class="match-label">Matched signals:</span> ' +
        '<span class="match-signals">' + serverResult.matchedSignals.join(', ') + '</span>';
    } else {
      matchInfo.innerHTML = '<span class="match-label">No previous profile matched</span>';
    }
    visitorCard.appendChild(matchInfo);
  }).catch(() => {
    // Server unavailable — visitor ID still works locally via persistence layer
    visitorReadable.textContent = result.visitorId ? 'Local only (server offline)' : 'N/A';
    visitorReadable.style.color = 'var(--text-secondary)';
  });

  // Device signal debug: show exactly what's being hashed
  const deviceDebug = document.createElement('div');
  deviceDebug.className = 'signal-group fade-in fade-in-delay-2';
  deviceDebug.classList.add('expanded');

  const deviceDebugHeader = document.createElement('div');
  deviceDebugHeader.className = 'signal-group-header';
  deviceDebugHeader.innerHTML =
    '<div class="signal-group-title"><div class="signal-status-badge success"></div>' +
    '<h3>Device Signals</h3>' +
    '<span class="description">Exact data used for Device ID hash</span></div>' +
    '<div class="signal-group-meta">' + CHEVRON_ICON + '</div>';
  deviceDebugHeader.addEventListener('click', () => {
    deviceDebug.classList.toggle('expanded');
  });
  deviceDebug.appendChild(deviceDebugHeader);

  const deviceDebugBody = document.createElement('div');
  deviceDebugBody.className = 'signal-group-body';
  const deviceDebugContent = document.createElement('div');
  deviceDebugContent.className = 'signal-group-content';

  for (const signal of result.signals) {
    if (!signal.deviceData || Object.keys(signal.deviceData).length === 0) continue;
    for (const [key, value] of Object.entries(signal.deviceData)) {
      const row = document.createElement('div');
      row.className = 'signal-row';
      row.innerHTML =
        '<span class="signal-label">' + escapeHtml(signal.name + '.' + key) + '</span>' +
        '<span class="signal-value">' + escapeHtml(String(value)) + '</span>';
      deviceDebugContent.appendChild(row);
    }
  }

  deviceDebugBody.appendChild(deviceDebugContent);
  deviceDebug.appendChild(deviceDebugBody);
  results.appendChild(deviceDebug);

  // Signals header
  const signalsHeader = document.createElement('div');
  signalsHeader.className = 'signals-header fade-in fade-in-delay-2';
  signalsHeader.textContent = 'Signal Groups (' + result.signals.length + ')';
  results.appendChild(signalsHeader);

  // Signal groups
  result.signals.forEach((signal, index) => {
    results.appendChild(renderSignalGroup(signal, index));
  });
}

collectFingerprint();
