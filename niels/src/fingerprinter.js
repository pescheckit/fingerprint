import { hashSignals } from './hash.js';

/**
 * Orchestrator that runs all registered collectors and produces fingerprints.
 *
 * Produces two hashes:
 * - `hash`: Full fingerprint using all signals (browser-specific)
 * - `crossBrowserHash`: Fingerprint using only hardware/OS signals (same across browsers)
 */
export class Fingerprinter {
  constructor() {
    /** @type {import('./collector.js').Collector[]} */
    this.collectors = [];
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
   * @returns {Promise<{hash: string, crossBrowserHash: string, signals: Array<{name: string, description: string, data: any, crossBrowserData: any, duration: number, error: string|null}>}>}
   */
  async collect() {
    const results = await Promise.all(
      this.collectors.map(collector => this._runCollector(collector))
    );

    const hash = await hashSignals(results.map(r => ({ name: r.name, data: r.data })));

    const crossBrowserSignals = results
      .filter(r => r.crossBrowserData !== null && Object.keys(r.crossBrowserData).length > 0)
      .map(r => ({ name: r.name, data: r.crossBrowserData }));

    const crossBrowserHash = crossBrowserSignals.length > 0
      ? await hashSignals(crossBrowserSignals)
      : null;

    return { hash, crossBrowserHash, signals: results };
  }

  /**
   * Run a single collector with error handling and timing.
   * Extracts cross-browser stable keys from the result.
   * @param {import('./collector.js').Collector} collector
   */
  async _runCollector(collector) {
    const start = performance.now();
    try {
      const data = await collector.collect();

      // Extract only the cross-browser stable keys
      let crossBrowserData = null;
      if (collector.crossBrowserKeys.length > 0 && data) {
        crossBrowserData = {};
        for (const key of collector.crossBrowserKeys) {
          if (key in data) {
            crossBrowserData[key] = data[key];
          }
        }
      }

      return {
        name: collector.name,
        description: collector.description,
        data,
        crossBrowserData,
        duration: performance.now() - start,
        error: null,
      };
    } catch (error) {
      return {
        name: collector.name,
        description: collector.description,
        data: null,
        crossBrowserData: null,
        duration: performance.now() - start,
        error: error.message,
      };
    }
  }
}
