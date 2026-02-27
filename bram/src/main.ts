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

    // Display device UUID (cross-browser)
    const deviceIdEl = document.getElementById('deviceId');
    if (deviceIdEl) {
      deviceIdEl.textContent = currentResult.deviceId;
    }

    // Display fingerprint UUID (deep)
    const fingerprintIdEl = document.getElementById('fingerprintId');
    if (fingerprintIdEl) {
      fingerprintIdEl.textContent = currentResult.fingerprintId;
    }

    // Display confidence with both entropies
    const confidenceEl = document.getElementById('confidence');
    if (confidenceEl) {
      confidenceEl.textContent = `Device: ${currentResult.deviceEntropy.toFixed(1)} bits | Fingerprint: ${currentResult.fingerprintEntropy.toFixed(1)} bits | Confidence: ${currentResult.confidence}%`;
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

    // Display modules by category
    displayModulesByCategory(currentResult);

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
 * Display modules by category
 */
function displayModulesByCategory(result: DeviceThumbmarkResult) {
  // Device UUID modules (Tor-resistant)
  const DEVICE_MODULES = [
    'floating-point', 'webgl-capabilities', 'perf-ratios', 'screen-aspect',
    'hardware', 'canvas-properties', 'touch-capabilities', 'color-depth'
  ];

  // Detection modules
  const DETECTION_MODULES = ['tor-detection'];

  // Separate modules by category
  const deviceModules = result.modules.filter(m => DEVICE_MODULES.includes(m.name));
  const fingerprintModules = result.modules.filter(m =>
    !DEVICE_MODULES.includes(m.name) && !DETECTION_MODULES.includes(m.name)
  );
  const detectionModules = result.modules.filter(m => DETECTION_MODULES.includes(m.name));

  // Display each category
  displayModuleGrid('deviceModulesGrid', deviceModules, '🖥️');
  displayModuleGrid('fingerprintModulesGrid', fingerprintModules, '🔍');
  displayModuleGrid('detectionModulesGrid', detectionModules, '🔬');
}

/**
 * Display module cards in a grid
 */
function displayModuleGrid(gridId: string, modules: any[], icon: string) {
  const gridEl = document.getElementById(gridId);
  if (!gridEl) return;

  gridEl.innerHTML = '';

  if (modules.length === 0) {
    gridEl.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No modules in this category</p>';
    return;
  }

  // Sort by entropy
  const sortedModules = [...modules].sort((a, b) => b.entropy - a.entropy);

  for (const module of sortedModules) {
    const card = document.createElement('div');
    card.className = 'module-card';

    const badge = module.hardwareBased
      ? `<span class="module-badge">🔧 Hardware</span>`
      : `<span class="module-badge" style="background: #999;">Software</span>`;

    card.innerHTML = `
      <h3>
        ${icon} ${formatModuleName(module.name)}
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
 * Filter modules by search query
 */
function filterModules(query: string) {
  const allCards = document.querySelectorAll('.module-card');

  allCards.forEach((card) => {
    const cardElement = card as HTMLElement;
    const cardText = cardElement.textContent?.toLowerCase() || '';
    const moduleName = cardElement.querySelector('h3')?.textContent?.toLowerCase() || '';

    if (query === '' || moduleName.includes(query) || cardText.includes(query)) {
      cardElement.style.display = 'block';
    } else {
      cardElement.style.display = 'none';
    }
  });

  // Show/hide category headers if all cards hidden
  ['deviceModulesGrid', 'fingerprintModulesGrid', 'detectionModulesGrid'].forEach(gridId => {
    const grid = document.getElementById(gridId);
    if (grid) {
      const visibleCards = Array.from(grid.querySelectorAll('.module-card')).filter(
        (card) => (card as HTMLElement).style.display !== 'none'
      );

      const header = grid.previousElementSibling?.previousElementSibling as HTMLElement;
      if (header && header.tagName === 'H2') {
        header.style.display = visibleCards.length > 0 ? 'block' : 'none';
      }
    }
  });
}

/**
 * Setup event listeners (Tor-compatible - no inline handlers)
 */
function setupEventListeners() {
  // Search/filter modules
  const searchInput = document.getElementById('moduleSearch') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      filterModules(query);
    });
  }

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
