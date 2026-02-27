/**
 * Touch Capabilities Module (Tor-Resistant)
 * Device type indicator (desktop vs tablet vs mobile)
 * Entropy: ~1 bit | Stability: 99% | Hardware-based: Yes
 */

import { ModuleInterface } from '../../types';

export class TouchCapabilitiesModule implements ModuleInterface {
  name = 'touch-capabilities';
  entropy = 1;
  stability = 99;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined';
  }

  collect(): any {
    return {
      maxTouchPoints: navigator.maxTouchPoints,
      touchSupport: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      deviceClass: this.classifyDevice(navigator.maxTouchPoints),
      signature: navigator.maxTouchPoints.toString()
    };
  }

  private classifyDevice(touchPoints: number): string {
    if (touchPoints === 0) return 'desktop';
    if (touchPoints <= 2) return 'laptop-touchscreen';
    if (touchPoints <= 5) return 'tablet';
    return 'mobile';
  }
}
