import { StorageMechanism } from './storage-mechanism.js';

const KEY = '_vid';

export class SessionStorage extends StorageMechanism {
  constructor() {
    super('sessionStorage');
  }

  async read() {
    return sessionStorage.getItem(KEY);
  }

  async write(value) {
    sessionStorage.setItem(KEY, value);
  }

  async isAvailable() {
    try {
      const testKey = '__fp_test__';
      sessionStorage.setItem(testKey, '1');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
