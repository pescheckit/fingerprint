import { Collector } from '../../collector.js';

export class CSSFeaturesCollector extends Collector {
  constructor() {
    super('cssFeatures', 'CSS feature support detection', []);
  }

  async collect() {
    const features = {
      // Engine-specific prefixes
      webkitAppearance: this._supports('-webkit-appearance', 'none'),
      mozAppearance: this._supports('-moz-appearance', 'none'),
      webkitBackdropFilter: this._supports('-webkit-backdrop-filter', 'blur(1px)'),

      // Modern features
      containerQueries: this._supports('container-type', 'inline-size'),
      subgrid: this._supports('grid-template-columns', 'subgrid'),
      hasSelector: this._supportsSelector(':has(*)'),
      nesting: this._supports('selector(&)', ''),  // CSS nesting
      colorMix: this._supports('color', 'color-mix(in srgb, red, blue)'),
      lch: this._supports('color', 'lch(50% 50 50)'),
      oklch: this._supports('color', 'oklch(50% 0.2 50)'),
      layerSupport: this._supportsAtRule('@layer test { }'),

      // Layout
      aspectRatio: this._supports('aspect-ratio', '1/1'),
      contentVisibility: this._supports('content-visibility', 'auto'),
      scrollTimeline: this._supports('scroll-timeline-name', 'test'),
      viewTransition: this._supports('view-transition-name', 'test'),
    };

    return features;
  }

  _supports(property, value) {
    try {
      if (typeof CSS !== 'undefined' && CSS.supports) {
        return CSS.supports(property, value);
      }
      return null;
    } catch {
      return null;
    }
  }

  _supportsSelector(selector) {
    try {
      if (typeof CSS !== 'undefined' && CSS.supports) {
        return CSS.supports(`selector(${selector})`);
      }
      return null;
    } catch {
      return null;
    }
  }

  _supportsAtRule(rule) {
    try {
      if (typeof CSS !== 'undefined' && CSS.supports) {
        // At-rules can't be tested with CSS.supports directly
        // Test via stylesheet injection
        const style = document.createElement('style');
        style.textContent = rule;
        document.head.appendChild(style);
        const supported = style.sheet && style.sheet.cssRules.length > 0;
        document.head.removeChild(style);
        return supported;
      }
      return null;
    } catch {
      return null;
    }
  }
}
