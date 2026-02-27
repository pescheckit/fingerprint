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
  deviceId: string;
  confidence: number;
  entropy: number;
  stability: number;
  modules: ModuleResult[];
  timestamp: number;
  userAgent: string;
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
