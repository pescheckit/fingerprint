import { StorageMechanism } from './storage-mechanism.js';

const KEY = '_vid';

export class LocalStorage extends StorageMechanism {
  constructor() {
    super('localStorage');
  }

  async read() {
    return localStorage.getItem(KEY);
  }

  async write(value) {
    localStorage.setItem(KEY, value);
  }

  async isAvailable() {
    try {
      const testKey = '__fp_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
