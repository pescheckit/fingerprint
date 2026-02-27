/**
 * Base class for all fingerprint signal collectors.
 * Each collector gathers a specific type of browser/device signal.
 *
 * Subclasses must implement the `collect()` method.
 */
export class Collector {
  /**
   * @param {string} name - Unique identifier for this collector (e.g., 'canvas', 'webgl')
   * @param {string} description - Human-readable description of what this collector does
   * @param {string[]} [crossBrowserKeys=[]] - Keys from collect() that are stable across browsers.
   *        These are hardware/OS-dependent signals, not browser-engine-dependent.
   *        Used to generate a cross-browser fingerprint hash.
   */
  constructor(name, description, crossBrowserKeys = []) {
    this.name = name;
    this.description = description;
    this.crossBrowserKeys = crossBrowserKeys;
  }

  /**
   * Collect the fingerprint signal.
   * Must be implemented by subclasses.
   *
   * @returns {Promise<Record<string, any>>} An object containing the collected signal data.
   *          Keys should be descriptive signal names, values should be serializable.
   */
  async collect() {
    throw new Error(`collect() not implemented for collector "${this.name}"`);
  }
}
