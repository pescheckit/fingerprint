import { hashSignals } from './hash.js';
import { hashToReadableId } from './readable-id.js';
import { VisitorIdManager } from './persistence/visitor-id-manager.js';

/**
 * Orchestrator that runs all registered collectors and produces fingerprints.
 *
 * Produces two hashes:
 * - `fingerprint`: Full fingerprint using all signals (browser-specific)
 * - `deviceId`: Fingerprint using only hardware/OS signals (same across browsers)
 */
export class Fingerprinter {
  constructor(options = {}) {
    /** @type {import('./collector.js').Collector[]} */
    this.collectors = [];
    this.options = options;
  }

  /**
   * Register a collector to be included in the fingerprint.
   * @param {import('./collector.js').Collector} collector
   * @returns {this} For chaining
   */
  register(collector) {
    this.collectors.push(collector);
    return this;
  }

  /**
   * Run all registered collectors and produce fingerprint hashes.
   *
   * @returns {Promise<{fingerprint: string, deviceId: string, visitorId: string|null, readableFingerprint: string, readableDeviceId: string, serverMatch: null, signals: Array<{name: string, description: string, data: any, deviceData: any, duration: number, error: string|null}>}>}
   */
  async collect() {
    const collectorsPromise = Promise.all(
      this.collectors.map(collector => this._runCollector(collector))
    );

    // Run visitor ID resolution in parallel with collectors (if not disabled)
    let visitorIdPromise = null;
    if (this.options.visitorId !== false) {
      visitorIdPromise = new VisitorIdManager().resolve()
        .then(result => result.visitorId)
        .catch(() => null);
    }

    const [results, visitorId] = await Promise.all([
      collectorsPromise,
      visitorIdPromise,
    ]);

    const fingerprint = await hashSignals(results.map(r => ({ name: r.name, data: r.data })));

    const deviceSignals = results
      .filter(r => r.deviceData !== null && Object.keys(r.deviceData).length > 0)
      .map(r => ({ name: r.name, data: r.deviceData }));

    const deviceId = deviceSignals.length > 0
      ? await hashSignals(deviceSignals)
      : null;

    return {
      fingerprint,
      deviceId,
      visitorId: visitorId ?? null,
      readableFingerprint: hashToReadableId(fingerprint),
      readableDeviceId: deviceId ? hashToReadableId(deviceId) : null,
      serverMatch: null,
      signals: results,
    };
  }

  /**
   * Run a single collector with error handling and timing.
   * Extracts device-stable keys from the result.
   * @param {import('./collector.js').Collector} collector
   */
  async _runCollector(collector) {
    const start = performance.now();
    try {
      const data = await collector.collect();

      // Extract only the device-stable keys
      let deviceData = null;
      if (collector.deviceKeys.length > 0 && data) {
        deviceData = {};
        for (const key of collector.deviceKeys) {
          if (key in data) {
            deviceData[key] = data[key];
          }
        }
      }

      return {
        name: collector.name,
        description: collector.description,
        data,
        deviceData,
        duration: performance.now() - start,
        error: null,
      };
    } catch (error) {
      return {
        name: collector.name,
        description: collector.description,
        data: null,
        deviceData: null,
        duration: performance.now() - start,
        error: error.message,
      };
    }
  }
}
