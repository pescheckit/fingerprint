import { hashSignals } from './hash.js';

/**
 * Orchestrator that runs all registered collectors and produces a fingerprint.
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
   * Run all registered collectors and produce a fingerprint hash.
   *
   * @returns {Promise<{hash: string, signals: Array<{name: string, description: string, data: any, duration: number, error: string|null}>}>}
   */
  async collect() {
    const results = await Promise.all(
      this.collectors.map(collector => this._runCollector(collector))
    );

    const hash = await hashSignals(results);
    return { hash, signals: results };
  }

  /**
   * Run a single collector with error handling and timing.
   * @param {import('./collector.js').Collector} collector
   * @returns {Promise<{name: string, description: string, data: any, duration: number, error: string|null}>}
   */
  async _runCollector(collector) {
    const start = performance.now();
    try {
      const data = await collector.collect();
      return {
        name: collector.name,
        description: collector.description,
        data,
        duration: performance.now() - start,
        error: null,
      };
    } catch (error) {
      return {
        name: collector.name,
        description: collector.description,
        data: null,
        duration: performance.now() - start,
        error: error.message,
      };
    }
  }
}
