/**
 * Browser Extensions Detection Module
 *
 * SCHOOL RESEARCH PROJECT - Educational Purposes
 * Demonstrates how browser extensions can be detected through various side-effects.
 * Research use: Understanding extension footprints and privacy implications
 *
 * Entropy: ~10 bits | Stability: 80% | Hardware-based: No
 *
 * Detection Methods:
 * 1. DOM modifications - Extensions often inject elements/scripts
 * 2. Resource timing - Extension resources have chrome-extension:// URLs
 * 3. JavaScript property pollution - Extensions may add global properties
 * 4. Performance timing anomalies - Extensions affect page load timing
 */

import { ModuleInterface } from '../../types';

export class ExtensionsModule implements ModuleInterface {
  name = 'extensions';
  entropy = 10;
  stability = 80;
  hardwareBased = false;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  collect(): any {
    const detectionResults = {
      // Method 1: Check for common extension DOM elements
      domModifications: this.detectDOMModifications(),

      // Method 2: Resource timing analysis
      resourceTimingSignals: this.detectResourceTiming(),

      // Method 3: JavaScript property pollution detection
      globalPropertyPollution: this.detectPropertyPollution(),

      // Method 4: Performance timing anomalies
      performanceAnomalies: this.detectPerformanceAnomalies(),

      // Method 5: Known extension-specific checks
      knownExtensions: this.detectKnownExtensions()
    };

    // Calculate overall signature
    const signature = this.calculateSignature(detectionResults);

    return {
      ...detectionResults,
      signature,
      extensionsDetected: this.countDetections(detectionResults),

      // Educational: Explain what this means for privacy
      research: {
        privacyImplications: 'Extensions leave fingerprints through DOM changes and resource loading',
        mitigation: 'Use privacy-focused browsers or extension isolation modes',
        entropy: 'Each extension combination adds ~2-3 bits of entropy'
      }
    };
  }

  /**
   * Method 1: Detect DOM modifications by extensions
   * Many extensions inject elements into the page
   */
  private detectDOMModifications(): any {
    const checks = {
      suspiciousAttributes: 0,
      injectedScripts: 0,
      injectedStyles: 0,
      suspiciousIds: 0
    };

    try {
      // Check for extension-related attributes
      const extensionAttributes = [
        'data-extension-id',
        'data-adblock',
        'data-lastpass',
        'data-grammarly',
        'data-dashlane'
      ];

      extensionAttributes.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`);
        if (elements.length > 0) {
          checks.suspiciousAttributes++;
        }
      });

      // Check for injected scripts (unusual src patterns)
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src && (src.startsWith('chrome-extension://') ||
                    src.startsWith('moz-extension://') ||
                    src.startsWith('safari-extension://'))) {
          checks.injectedScripts++;
        }
      }

      // Check for injected stylesheets
      const styles = document.getElementsByTagName('link');
      for (let i = 0; i < styles.length; i++) {
        const href = (styles[i] as HTMLLinkElement).href;
        if (href && (href.startsWith('chrome-extension://') ||
                     href.startsWith('moz-extension://') ||
                     href.startsWith('safari-extension://'))) {
          checks.injectedStyles++;
        }
      }

      // Check for suspicious element IDs (common extension patterns)
      const suspiciousIds = [
        'grammarly-extension',
        'lastpass-extension',
        'adblock-overlay',
        'metamask-extension',
        'honey-extension'
      ];

      suspiciousIds.forEach(id => {
        if (document.getElementById(id)) {
          checks.suspiciousIds++;
        }
      });

    } catch (e) {
      // Ignore errors
    }

    return checks;
  }

  /**
   * Method 2: Resource timing analysis
   * Extensions load resources that show up in performance API
   */
  private detectResourceTiming(): any {
    const signals = {
      extensionResources: 0,
      suspiciousTimings: 0
    };

    try {
      if (!performance.getEntriesByType) return signals;

      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      resources.forEach(resource => {
        // Check for extension protocol URLs
        if (resource.name.startsWith('chrome-extension://') ||
            resource.name.startsWith('moz-extension://') ||
            resource.name.startsWith('safari-extension://')) {
          signals.extensionResources++;
        }

        // Check for anomalous timing patterns that indicate extension interference
        if (resource.duration > 1000 && resource.transferSize === 0) {
          signals.suspiciousTimings++;
        }
      });

    } catch (e) {
      // Ignore errors
    }

    return signals;
  }

  /**
   * Method 3: JavaScript property pollution detection
   * Extensions may add properties to window or other global objects
   */
  private detectPropertyPollution(): any {
    const pollutionIndicators = {
      windowPropertiesCount: 0,
      suspiciousGlobals: [] as string[]
    };

    try {
      // Known extension global properties
      const knownExtensionProperties = [
        '__GRAMMARLY__',
        '__LASTPASS__',
        '__METAMASK__',
        '__REACT_DEVTOOLS_GLOBAL_HOOK__',
        '__REDUX_DEVTOOLS_EXTENSION__',
        'chrome',
        'browser',
        '__ADBLOCK__',
        '__HONEY__',
        '__DASHLANE__'
      ];

      knownExtensionProperties.forEach(prop => {
        if (prop in window) {
          pollutionIndicators.suspiciousGlobals.push(prop);
        }
      });

      pollutionIndicators.windowPropertiesCount = Object.keys(window).length;

    } catch (e) {
      // Ignore errors
    }

    return pollutionIndicators;
  }

  /**
   * Method 4: Performance timing anomalies
   * Extensions affect page load performance in detectable ways
   */
  private detectPerformanceAnomalies(): any {
    const anomalies = {
      unusualNavigationTiming: false,
      resourceTimingAnomalies: 0
    };

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        // Extensions often cause unusual gaps in navigation timing
        const domContentLoadedGap = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        const loadEventGap = navigation.loadEventEnd - navigation.loadEventStart;

        // Unusual delays may indicate extension interference
        if (domContentLoadedGap > 100 || loadEventGap > 200) {
          anomalies.unusualNavigationTiming = true;
        }
      }

      // Check for blocked/modified resources (common with ad blockers)
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      resources.forEach(resource => {
        // Resources with 0 transfer size but non-zero duration might be blocked
        if (resource.transferSize === 0 && resource.duration > 0 && resource.decodedBodySize === 0) {
          anomalies.resourceTimingAnomalies++;
        }
      });

    } catch (e) {
      // Ignore errors
    }

    return anomalies;
  }

  /**
   * Method 5: Known extension-specific detection
   * Some popular extensions have known detection methods
   */
  private detectKnownExtensions(): string[] {
    const detected: string[] = [];

    try {
      // Check for common extension indicators
      const checks: Record<string, () => boolean> = {
        'adblock': () => {
          // Ad blockers often block tracking pixels
          return document.querySelectorAll('[class*="adblock"], [id*="adblock"]').length > 0;
        },
        'grammarly': () => {
          return '__GRAMMARLY__' in window ||
                 document.querySelector('[data-grammarly]') !== null;
        },
        'lastpass': () => {
          return document.querySelector('[data-lastpass-icon-root]') !== null;
        },
        'metamask': () => {
          return '__METAMASK__' in window ||
                 (window as any).ethereum !== undefined;
        },
        'react-devtools': () => {
          return '__REACT_DEVTOOLS_GLOBAL_HOOK__' in window;
        },
        'redux-devtools': () => {
          return '__REDUX_DEVTOOLS_EXTENSION__' in window;
        },
        'honey': () => {
          return document.querySelector('[data-honey]') !== null;
        },
        'dashlane': () => {
          return document.querySelector('[data-dashlane]') !== null;
        }
      };

      Object.entries(checks).forEach(([name, check]) => {
        try {
          if (check()) {
            detected.push(name);
          }
        } catch (e) {
          // Ignore individual check failures
        }
      });

    } catch (e) {
      // Ignore errors
    }

    return detected;
  }

  /**
   * Calculate overall signature from detection results
   */
  private calculateSignature(results: any): string {
    const signatureString = JSON.stringify({
      dom: results.domModifications,
      resources: results.resourceTimingSignals.extensionResources,
      globals: results.globalPropertyPollution.suspiciousGlobals.length,
      anomalies: results.performanceAnomalies.unusualNavigationTiming,
      known: results.knownExtensions.sort().join('|')
    });

    return this.hashString(signatureString);
  }

  /**
   * Count total detections across all methods
   */
  private countDetections(results: any): number {
    let count = 0;

    count += results.domModifications.suspiciousAttributes;
    count += results.domModifications.injectedScripts;
    count += results.domModifications.injectedStyles;
    count += results.domModifications.suspiciousIds;
    count += results.resourceTimingSignals.extensionResources;
    count += results.globalPropertyPollution.suspiciousGlobals.length;
    count += results.performanceAnomalies.unusualNavigationTiming ? 1 : 0;
    count += results.knownExtensions.length;

    return count;
  }

  /**
   * Simple hash function for generating signatures
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
