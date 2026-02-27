import { Fingerprinter } from './src/fingerprinter.js';
import { CanvasCollector } from './src/collectors/canvas.js';
import { WebGLCollector } from './src/collectors/webgl.js';
import { NavigatorCollector } from './src/collectors/navigator.js';
import { ScreenCollector } from './src/collectors/screen.js';
import { TimezoneCollector } from './src/collectors/timezone.js';

const results = document.getElementById('results');

function renderSignalGroup(signal) {
  const group = document.createElement('div');
  group.className = 'signal-group';

  const header = document.createElement('h3');
  header.textContent = `${signal.name} — ${signal.description}`;
  group.appendChild(header);

  if (signal.error) {
    const errorRow = document.createElement('div');
    errorRow.className = 'signal-row';
    errorRow.innerHTML = `<span class="signal-label">Error</span><span class="signal-value" style="color:#f44">${signal.error}</span>`;
    group.appendChild(errorRow);
    return group;
  }

  const duration = document.createElement('div');
  duration.className = 'signal-row';
  duration.innerHTML = `<span class="signal-label">Collection time</span><span class="signal-value">${signal.duration.toFixed(2)}ms</span>`;
  group.appendChild(duration);

  for (const [key, value] of Object.entries(signal.data)) {
    const row = document.createElement('div');
    row.className = 'signal-row';

    const label = document.createElement('span');
    label.className = 'signal-label';
    label.textContent = key;

    const val = document.createElement('span');
    val.className = 'signal-value';
    val.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value);

    row.appendChild(label);
    row.appendChild(val);
    group.appendChild(row);
  }

  return group;
}

async function collectFingerprint() {
  results.innerHTML = '<p>Collecting signals...</p>';

  const fingerprinter = new Fingerprinter();
  fingerprinter
    .register(new CanvasCollector())
    .register(new WebGLCollector())
    .register(new NavigatorCollector())
    .register(new ScreenCollector())
    .register(new TimezoneCollector());

  const result = await fingerprinter.collect();

  results.innerHTML = '';

  const hashSection = document.createElement('div');
  hashSection.className = 'hash-section';

  const hashLabel = document.createElement('h2');
  hashLabel.textContent = 'Browser Fingerprint';
  hashSection.appendChild(hashLabel);

  const hashEl = document.createElement('div');
  hashEl.id = 'fingerprint-hash';
  hashEl.textContent = result.hash;
  hashSection.appendChild(hashEl);

  const crossLabel = document.createElement('h2');
  crossLabel.textContent = 'Cross-Browser ID';
  hashSection.appendChild(crossLabel);

  const crossHashEl = document.createElement('div');
  crossHashEl.id = 'cross-browser-hash';
  crossHashEl.textContent = result.crossBrowserHash || 'N/A';
  hashSection.appendChild(crossHashEl);

  results.appendChild(hashSection);

  for (const signal of result.signals) {
    results.appendChild(renderSignalGroup(signal));
  }
}

collectFingerprint();
