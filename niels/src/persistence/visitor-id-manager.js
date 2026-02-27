import { generateUUID } from '../uuid.js';
import { CookieStorage } from './cookie-storage.js';
import { LocalStorage } from './local-storage.js';
import { SessionStorage } from './session-storage.js';
import { IndexedDBStorage } from './indexed-db-storage.js';
import { ServiceWorkerStorage } from './service-worker-storage.js';
import { WindowNameStorage } from './window-name-storage.js';

export class VisitorIdManager {
  constructor() {
    this.mechanisms = [
      new CookieStorage(),
      new LocalStorage(),
      new SessionStorage(),
      new IndexedDBStorage(),
      new ServiceWorkerStorage(),
      new WindowNameStorage(),
    ];
  }

  async resolve() {
    // 1. Filter mechanisms by availability
    const availabilityResults = await Promise.all(
      this.mechanisms.map(async (m) => {
        try {
          return { mechanism: m, available: await m.isAvailable() };
        } catch {
          return { mechanism: m, available: false };
        }
      })
    );
    const available = availabilityResults
      .filter((r) => r.available)
      .map((r) => r.mechanism);

    // 2. Read from all available mechanisms in parallel
    const readResults = await Promise.all(
      available.map(async (m) => {
        try {
          const value = await m.read();
          return { mechanism: m, value };
        } catch {
          return { mechanism: m, value: null };
        }
      })
    );

    // 3. Determine winning ID via majority vote
    const existing = readResults.filter((r) => r.value !== null);
    let visitorId;
    let isNew;
    const sources = [];

    if (existing.length > 0) {
      // Count occurrences of each ID
      const counts = new Map();
      for (const { value } of existing) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }

      // Find the ID with the most votes
      let maxCount = 0;
      for (const [id, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          visitorId = id;
        }
      }
      isNew = false;
      sources.push(
        ...existing
          .filter((r) => r.value === visitorId)
          .map((r) => r.mechanism.name)
      );
    } else {
      // 4. No existing ID found, generate new one
      visitorId = generateUUID();
      isNew = true;
    }

    // 5. Write to ALL available mechanisms (fire and forget)
    Promise.all(
      available.map((m) => m.write(visitorId).catch(() => {}))
    );

    return { visitorId, isNew, sources };
  }
}
