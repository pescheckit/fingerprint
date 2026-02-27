/**
 * Demo application entry point
 */

import { DeviceThumbmark } from './device-thumbmark';
import type { DeviceThumbmarkResult } from './types';

// Global state
let currentResult: DeviceThumbmarkResult | null = null;
const thumbmark = new DeviceThumbmark({ debug: true });

/**
 * Display the thumbmark result
 */
async function displayResult() {
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');

  if (!loadingEl || !resultEl) return;

  try {
    // Generate thumbmark
    currentResult = await thumbmark.generate();

    // Hide loading, show result
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';

    // Display device ID
    const deviceIdEl = document.getElementById('deviceId');
    if (deviceIdEl) {
      deviceIdEl.textContent = currentResult.deviceId;
    }

    // Display confidence
    const confidenceEl = document.getElementById('confidence');
    if (confidenceEl) {
      confidenceEl.textContent = `Confidence: ${currentResult.confidence}% | Stability: ${currentResult.stability}%`;
    }

    // Display stats
    const entropyEl = document.getElementById('entropy');
    if (entropyEl) {
      entropyEl.textContent = currentResult.entropy.toFixed(1);
    }

    const stabilityEl = document.getElementById('stability');
    if (stabilityEl) {
      stabilityEl.textContent = currentResult.stability + '%';
    }

    const modulesEl = document.getElementById('modules');
    if (modulesEl) {
      const hardwareCount = currentResult.modules.filter(m => m.hardwareBased).length;
      modulesEl.textContent = `${hardwareCount}/${currentResult.modules.length}`;
    }

    // Display modules
    displayModules(currentResult);

  } catch (error) {
    console.error('Failed to generate thumbmark:', error);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: #e74c3c; padding: 2rem;">
          <h3>❌ Error</h3>
          <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      `;
    }
  }
}

/**
 * Display module cards
 */
function displayModules(result: DeviceThumbmarkResult) {
  const gridEl = document.getElementById('modulesGrid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  // Sort by entropy (most valuable first)
  const sortedModules = [...result.modules].sort((a, b) => b.entropy - a.entropy);

  for (const module of sortedModules) {
    const card = document.createElement('div');
    card.className = 'module-card';

    const badge = module.hardwareBased
      ? `<span class="module-badge">🔧 Hardware</span>`
      : `<span class="module-badge" style="background: #999;">Software</span>`;

    card.innerHTML = `
      <h3>
        ${formatModuleName(module.name)}
        ${badge}
      </h3>
      <div style="margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">
        Entropy: ${module.entropy} bits | Stability: ${module.stability}%
      </div>
      <pre>${JSON.stringify(module.data, null, 2)}</pre>
    `;

    gridEl.appendChild(card);
  }
}

/**
 * Format module name for display
 */
function formatModuleName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Setup event listeners (Tor-compatible - no inline handlers)
 */
function setupEventListeners() {
  // Regenerate button
  const btnRegenerate = document.getElementById('btnRegenerate');
  if (btnRegenerate) {
    btnRegenerate.addEventListener('click', async () => {
      const loadingEl = document.getElementById('loading');
      const resultEl = document.getElementById('result');

      if (loadingEl) loadingEl.style.display = 'block';
      if (resultEl) resultEl.style.display = 'none';

      await displayResult();
    });
  }

  // Copy button
  const btnCopy = document.getElementById('btnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (!currentResult) return;

      try {
        await navigator.clipboard.writeText(currentResult.deviceId);
        alert('✓ Device ID copied to clipboard!');
      } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = currentResult.deviceId;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✓ Device ID copied to clipboard!');
      }
    });
  }

  // Export results button
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!currentResult) return;

      // Create JSON blob
      const json = JSON.stringify(currentResult, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Download
      const a = document.createElement('a');
      a.href = url;
      a.download = `devicecreep-${currentResult.deviceId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

// Auto-start on page load
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  displayResult();
});

// Also start immediately if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupEventListeners();
  displayResult();
}
