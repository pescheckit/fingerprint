/**
 * Core type definitions for Device Thumbmark
 */

export interface ModuleResult {
  name: string;
  data: any;
  entropy: number;
  stability: number; // 0-100, how stable across browsers
  hardwareBased: boolean;
  error?: string;
}

export interface DeviceThumbmarkResult {
  // DUAL UUID SYSTEM
  deviceId: string;        // Tor-resistant UUID (same across all browsers)
  fingerprintId: string;   // Deep fingerprint UUID (browser-specific, high entropy)

  confidence: number;
  entropy: number;
  deviceEntropy: number;   // Entropy of device UUID (~27 bits)
  fingerprintEntropy: number; // Entropy of fingerprint UUID (~70 bits)
  stability: number;
  modules: ModuleResult[];
  timestamp: number;
  userAgent: string;
  isTor: boolean;         // Tor detection result
}

export interface ModuleInterface {
  name: string;
  entropy: number;
  stability: number;
  hardwareBased: boolean;
  isAvailable(): boolean;
  collect(): Promise<any> | any;
}

export interface DeviceThumbmarkOptions {
  modules?: string[]; // Specific modules to use
  timeout?: number; // Per-module timeout
  debug?: boolean;
}
