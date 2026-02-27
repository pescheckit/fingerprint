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
import { MouseCollector } from './src/collectors/network/mouse.js';
import { FingerprintClient } from './src/client.js';

const API_ENDPOINT = 'https://bingo-barry.nl/fingerprint';
const results = document.getElementById('results');

// --- Category system ---
const CATEGORIES = {
  core:     { label: 'Core',     accent: '--cyan',   signals: ['canvas', 'webgl', 'audio', 'math'] },
  hardware: { label: 'Hardware', accent: '--amber',  signals: ['navigator', 'screen', 'webgpu', 'battery', 'mouse'] },
  network:  { label: 'Network',  accent: '--purple', signals: ['timezone', 'webrtc', 'dns-probe'] },
  privacy:  { label: 'Privacy',  accent: '--green',  signals: ['storage', 'fonts', 'cssFeatures'] },
  advanced: { label: 'Advanced', accent: '--blue',   signals: ['jsEngine', 'performanceProfile', 'fontMetrics', 'media', 'intl'] },
};

const COLLAPSED_BY_DEFAULT = ['webgl', 'fonts', 'math', 'cssFeatures', 'fontMetrics'];

// --- SVG Icons ---
const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const CHEVRON_ICON = '<svg class="signal-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

// --- Utilities ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

function isLongArray(value) {
  return Array.isArray(value) && value.length > 5;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function categorize(signalName) {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.signals.includes(signalName)) return key;
  }
  return 'advanced'; // fallback
}

function syntaxHighlightJSON(json) {
  return escapeHtml(json)
    .replace(/&quot;([^&]*?)&quot;\s*:/g, '<span class="json-key">"$1"</span>:')
    .replace(/:\s*&quot;([^&]*?)&quot;/g, ': <span class="json-string">"$1"</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

// --- Copy to clipboard ---
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = CHECK_ICON + ' copied';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = COPY_ICON + ' copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// --- Type reveal animation ---
function typeReveal(element, text, speed = 22) {
  element.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  cursor.textContent = '\u258C';
  element.appendChild(cursor);

  let i = 0;
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (i < text.length) {
        element.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
      } else {
        clearInterval(interval);
        cursor.remove();
        resolve();
      }
    }, speed);
  });
}

// --- Lightbox ---
function showLightbox(src, alt) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || 'Preview';
  overlay.appendChild(img);
  overlay.addEventListener('click', () => overlay.remove());
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handler);
    }
  });
  document.body.appendChild(overlay);
}

// --- Value renderers ---
function renderValue(key, value) {
  const container = document.createElement('div');
  container.style.display = 'contents';

  // Canvas data URLs → image preview with lightbox
  if (isDataUrl(value)) {
    const label = document.createElement('span');
    label.className = 'signal-val';
    label.textContent = 'Canvas image';

    const img = document.createElement('img');
    img.src = value;
    img.className = 'canvas-preview';
    img.alt = key + ' canvas render';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      showLightbox(value, key);
    });

    container.appendChild(label);
    container.appendChild(img);
    return container;
  }

  // Long arrays → paginated
  if (isLongArray(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'signal-val';

    const PAGE_SIZE = 20;
    let page = 0;
    const totalPages = Math.ceil(value.length / PAGE_SIZE);

    const summary = document.createElement('span');
    summary.className = 'val-summary';
    summary.textContent = value.length + ' items \u25B8';

    const expanded = document.createElement('div');
    expanded.className = 'val-expanded';

    const listEl = document.createElement('div');
    const controlsEl = document.createElement('div');
    controlsEl.className = 'val-page-controls';

    function renderPage() {
      const start = page * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, value.length);
      listEl.textContent = value.slice(start, end).join('\n');

      controlsEl.innerHTML = '';
      if (totalPages > 1) {
        const prev = document.createElement('button');
        prev.className = 'val-page-btn';
        prev.textContent = '\u25C0';
        prev.disabled = page === 0;
        prev.addEventListener('click', (e) => { e.stopPropagation(); page--; renderPage(); });

        const info = document.createElement('span');
        info.className = 'val-page-info';
        info.textContent = (start + 1) + '-' + end + ' of ' + value.length;

        const next = document.createElement('button');
        next.className = 'val-page-btn';
        next.textContent = '\u25B6';
        next.disabled = page >= totalPages - 1;
        next.addEventListener('click', (e) => { e.stopPropagation(); page++; renderPage(); });

        controlsEl.appendChild(prev);
        controlsEl.appendChild(info);
        controlsEl.appendChild(next);
      }
    }

    summary.addEventListener('click', () => {
      const isVisible = expanded.classList.toggle('visible');
      summary.textContent = value.length + ' items ' + (isVisible ? '\u25BE' : '\u25B8');
      if (isVisible && listEl.textContent === '') renderPage();
    });

    expanded.appendChild(listEl);
    expanded.appendChild(controlsEl);
    wrapper.appendChild(summary);
    wrapper.appendChild(expanded);
    container.appendChild(wrapper);
    return container;
  }

  // Objects → syntax-highlighted JSON with collapse
  if (isObject(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'signal-val';
    const entries = Object.entries(value);

    // Small flat objects: inline
    if (entries.length <= 4 && entries.every(([, v]) => typeof v !== 'object')) {
      wrapper.textContent = entries.map(([k, v]) => k + ': ' + v).join(', ');
      container.appendChild(wrapper);
      return container;
    }

    // Large/nested: collapsible syntax-highlighted JSON
    const summary = document.createElement('span');
    summary.className = 'val-summary';
    summary.textContent = entries.length + ' props \u25B8';

    const expanded = document.createElement('div');
    expanded.className = 'val-expanded';
    expanded.innerHTML = syntaxHighlightJSON(JSON.stringify(value, null, 2));

    summary.addEventListener('click', () => {
      const isVisible = expanded.classList.toggle('visible');
      summary.textContent = entries.length + ' props ' + (isVisible ? '\u25BE' : '\u25B8');
    });

    wrapper.appendChild(summary);
    wrapper.appendChild(expanded);
    container.appendChild(wrapper);
    return container;
  }

  // Simple values
  const span = document.createElement('span');
  span.className = 'signal-val';
  span.textContent = String(value);
  container.appendChild(span);
  return container;
}

// Category color map for CSS variable injection
const CATEGORY_COLORS = {
  core: '--cyan',
  hardware: '--amber',
  network: '--purple',
  privacy: '--green',
  advanced: '--magenta',
};

// --- Signal card renderer ---
function renderSignalCard(signal, maxDuration) {
  const card = document.createElement('div');
  card.className = 'signal-card';
  card.dataset.signal = signal.name;

  // Inject category color
  const cat = categorize(signal.name);
  const colorVar = CATEGORY_COLORS[cat] || '--cyan';
  card.style.setProperty('--cat-color', 'var(' + colorVar + ')');

  const collapsed = COLLAPSED_BY_DEFAULT.includes(signal.name);
  if (!collapsed) card.classList.add('expanded');

  // Header
  const header = document.createElement('div');
  header.className = 'signal-card-header';

  const dot = document.createElement('div');
  dot.className = 'signal-dot ' + (signal.error ? 'err' : 'ok');

  const name = document.createElement('span');
  name.className = 'signal-name';
  name.textContent = signal.name;

  const desc = document.createElement('span');
  desc.className = 'signal-desc';
  desc.textContent = signal.description || '';

  // Duration bar
  const durBar = document.createElement('div');
  durBar.className = 'signal-dur-bar';
  const durFill = document.createElement('div');
  const pct = maxDuration > 0 ? (signal.duration / maxDuration) * 100 : 0;
  durFill.className = 'signal-dur-fill ' + (pct < 33 ? 'fast' : pct < 66 ? 'medium' : 'slow');
  durFill.style.width = pct + '%';
  durBar.appendChild(durFill);

  const dur = document.createElement('span');
  dur.className = 'signal-dur';
  dur.textContent = signal.duration.toFixed(1) + 'ms';

  const chevronWrapper = document.createElement('span');
  chevronWrapper.innerHTML = CHEVRON_ICON;

  header.appendChild(dot);
  header.appendChild(name);
  header.appendChild(desc);
  header.appendChild(durBar);
  header.appendChild(dur);
  header.appendChild(chevronWrapper);

  header.addEventListener('click', () => card.classList.toggle('expanded'));
  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'signal-card-body';

  const content = document.createElement('div');
  content.className = 'signal-card-content';

  if (signal.error) {
    const row = document.createElement('div');
    row.className = 'signal-row';
    row.innerHTML = '<span class="signal-key">Error</span><span class="signal-val error-val">' + escapeHtml(signal.error) + '</span>';
    content.appendChild(row);
  } else if (signal.data) {
    for (const [key, value] of Object.entries(signal.data)) {
      const row = document.createElement('div');
      row.className = 'signal-row';

      const displayKey = key.startsWith('_') ? key.slice(1) : key;
      const label = document.createElement('span');
      label.className = 'signal-key';
      label.textContent = displayKey;
      row.appendChild(label);

      const rendered = renderValue(key, value);

      if (rendered.querySelector && rendered.querySelector('.canvas-preview')) {
        row.style.flexDirection = 'column';
        row.style.gap = '0.35rem';
      }

      const children = Array.from(rendered.childNodes);
      children.forEach(child => row.appendChild(child));
      content.appendChild(row);
    }
  }

  body.appendChild(content);
  card.appendChild(body);

  return card;
}

// --- Loading screen ---
function showLoading() {
  results.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'loading-screen';

  const timer = document.createElement('div');
  timer.className = 'loading-timer';
  timer.textContent = '0.000s';

  const label = document.createElement('div');
  label.className = 'loading-label';
  label.textContent = 'Collecting signals';

  const progress = document.createElement('div');
  progress.className = 'loading-progress';
  progress.innerHTML = '<div class="loading-progress-fill"></div>';

  const signalList = document.createElement('div');
  signalList.className = 'loading-signals';

  const allSignals = ['canvas', 'webgl', 'navigator', 'screen', 'timezone', 'audio',
    'fonts', 'math', 'storage', 'jsEngine', 'cssFeatures', 'performanceProfile',
    'fontMetrics', 'webgpu', 'media', 'intl', 'webrtc', 'battery', 'dns-probe', 'mouse'];

  allSignals.forEach(name => {
    const el = document.createElement('span');
    el.className = 'loading-signal';
    el.textContent = name;
    el.dataset.signal = name;
    signalList.appendChild(el);
  });

  screen.appendChild(timer);
  screen.appendChild(label);
  screen.appendChild(progress);
  screen.appendChild(signalList);
  results.appendChild(screen);

  // Animated timer
  const startMs = performance.now();
  let frame;
  function tick() {
    const elapsed = (performance.now() - startMs) / 1000;
    timer.textContent = elapsed.toFixed(3) + 's';
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);

  // Fake staggered signal activation
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < allSignals.length) {
      const el = signalList.querySelector('[data-signal="' + allSignals[idx] + '"]');
      if (el) el.classList.add('active');
      idx++;
    } else {
      clearInterval(interval);
    }
  }, 100);

  return () => {
    cancelAnimationFrame(frame);
    clearInterval(interval);
  };
}

// --- Build the dashboard ---
function buildDashboard(result, totalTime) {
  results.innerHTML = '';

  const maxDuration = Math.max(...result.signals.map(s => s.duration));
  const okCount = result.signals.filter(s => !s.error).length;
  const errCount = result.signals.filter(s => s.error).length;

  // === Topbar ===
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.innerHTML =
    '<div class="topbar-brand">FINGERPRINT</div>' +
    '<div class="topbar-stats">' +
      '<span class="topbar-stat"><span class="topbar-stat-value">' + result.signals.length + '</span> signals</span>' +
      '<span class="topbar-stat"><span class="topbar-stat-value">' + totalTime.toFixed(0) + 'ms</span></span>' +
    '</div>';

  // === Dashboard shell ===
  const dashboard = document.createElement('div');
  dashboard.className = 'dashboard';

  // === Sidebar ===
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  // Browser fingerprint card
  const browserCard = createIdCard('browser', 'Browser Fingerprint', result.readableFingerprint, result.fingerprint);
  sidebar.appendChild(browserCard.el);

  // Device ID card
  const deviceCard = createIdCard('device', 'Device ID', result.readableDeviceId || 'N/A', result.deviceId || 'N/A');
  sidebar.appendChild(deviceCard.el);

  // Visitor ID card
  const visitorCard = createIdCard('visitor', 'Visitor ID', result.visitorId || 'N/A', result.visitorId || 'N/A');
  sidebar.appendChild(visitorCard.el);

  dashboard.appendChild(sidebar);

  // === Main content ===
  const content = document.createElement('main');
  content.className = 'content';

  // Health bar
  const healthBar = document.createElement('div');
  healthBar.className = 'health-bar cascade';
  healthBar.style.animationDelay = '0.1s';

  const healthTrack = document.createElement('div');
  healthTrack.className = 'health-track';

  const healthOk = document.createElement('div');
  healthOk.className = 'health-fill-ok';
  healthOk.style.width = (okCount / result.signals.length * 100) + '%';

  const healthErr = document.createElement('div');
  healthErr.className = 'health-fill-err';
  healthErr.style.width = (errCount / result.signals.length * 100) + '%';

  healthTrack.appendChild(healthOk);
  healthTrack.appendChild(healthErr);

  const healthLabel = document.createElement('div');
  healthLabel.className = 'health-label';
  healthLabel.innerHTML = '<strong>' + okCount + '/' + result.signals.length + '</strong> OK' +
    (errCount > 0 ? ' &middot; <span style="color:var(--red)">' + errCount + ' err</span>' : '');

  healthBar.appendChild(healthTrack);
  healthBar.appendChild(healthLabel);
  content.appendChild(healthBar);

  // Device debug section
  const deviceDebug = buildDeviceDebug(result);
  if (deviceDebug) {
    deviceDebug.classList.add('cascade');
    deviceDebug.style.animationDelay = '0.15s';
    content.appendChild(deviceDebug);
  }

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar cascade';
  tabBar.style.animationDelay = '0.2s';

  // Signal grid
  const grid = document.createElement('div');
  grid.className = 'signal-grid';

  // Group signals by category
  const grouped = {};
  for (const cat of Object.keys(CATEGORIES)) grouped[cat] = [];
  result.signals.forEach(signal => {
    const cat = categorize(signal.name);
    if (grouped[cat]) grouped[cat].push(signal);
    else grouped.advanced.push(signal);
  });

  // Build tabs
  let activeTab = 'all';

  const allTab = document.createElement('button');
  allTab.className = 'tab active';
  allTab.style.setProperty('--tab-accent', 'var(--text-2)');
  allTab.innerHTML = 'All <span class="tab-badge">' + result.signals.length + '</span>';
  allTab.addEventListener('click', () => switchTab('all'));
  tabBar.appendChild(allTab);

  const tabRefs = { all: allTab };

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const count = grouped[key].length;
    if (count === 0) continue;

    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.style.setProperty('--tab-accent', 'var(' + cat.accent + ')');
    tab.innerHTML = cat.label + ' <span class="tab-badge">' + count + '</span>';
    tab.addEventListener('click', () => switchTab(key));
    tabBar.appendChild(tab);
    tabRefs[key] = tab;
  }

  function switchTab(key) {
    if (key === activeTab) return;
    activeTab = key;

    // Update tab states
    for (const [k, tabEl] of Object.entries(tabRefs)) {
      tabEl.classList.toggle('active', k === key);
    }

    // Re-render grid
    renderGrid();
  }

  function renderGrid() {
    grid.innerHTML = '';

    if (activeTab === 'all') {
      let delay = 0;
      for (const [key, cat] of Object.entries(CATEGORIES)) {
        if (grouped[key].length === 0) continue;

        const header = document.createElement('div');
        header.className = 'category-header cascade';
        header.style.animationDelay = (0.25 + delay * 0.03) + 's';
        header.style.color = 'var(' + cat.accent + ')';
        header.style.setProperty('--cat-color', 'var(' + cat.accent + ')');
        header.textContent = cat.label;
        grid.appendChild(header);
        delay++;

        grouped[key].forEach(signal => {
          const card = renderSignalCard(signal, maxDuration);
          card.classList.add('cascade');
          card.style.animationDelay = (0.25 + delay * 0.03) + 's';
          grid.appendChild(card);
          delay++;
        });
      }
    } else {
      const cat = CATEGORIES[activeTab];
      let delay = 0;
      grouped[activeTab].forEach(signal => {
        const card = renderSignalCard(signal, maxDuration);
        card.classList.add('cascade');
        card.style.animationDelay = (0.05 + delay * 0.04) + 's';
        grid.appendChild(card);
        delay++;
      });
    }
  }

  renderGrid();

  content.appendChild(tabBar);
  content.appendChild(grid);
  dashboard.appendChild(content);

  results.appendChild(topbar);
  results.appendChild(dashboard);

  // Animate sidebar cards in with stagger
  sidebar.querySelectorAll('.id-card').forEach((card, i) => {
    card.classList.add('slide-in');
    card.style.animationDelay = (0.1 + i * 0.12) + 's';
  });

  // Type-reveal hash values
  typeReveal(browserCard.hashEl, result.readableFingerprint, 20);
  typeReveal(deviceCard.hashEl, result.readableDeviceId || 'N/A', 20);
  typeReveal(visitorCard.hashEl, result.visitorId || 'N/A', 18);

  // Return references for server update
  return { visitorCard, sidebar };
}

// --- Create identity card ---
function createIdCard(type, label, hashText, rawText) {
  const el = document.createElement('div');
  el.className = 'id-card ' + type;

  const accent = document.createElement('div');
  accent.className = 'id-card-accent';

  const labelEl = document.createElement('div');
  labelEl.className = 'id-card-label';
  labelEl.textContent = label;

  const hashEl = document.createElement('div');
  hashEl.className = 'id-card-hash';
  // Will be filled by typeReveal

  const rawEl = document.createElement('div');
  rawEl.className = 'id-card-raw';
  rawEl.textContent = rawText;

  const actions = document.createElement('div');
  actions.className = 'id-card-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.innerHTML = COPY_ICON + ' copy';
  copyBtn.addEventListener('click', () => copyToClipboard(rawText, copyBtn));

  actions.appendChild(copyBtn);

  el.appendChild(accent);
  el.appendChild(labelEl);
  el.appendChild(hashEl);
  el.appendChild(rawEl);
  el.appendChild(actions);

  return { el, hashEl, rawEl, labelEl };
}

// --- Device debug section ---
function buildDeviceDebug(result) {
  const hasDeviceData = result.signals.some(s => s.deviceData && Object.keys(s.deviceData).length > 0);
  if (!hasDeviceData) return null;

  const section = document.createElement('div');
  section.className = 'device-debug';

  const header = document.createElement('div');
  header.className = 'device-debug-header';

  const title = document.createElement('div');
  title.className = 'device-debug-title';
  title.innerHTML = '<span class="signal-dot ok" style="background:var(--amber);box-shadow:0 0 6px var(--amber-glow)"></span> Device Signals';

  const chevronWrap = document.createElement('span');
  chevronWrap.innerHTML = CHEVRON_ICON;
  chevronWrap.querySelector('.signal-chevron').style.transition = 'transform 200ms';

  header.appendChild(title);
  header.appendChild(chevronWrap);

  header.addEventListener('click', () => {
    section.classList.toggle('expanded');
    const chev = chevronWrap.querySelector('.signal-chevron');
    chev.style.transform = section.classList.contains('expanded') ? 'rotate(180deg)' : '';
  });

  const body = document.createElement('div');
  body.className = 'device-debug-body';

  const content = document.createElement('div');
  content.className = 'device-debug-content';

  for (const signal of result.signals) {
    if (!signal.deviceData || Object.keys(signal.deviceData).length === 0) continue;
    for (const [key, value] of Object.entries(signal.deviceData)) {
      const row = document.createElement('div');
      row.className = 'signal-row';
      row.innerHTML =
        '<span class="signal-key">' + escapeHtml(signal.name + '.' + key) + '</span>' +
        '<span class="signal-val">' + escapeHtml(String(value)) + '</span>';
      content.appendChild(row);
    }
  }

  body.appendChild(content);
  section.appendChild(header);
  section.appendChild(body);
  return section;
}

// --- Main collection ---
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

  const mouseCollector = new MouseCollector();
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
    .register(mouseCollector)
    .register(dnsProbeCollector);

  const startTime = performance.now();
  const result = await fingerprinter.collect();
  const totalTime = performance.now() - startTime;

  stopLoading();

  // Build the dashboard UI
  const refs = buildDashboard(result, totalTime);

  // Start background mouse observation, send update when done
  const effectiveVisitorIdRef = { value: result.visitorId };
  mouseCollector.observe(10000).then(mouseData => {
    if (mouseData.scrollSampleCount > 0 || mouseData.moveSampleCount > 0) {
      client.updateMouse(effectiveVisitorIdRef.value, mouseData).catch(() => {});
    }
    mouseCollector.destroy();
  });

  // Submit to server for probabilistic matching
  client.submit(result).then(async serverResult => {
    const effectiveVisitorId = serverResult.matchedVisitorId || result.visitorId;
    effectiveVisitorIdRef.value = effectiveVisitorId;
    if (effectiveVisitorId) {
      client.storeEtag(effectiveVisitorId).catch(() => {});
    }

    if (serverResult.matchedVisitorId && serverResult.matchedVisitorId !== result.visitorId) {
      // Server matched us to an existing visitor
      refs.visitorCard.rawEl.textContent = serverResult.matchedVisitorId;
      refs.visitorCard.hashEl.textContent = '';
      typeReveal(refs.visitorCard.hashEl, 'Server matched (' + (serverResult.confidence * 100).toFixed(0) + '%)', 15);
      refs.visitorCard.hashEl.style.color = 'var(--green)';

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
      refs.visitorCard.hashEl.textContent = '';
      typeReveal(refs.visitorCard.hashEl, 'Confirmed (' + (serverResult.confidence * 100).toFixed(0) + '%)', 15);
      refs.visitorCard.hashEl.style.color = 'var(--green)';
    } else {
      refs.visitorCard.hashEl.textContent = '';
      typeReveal(refs.visitorCard.hashEl, 'New visitor', 30);
    }

    // Show match info on visitor card
    const matchInfo = document.createElement('div');
    matchInfo.className = 'match-info cascade';
    if (serverResult.matchedSignals && serverResult.matchedSignals.length > 0) {
      matchInfo.innerHTML =
        '<span class="match-label">Matched: </span>' +
        '<span class="match-signals">' + serverResult.matchedSignals.join(', ') + '</span>';
    } else {
      matchInfo.innerHTML = '<span class="match-label">No previous profile matched</span>';
    }
    refs.visitorCard.el.appendChild(matchInfo);
  }).catch(() => {
    refs.visitorCard.hashEl.textContent = '';
    typeReveal(refs.visitorCard.hashEl, result.visitorId ? 'Local only' : 'N/A', 25);
    refs.visitorCard.hashEl.style.color = 'var(--text-3)';
  });
}

collectFingerprint();
