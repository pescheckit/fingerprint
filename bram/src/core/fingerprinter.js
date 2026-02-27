/**
 * Core Fingerprinter - Orchestrates all modules
 */
import { hashObject } from './hasher.js';
import { safely, calculateEntropy, calculateConfidence } from './utils.js';

export class Fingerprinter {
  constructor(modules = []) {
    this.modules = modules;
  }

  async generate() {
    const components = {};
    const metadata = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      moduleCount: 0,
      failedModules: []
    };

    // Collect from all modules
    for (const Module of this.modules) {
      const moduleName = Module.name;

      // Check if module is available
      if (Module.isAvailable && !Module.isAvailable()) {
        metadata.failedModules.push(`${moduleName} (not available)`);
        continue;
      }

      // Collect data
      const data = await safely(
        () => Module.collect(),
        null
      );

      if (data !== null) {
        components[moduleName] = data;
        metadata.moduleCount++;
      } else {
        metadata.failedModules.push(`${moduleName} (collection failed)`);
      }
    }

    // Calculate entropy and confidence
    const entropyBits = calculateEntropy(components);
    const confidence = calculateConfidence(entropyBits);

    // Generate fingerprint hash
    const visitorId = hashObject(components);

    return {
      visitorId,
      confidence,
      entropyBits,
      components,
      metadata
    };
  }

  async generateDeviceId() {
    // For cross-browser matching, use only hardware-based signals
    const hardwareModules = this.modules.filter(m =>
      m.hardware === true
    );

    const fingerprinter = new Fingerprinter(hardwareModules);
    const result = await fingerprinter.generate();

    return {
      deviceId: result.visitorId,
      confidence: result.confidence,
      components: result.components
    };
  }
}
