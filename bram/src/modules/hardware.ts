/**
 * Hardware Info Module - CPU and memory information
 * Entropy: ~6 bits | Stability: 99% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class HardwareModule implements ModuleInterface {
  name = 'hardware';
  entropy = 6;
  stability = 99;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined';
  }

  collect(): any {
    return {
      // CPU cores (highly stable)
      hardwareConcurrency: navigator.hardwareConcurrency,

      // Device memory (hardware-based)
      deviceMemory: (navigator as any).deviceMemory || null,

      // Platform (OS + architecture)
      platform: navigator.platform,

      // Max touch points (hardware capability)
      maxTouchPoints: navigator.maxTouchPoints,

      // Connection info (can indicate hardware type)
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,

      // Media devices count (requires permission but indicates hardware)
      mediaDevicesAvailable: typeof navigator.mediaDevices !== 'undefined'
    };
  }
}
