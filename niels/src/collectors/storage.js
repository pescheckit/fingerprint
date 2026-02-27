import { Collector } from '../collector.js';

/**
 * Detects availability of browser storage mechanisms and related features.
 *
 * Storage APIs behave differently in private/incognito browsing modes and
 * vary across browser engines (e.g. openDatabase is Chromium-only). These
 * differences provide low-entropy but useful fingerprint signals.
 */
export class StorageCollector extends Collector {
  constructor() {
    super('storage', 'Storage and feature detection', []);
  }

  async collect() {
    return {
      localStorage: this.#testLocalStorage(),
      sessionStorage: this.#testSessionStorage(),
      indexedDB: this.#testIndexedDB(),
      openDatabase: this.#testOpenDatabase(),
      cookieEnabled: this.#testCookieEnabled(),
      cookieWritable: this.#testCookieWritable(),
      serviceWorker: this.#testServiceWorker(),
      webWorker: this.#testWebWorker(),
    };
  }

  #testLocalStorage() {
    try {
      const key = '__fp_test__';
      globalThis.localStorage.setItem(key, '1');
      globalThis.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  #testSessionStorage() {
    try {
      const key = '__fp_test__';
      globalThis.sessionStorage.setItem(key, '1');
      globalThis.sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  #testIndexedDB() {
    return !!globalThis.indexedDB;
  }

  #testOpenDatabase() {
    return typeof globalThis.openDatabase === 'function';
  }

  #testCookieEnabled() {
    const n = globalThis.navigator || {};
    return typeof n.cookieEnabled === 'boolean' ? n.cookieEnabled : false;
  }

  #testCookieWritable() {
    try {
      const doc = globalThis.document;
      if (!doc) return false;
      const key = '__fp_test__';
      doc.cookie = `${key}=1; SameSite=Lax`;
      const writable = doc.cookie.indexOf(key) !== -1;
      doc.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      return writable;
    } catch {
      return false;
    }
  }

  #testServiceWorker() {
    const n = globalThis.navigator || {};
    return !!n.serviceWorker;
  }

  #testWebWorker() {
    return typeof globalThis.Worker === 'function';
  }
}
