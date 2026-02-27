import { StorageMechanism } from './storage-mechanism.js';

const KEY = '_vid';

export class CookieStorage extends StorageMechanism {
  constructor() {
    super('cookie');
  }

  async read() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === KEY) {
        return rest.join('=');
      }
    }
    return null;
  }

  async write(value) {
    document.cookie = `${KEY}=${value}; max-age=34560000; path=/; SameSite=Lax`;
  }

  async isAvailable() {
    return navigator.cookieEnabled;
  }
}
