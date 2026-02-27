import { StorageMechanism } from './storage-mechanism.js';

const KEY = '_vid';

export class WindowNameStorage extends StorageMechanism {
  constructor() {
    super('windowName');
  }

  async read() {
    try {
      if (!window.name) return null;
      const data = JSON.parse(window.name);
      return data[KEY] ?? null;
    } catch {
      return null;
    }
  }

  async write(value) {
    let data = {};
    try {
      if (window.name) {
        data = JSON.parse(window.name);
      }
    } catch {
      // window.name wasn't valid JSON, start fresh
    }
    data[KEY] = value;
    window.name = JSON.stringify(data);
  }

  async isAvailable() {
    try {
      return typeof window.name === 'string';
    } catch {
      return false;
    }
  }
}
