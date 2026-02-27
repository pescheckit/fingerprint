import { StorageMechanism } from './storage-mechanism.js';

const CACHE_NAME = '_fp_cache';
const URL_KEY = '/_fp_vid';

export class ServiceWorkerStorage extends StorageMechanism {
  constructor() {
    super('serviceWorker');
  }

  async read() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(URL_KEY);
    if (!response) return null;
    return response.text();
  }

  async write(value) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(URL_KEY, new Response(value));
  }

  async isAvailable() {
    return typeof caches !== 'undefined';
  }
}
