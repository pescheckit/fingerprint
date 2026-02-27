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
  // TRIPLE UUID SYSTEM
  deviceId: string;        // Tor-resistant UUID (minimal, works on Tor) - 23 bits
  fingerprintId: string;   // Cross-browser device UUID (no browser-specific) - 85 bits
  browserId: string;       // Browser-specific UUID (ALL modules) - 150+ bits

  confidence: number;
  entropy: number;
  deviceEntropy: number;      // Entropy of device UUID (~23 bits)
  fingerprintEntropy: number; // Entropy of fingerprint UUID (~85 bits)
  browserEntropy: number;     // Entropy of browser UUID (~150 bits)
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
