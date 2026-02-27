/**
 * CSS @supports Fingerprinting Module
 *
 * SCHOOL RESEARCH - Based on NDSS 2025 Paper
 * Novel technique using CSS feature detection for browser/OS fingerprinting
 * Accuracy: 97.95% for browser-OS combinations
 *
 * Entropy: ~10 bits | Stability: 98% | Hardware-based: No
 * Reference: "CSS Fingerprinting" - NDSS 2025
 */

import { ModuleInterface } from '../../types';

export class CSSSupportsModule implements ModuleInterface {
  name = 'css-supports';
  entropy = 10;
  stability = 98;
  hardwareBased = false;

  private cssFeatures = [
    // Modern layout
    'display: grid',
    'display: flex',
    'display: subgrid',
    'display: contents',

    // Container queries (newer browsers)
    '@container (width > 0px)',
    'container-type: inline-size',

    // Modern CSS functions
    'width: clamp(1px, 50%, 100px)',
    'width: min(10px, 20px)',
    'width: max(10px, 20px)',
    'aspect-ratio: 16/9',

    // Color functions
    'color: lab(50% 0 0)',
    'color: lch(50% 0 0)',
    'color: oklch(0.5 0 0)',
    'color: color(srgb 1 1 1)',

    // Logical properties
    'margin-inline-start: 1px',
    'padding-block: 1px',
    'inset-block-start: 0',

    // Advanced selectors
    ':has(div)',
    ':is(div, span)',
    ':where(div)',

    // Scrolling
    'overflow: overlay',
    'scroll-behavior: smooth',
    'overscroll-behavior: contain',

    // Backdrop filter
    'backdrop-filter: blur(10px)',
    '-webkit-backdrop-filter: blur(10px)',

    // CSS masking
    'mask-image: linear-gradient(black, transparent)',
    'clip-path: circle(50%)',

    // Text features
    'text-decoration-skip-ink: auto',
    'text-underline-offset: 5px',
    'text-emphasis: filled',

    // Gap property
    'gap: 10px',
    'column-gap: 10px',

    // Modern units
    'width: 1dvh',
    'width: 1lvh',
    'width: 1svh',

    // Appearance
    'appearance: none',
    '-webkit-appearance: none',
    '-moz-appearance: none',

    // Accent color
    'accent-color: blue',

    // Color scheme
    'color-scheme: dark',

    // Print
    '@page { size: A4; }',

    // Custom properties
    '--custom: value'
  ];

  isAvailable(): boolean {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
  }

  collect(): any {
    const supported: string[] = [];
    const unsupported: string[] = [];
    const supportMap: Record<string, boolean> = {};

    for (const feature of this.cssFeatures) {
      const isSupported = this.testSupport(feature);
      supportMap[feature] = isSupported;

      if (isSupported) {
        supported.push(feature);
      } else {
        unsupported.push(feature);
      }
    }

    // Calculate browser signature from support pattern
    const signature = this.generateSignature(supportMap);

    // Detect browser/OS combination
    const browserOS = this.detectBrowserOS(supportMap);

    return {
      supported,
      unsupported,
      supportCount: supported.length,
      totalTested: this.cssFeatures.length,
      supportRatio: (supported.length / this.cssFeatures.length).toFixed(3),
      signature,
      browserOS,

      // Research metadata
      research: {
        technique: 'CSS @supports feature detection',
        paper: 'NDSS 2025 - CSS Fingerprinting',
        accuracy: '97.95% browser-OS identification',
        entropy: '~10 bits of identifying information',
        crossBrowser: 'Very stable - standardized CSS API'
      }
    };
  }

  private testSupport(feature: string): boolean {
    try {
      // Handle @rules specially
      if (feature.startsWith('@')) {
        return this.testAtRule(feature);
      }

      return CSS.supports(feature);
    } catch (e) {
      return false;
    }
  }

  private testAtRule(rule: string): boolean {
    try {
      // For @rules, we need to test differently
      if (rule.includes('@container')) {
        return CSS.supports('container-type', 'inline-size');
      }
      if (rule.includes('@page')) {
        return typeof (window as any).CSSPageRule !== 'undefined';
      }
      return false;
    } catch {
      return false;
    }
  }

  private generateSignature(supportMap: Record<string, boolean>): string {
    // Create binary fingerprint from support pattern
    const binary = Object.values(supportMap).map(v => v ? '1' : '0').join('');

    // Hash the binary pattern
    let hash = 0;
    for (let i = 0; i < binary.length; i++) {
      hash = ((hash << 5) - hash) + binary.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private detectBrowserOS(supportMap: Record<string, boolean>): string {
    // Heuristic detection based on CSS support patterns
    const hasContainerQuery = supportMap['@container (width > 0px)'];
    const hasOklch = supportMap['color: oklch(0.5 0 0)'];
    const hasBackdropFilter = supportMap['backdrop-filter: blur(10px)'];
    const hasWebkitBackdrop = supportMap['-webkit-backdrop-filter: blur(10px)'];
    const hasDynamicViewport = supportMap['width: 1dvh'];
    const hasSubgrid = supportMap['display: subgrid'];

    // Chrome-like
    if (hasContainerQuery && hasOklch && hasDynamicViewport) {
      return 'Chrome/Edge (Modern)';
    }

    // Firefox-like
    if (hasSubgrid && hasContainerQuery) {
      return 'Firefox (Modern)';
    }

    // Safari-like
    if (hasWebkitBackdrop && !hasContainerQuery) {
      return 'Safari (Older)';
    }

    // Safari modern
    if (hasBackdropFilter && hasContainerQuery) {
      return 'Safari (Modern)';
    }

    return 'Unknown';
  }
}
