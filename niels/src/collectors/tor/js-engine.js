import { Collector } from '../../collector.js';

export class JSEngineCollector extends Collector {
  constructor() {
    super('jsEngine', 'JavaScript engine detection via quirks', []);
  }

  async collect() {
    return {
      // Math precision quirks
      toFixedQuirk: (0.1 + 0.2).toFixed(20),
      parseFloatEdge: parseFloat('1e-7').toString(),
      numberToString: (1000000000000000128).toString(),

      // Error stack format detection
      errorStackFormat: this._detectStackFormat(),

      // Object key enumeration
      keyEnumeration: this._testKeyEnumeration(),

      // Regex features
      regexDotAll: this._testRegexFeature(() => new RegExp('.', 's')),
      regexLookbehind: this._testRegexFeature(() => new RegExp('(?<=a)b')),
      regexNamedGroups: this._testRegexFeature(() => new RegExp('(?<name>a)')),
      regexUnicodeProperty: this._testRegexFeature(() => new RegExp('\\p{L}', 'u')),
    };
  }

  _detectStackFormat() {
    try {
      throw new Error('test');
    } catch (e) {
      if (!e.stack) return 'none';
      if (e.stack.includes(' at ')) return 'v8';       // Chrome/Node
      if (e.stack.includes('@')) return 'spidermonkey'; // Firefox
      return 'other';
    }
  }

  _testKeyEnumeration() {
    const obj = {};
    obj['2'] = true;
    obj['1'] = true;
    obj['b'] = true;
    obj['a'] = true;
    return Object.keys(obj).join(',');
  }

  _testRegexFeature(factory) {
    try {
      factory();
      return true;
    } catch {
      return false;
    }
  }
}
