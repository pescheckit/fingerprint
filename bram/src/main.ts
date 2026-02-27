/**
 * Demo application entry point - Enhanced UI/UX
 */

import { DeviceThumbmark } from './device-thumbmark';
import type { DeviceThumbmarkResult } from './types';

// Global state
let currentResult: DeviceThumbmarkResult | null = null;
const thumbmark = new DeviceThumbmark({ debug: true });

// Animation timing
const ANIMATION_DELAY = 100;
const PROGRESS_STEPS = 20;

/**
 * Theme management
 */
const THEME_STORAGE_KEY = 'devicecreep-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getSavedTheme(): 'light' | 'dark' | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage:', e);
  }
  return null;
}

function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
}

function applyTheme(theme: 'light' | 'dark'): void {
  console.log(`🎨 Applying theme: ${theme}`);
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
  }
  console.log('✅ Theme applied, data-theme:', document.documentElement.getAttribute('data-theme'));
}

function getCurrentTheme(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function toggleTheme(): void {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  saveTheme(newTheme);
}

function initializeTheme(): void {
  // Priority: 1. Saved preference, 2. System preference, 3. Default (light)
  const savedTheme = getSavedTheme();
  const theme = savedTheme || getSystemTheme();
  applyTheme(theme);
}

// Initialize theme before DOM content loads to prevent flash
initializeTheme();

/**
 * Simulate progress during loading
 */
function animateProgress(duration: number = 2000): () => void {
  const progressBar = document.getElementById('progressBar') as HTMLElement;
  const progressText = document.getElementById('loadingProgress') as HTMLElement;

  if (!progressBar || !progressText) return () => {};

  const modules = [
    'Initializing modules...',
    'Analyzing WebGL capabilities...',
    'Testing floating-point precision...',
    'Measuring performance ratios...',
    'Detecting screen properties...',
    'Analyzing audio context...',
    'Reading canvas fingerprint...',
    'Checking hardware features...',
    'Finalizing fingerprint...'
  ];

  let progress = 0;
  let moduleIndex = 0;
  const step = 100 / PROGRESS_STEPS;
  const interval = duration / PROGRESS_STEPS;

  const timer = setInterval(() => {
    progress = Math.min(progress + step, 100);
    progressBar.style.width = `${progress}%`;

    // Update module text
    if (progress > (moduleIndex + 1) * (100 / modules.length)) {
      moduleIndex = Math.min(moduleIndex + 1, modules.length - 1);
      progressText.textContent = modules[moduleIndex];
    }

    if (progress >= 100) {
      clearInterval(timer);
    }
  }, interval);

  return () => clearInterval(timer);
}

/**
 * Display the thumbmark result with animations
 */
async function displayResult() {
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');
  const stickyHeader = document.getElementById('stickyHeader');

  if (!loadingEl || !resultEl) return;

  // Start progress animation
  const stopProgress = animateProgress(2000);

  try {
    // Generate thumbmark
    currentResult = await thumbmark.generate();

    // Stop progress animation
    stopProgress();

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));

    // Hide loading, show result with fade
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    if (stickyHeader) {
      stickyHeader.style.display = 'block';
    }

    // Display UUIDs with typing animation
    console.log('Device ID to display:', currentResult.deviceId, 'Length:', currentResult.deviceId.length);
    console.log('Fingerprint ID to display:', currentResult.fingerprintId, 'Length:', currentResult.fingerprintId.length);
    animateText('deviceId', currentResult.deviceId, 30);
    animateText('fingerprintId', currentResult.fingerprintId, 30);

    // Display badges
    updateBadges(currentResult);

    // Display stats with counter animation
    animateCounter('entropy', currentResult.entropy, 1);
    animateCounter('stability', currentResult.stability, 0);
    animateCounter('modules', currentResult.modules.length, 0);

    const hardwareCount = currentResult.modules.filter(m => m.hardwareBased).length;
    animateCounter('hardwareModules', hardwareCount, 0);

    // Update quick stats in header
    animateCounter('headerEntropy', currentResult.entropy, 1);
    animateCounter('headerStability', currentResult.stability, 0);
    animateCounter('headerModules', currentResult.modules.length, 0);

    // Check for Tor and VPN detection
    displayTorDetection(currentResult);
    displayVPNDetection(currentResult);

    // Display modules by category
    await displayModulesByCategory(currentResult);

  } catch (error) {
    stopProgress();
    console.error('Failed to generate thumbmark:', error);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: var(--accent-pink); padding: 2rem; text-align: center;">
          <h3 style="font-size: 2rem; margin-bottom: 1rem;">Error</h3>
          <p style="color: var(--text-secondary);">${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      `;
    }
  }
}

/**
 * Animate text with typing effect
 */
function animateText(elementId: string, text: string, speed: number = 50) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element ${elementId} not found!`);
    return;
  }

  console.log(`Animating ${elementId}: "${text}" (${text.length} chars)`);

  // CRITICAL: Clear existing content AND stop any running animations
  element.textContent = '';
  element.setAttribute('data-animating', 'true');

  let index = 0;
  let animatedText = ''; // Build in variable, not DOM

  const interval = setInterval(() => {
    // Check if element was cleared externally (new animation started)
    if (element.getAttribute('data-animating') !== 'true') {
      clearInterval(interval);
      return;
    }

    if (index < text.length) {
      animatedText += text[index];
      element.textContent = animatedText; // Set directly, don't append
      index++;
    } else {
      clearInterval(interval);
      element.removeAttribute('data-animating');
      console.log(`Animation complete for ${elementId}: "${element.textContent}" (${element.textContent.length} chars)`);
    }
  }, speed);
}

/**
 * Animate counter from 0 to target value
 */
function animateCounter(elementId: string, target: number, decimals: number = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const duration = 1000; // ms
  const steps = 30;
  const increment = target / steps;
  const stepDuration = duration / steps;
  let current = 0;

  const interval = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toFixed(decimals);
      if (elementId === 'stability' || elementId === 'headerStability') {
        element.textContent += '%';
      }
      clearInterval(interval);
    } else {
      element.textContent = current.toFixed(decimals);
      if (elementId === 'stability' || elementId === 'headerStability') {
        element.textContent += '%';
      }
    }
  }, stepDuration);
}

/**
 * Update badges with metadata
 */
function updateBadges(result: DeviceThumbmarkResult) {
  const deviceEntropyBadge = document.getElementById('deviceEntropyBadge');
  if (deviceEntropyBadge) {
    deviceEntropyBadge.textContent = `${result.deviceEntropy.toFixed(1)} bits`;
  }

  const fingerprintEntropyBadge = document.getElementById('fingerprintEntropyBadge');
  if (fingerprintEntropyBadge) {
    fingerprintEntropyBadge.textContent = `${result.fingerprintEntropy.toFixed(1)} bits`;
  }

  const confidenceBadge = document.getElementById('confidenceBadge');
  if (confidenceBadge) {
    confidenceBadge.textContent = `${result.confidence}% confidence`;
  }
}

/**
 * Display Tor detection alert
 */
function displayTorDetection(result: DeviceThumbmarkResult) {
  const torAlert = document.getElementById('torAlert');
  if (!torAlert) return;

  // Find Tor detection module
  const torModule = result.modules.find(m => m.name === 'tor-detection');
  if (!torModule) return;

  const torData = torModule.data as any;
  if (torData.isTorBrowser || torData.likelyTor) {
    torAlert.classList.remove('hidden');
    torAlert.classList.add('detected');

    const title = document.getElementById('torAlertTitle');
    const message = document.getElementById('torAlertMessage');

    if (title) {
      title.textContent = 'Tor Browser Detected';
    }

    if (message) {
      const signals = [];
      if (torData.isTorBrowser) signals.push('Tor Browser signature');
      if (torData.canvasNoiseDetected) signals.push('canvas noise');
      if (torData.webglVendorBlocked) signals.push('WebGL blocking');

      message.textContent = `Detected: ${signals.join(', ')}. Device UUID remains stable across Tor sessions.`;
    }
  }
}

/**
 * Display modules by category with animations
 */
async function displayModulesByCategory(result: DeviceThumbmarkResult) {
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

  // Update section badges
  updateSectionBadge('deviceModuleCount', deviceModules.length);
  updateSectionBadge('fingerprintModuleCount', fingerprintModules.length);
  updateSectionBadge('detectionModuleCount', detectionModules.length);

  // Display each category with staggered animation
  await displayModuleGrid('deviceModulesGrid', deviceModules, '🖥️');
  await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
  await displayModuleGrid('fingerprintModulesGrid', fingerprintModules, '🔍');
  await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
  await displayModuleGrid('detectionModulesGrid', detectionModules, '🔬');
}

/**
 * Update section badge count
 */
function updateSectionBadge(elementId: string, count: number) {
  const badge = document.getElementById(elementId);
  if (badge) {
    badge.textContent = count.toString();
  }
}

/**
 * Display module cards in a grid with collapsible content
 */
async function displayModuleGrid(gridId: string, modules: any[], icon: string) {
  const gridEl = document.getElementById(gridId);
  if (!gridEl) return;

  gridEl.innerHTML = '';

  if (modules.length === 0) {
    gridEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No modules in this category</p>';
    return;
  }

  // Sort by entropy (descending)
  const sortedModules = [...modules].sort((a, b) => b.entropy - a.entropy);

  // Check if this is device modules (Tor-resistant)
  const isTorResistant = gridId === 'deviceModulesGrid';

  for (let i = 0; i < sortedModules.length; i++) {
    const module = sortedModules[i];

    // Create card
    const card = document.createElement('div');
    card.className = 'module-card';
    card.style.animationDelay = `${i * 0.05}s`;

    // Create badges
    const badges = [];
    if (module.hardwareBased) {
      badges.push(`<span class="module-badge badge-hardware">Hardware</span>`);
    } else {
      badges.push(`<span class="module-badge badge-software">Software</span>`);
    }

    if (isTorResistant) {
      badges.push(`<span class="module-badge badge-tor-resistant">Tor-Resistant</span>`);
    }

    const badgeHtml = badges.join('');

    // Create card HTML
    card.innerHTML = `
      <div class="module-header" data-module="${module.name}">
        <div class="module-title-section">
          <div class="module-name">
            <span>${icon}</span>
            <span>${formatModuleName(module.name)}</span>
          </div>
          <div class="module-badges">
            ${badgeHtml}
          </div>
          <div class="module-stats">
            <div class="module-stat">
              <span>🔐</span>
              <span>${module.entropy.toFixed(1)} bits</span>
            </div>
            <div class="module-stat">
              <span>🎯</span>
              <span>${module.stability}% stable</span>
            </div>
          </div>
        </div>
        <div class="collapse-icon">▼</div>
      </div>
      <div class="module-content">
        <div class="module-data">
          <pre>${JSON.stringify(module.data, null, 2)}</pre>
        </div>
      </div>
    `;

    // Add click handler for collapse/expand
    const header = card.querySelector('.module-header');
    if (header) {
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });
    }

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
 * Filter modules by search query with highlighting
 */
function filterModules(query: string) {
  const allCards = document.querySelectorAll('.module-card');
  let visibleCount = 0;

  allCards.forEach((card) => {
    const cardElement = card as HTMLElement;
    const cardText = cardElement.textContent?.toLowerCase() || '';
    const moduleNameEl = cardElement.querySelector('.module-name');
    const moduleName = moduleNameEl?.textContent?.toLowerCase() || '';

    if (query === '' || moduleName.includes(query) || cardText.includes(query)) {
      cardElement.style.display = 'block';
      visibleCount++;

      // Highlight matching text
      if (query !== '') {
        cardElement.style.borderColor = 'var(--accent-purple)';
        cardElement.style.boxShadow = 'var(--shadow-md)';
      } else {
        cardElement.style.borderColor = 'var(--border-color)';
        cardElement.style.boxShadow = 'none';
      }
    } else {
      cardElement.style.display = 'none';
    }
  });

  // Show/hide sections based on visible cards
  ['deviceModulesSection', 'fingerprintModulesSection', 'detectionModulesSection'].forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const grid = section.querySelector('.modules-grid');
      if (grid) {
        const visibleCards = Array.from(grid.querySelectorAll('.module-card')).filter(
          (card) => (card as HTMLElement).style.display !== 'none'
        );

        section.style.display = visibleCards.length > 0 ? 'block' : 'none';
      }
    }
  });
}

/**
 * Copy text to clipboard with visual feedback
 */
async function copyToClipboard(text: string, buttonId: string): Promise<boolean> {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (!button) return false;

  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);
    button.classList.add('copied');
    button.textContent = '✓ Copied!';

    setTimeout(() => {
      button.classList.remove('copied');
      button.textContent = originalText;
    }, 2000);

    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      button.classList.add('copied');
      button.textContent = '✓ Copied!';

      setTimeout(() => {
        button.classList.remove('copied');
        button.textContent = originalText;
      }, 2000);

      return true;
    } catch (e) {
      console.error('Failed to copy:', e);
      return false;
    }
  }
}

/**
 * Setup event listeners (Tor-compatible - no inline handlers)
 */
function setupEventListeners() {
  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    console.log('✅ Theme toggle button found, attaching listener');
    themeToggle.addEventListener('click', () => {
      console.log('🖱️ Theme toggle clicked!');
      toggleTheme();
    });
  } else {
    console.error('❌ Theme toggle button not found!');
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only apply system theme if user hasn't set a preference
      const savedTheme = getSavedTheme();
      if (!savedTheme) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Search/filter modules with debouncing
  const searchInput = document.getElementById('moduleSearch') as HTMLInputElement;
  if (searchInput) {
    let debounceTimer: number;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        filterModules(query);
      }, 150);
    });
  }

  // Regenerate button
  const btnRegenerate = document.getElementById('btnRegenerate');
  if (btnRegenerate) {
    btnRegenerate.addEventListener('click', async () => {
      const loadingEl = document.getElementById('loading');
      const resultEl = document.getElementById('result');
      const stickyHeader = document.getElementById('stickyHeader');

      if (loadingEl) loadingEl.classList.remove('hidden');
      if (resultEl) resultEl.classList.add('hidden');
      if (stickyHeader) stickyHeader.style.display = 'none';

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      await displayResult();
    });
  }

  // Copy Device UUID button
  const btnCopyDevice = document.getElementById('btnCopyDevice');
  if (btnCopyDevice) {
    btnCopyDevice.addEventListener('click', async () => {
      if (!currentResult) return;
      await copyToClipboard(currentResult.deviceId, 'btnCopyDevice');
    });
  }

  // Copy Fingerprint UUID button
  const btnCopyFingerprint = document.getElementById('btnCopyFingerprint');
  if (btnCopyFingerprint) {
    btnCopyFingerprint.addEventListener('click', async () => {
      if (!currentResult) return;
      await copyToClipboard(currentResult.fingerprintId, 'btnCopyFingerprint');
    });
  }

  // Export results button
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!currentResult) return;

      // Create enhanced export with metadata
      const exportData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        result: currentResult
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Download
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `devicecreep-${timestamp}-${currentResult.deviceId.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Visual feedback
      const btn = btnExport as HTMLButtonElement;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✓</span><span>Exported!</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    });
  }

  // Sticky header on scroll
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
    const stickyHeader = document.getElementById('stickyHeader');
    const resultEl = document.getElementById('result');

    if (!stickyHeader || !resultEl || resultEl.classList.contains('hidden')) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Show header when scrolling down past 200px
    if (scrollTop > 200) {
      stickyHeader.style.display = 'block';
    } else {
      stickyHeader.style.display = 'none';
    }

    lastScrollTop = scrollTop;
  });
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
