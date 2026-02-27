# Niels — Browser Fingerprinting Library

Browser fingerprinting library that produces three identifiers:

- **Browser Fingerprint** (`fingerprint`) — SHA-256 hash of all collected signals. Unique per browser engine.
- **Device ID** (`deviceId`) — SHA-256 hash of hardware/OS-only signals (screen, timezone, touch). Same across different browsers on the same device.
- **Visitor ID** (`visitorId`) — Persistent UUID v4 stored across 7 storage mechanisms with majority vote. Survives cache/cookie clears via respawn.

## Architecture

```
main.js                         → Entry point, registers collectors, renders UI
src/
  fingerprinter.js              → Orchestrator: runs collectors in parallel, produces hashes
  collector.js                  → Base class: constructor(name, description, deviceKeys=[])
  hash.js                       → SHA-256 hashing with stable key sorting, excludes _ prefixed keys
  readable-id.js                → Converts hash to "adjective-color-animal-XX" format
  uuid.js                       → crypto.randomUUID() with manual fallback
  client.js                     → FingerprintClient: submits results to server API
  collectors/
    canvas.js                   → Canvas text metrics (8 fonts)
    webgl.js                    → GPU/driver info via WEBGL_debug_renderer_info
    navigator.js                → UA, platform, languages, hardwareConcurrency, deviceMemory
    screen.js                   → Dimensions, colorDepth, touch support [deviceKeys]
    timezone.js                 → Timezone, offset, locale [deviceKeys]
    audio.js                    → OfflineAudioContext rendering differences
    fonts.js                    → Dimension-based font detection (76 fonts)
    math.js                     → FP math precision differences per engine
    storage.js                  → Feature detection (localStorage, IDB, SW, etc.)
    tor/
      js-engine.js              → Math quirks, error stack format, regex features
      css-features.js           → CSS.supports() probes for engine-specific properties
      performance-profile.js    → Relative timing ratios (sort/math/regex/JSON)
      font-metrics.js           → measureText() on generic font families
  persistence/
    storage-mechanism.js        → Base class: read(), write(), isAvailable()
    cookie-storage.js           → First-party cookie, 400-day max-age, key: _vid
    local-storage.js            → localStorage, key: _vid
    session-storage.js          → sessionStorage, key: _vid
    indexed-db-storage.js       → IndexedDB, db: _fpdb, store: identity
    service-worker-storage.js   → Cache API, cache: _fp_cache
    window-name-storage.js      → window.name JSON, key: _vid
    visitor-id-manager.js       → Orchestrator: read all → majority vote → generate if new → respawn
server/
  index.js                      → Express API (port 3001)
  store.js                      → SQLite storage (better-sqlite3)
  matching.js                   → Probabilistic matching with weighted signals
  deploy.sh                     → Deploy script for bingo-barry.nl
```

## Collector interface

Every collector extends `Collector`:

```js
import { Collector } from '../collector.js';

export class MyCollector extends Collector {
  constructor() {
    // name, description, deviceKeys (keys stable across browsers)
    super('myCollector', 'What it collects', ['stableKey']);
  }

  async collect() {
    return { stableKey: 'value', browserSpecificKey: 'value' };
  }
}
```

- `deviceKeys` — keys included in the Device ID hash (hardware/OS signals only)
- Keys prefixed with `_` are excluded from hashing (display-only, e.g. canvas images)
- Collectors run in parallel via `Promise.all`
- Errors are caught per-collector; one failure doesn't break the fingerprint

## Fingerprinter output

```js
{
  fingerprint: "abc123...",              // SHA-256, all signals
  deviceId: "def456...",                 // SHA-256, deviceKeys only
  visitorId: "550e8400-e29b-...",        // UUID v4, persistent
  readableFingerprint: "bold-amber-hawk-3f",
  readableDeviceId: "lucid-storm-wasp-15",
  serverMatch: null,                     // reserved for server response
  signals: [
    { name, description, data, deviceData, duration, error }
  ]
}
```

## Server API

Hosted at `https://bingo-barry.nl/fingerprint/`. Express + SQLite, deployed via PM2.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fingerprint` | POST | Submit fingerprint, get probabilistic match |
| `/api/etag-store` | GET | Retrieve visitor ID via ETag header |
| `/api/etag-store` | POST | Store visitor ID for ETag persistence |

### Probabilistic matching weights (sum to 1.0)

| Signal | Weight | Match type |
|--------|--------|------------|
| IP /24 subnet | 0.15 | Subnet comparison |
| Audio fingerprint | 0.12 | Fuzzy (1% tolerance) |
| Timezone | 0.10 | Exact |
| Languages | 0.10 | Exact array match |
| Screen (WxH) | 0.10 | Exact |
| Hardware concurrency | 0.08 | Exact |
| Device memory | 0.08 | Exact |
| Platform | 0.07 | Exact |
| Touch support | 0.05 | Exact |
| Color depth | 0.05 | Exact |
| Timezone offset | 0.05 | Exact |
| Device ID | 0.05 | Exact hash |

Match threshold: 0.7 (70% confidence).

## Visitor ID persistence

7 storage layers with majority vote:

1. Cookie (400-day, `_vid`)
2. localStorage
3. sessionStorage
4. IndexedDB (`_fpdb`)
5. Cache API (`_fp_cache`)
6. window.name (JSON)
7. ETag (server-side, via `FingerprintClient`)

On load: read all → majority vote → respawn winning value to all layers.

## Commands

```bash
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build
npm run test             # Vitest unit tests (177 tests)
npm run test:e2e         # Playwright E2E tests
npm run test:cross-browser  # Cross-browser hash stability tests
npm run test:tor         # Tor browser tests

# Server
cd server && npm start   # Start API server on port 3001
cd server && npm test    # Node test runner (24 tests)
cd server && ./deploy.sh # Deploy to bingo-barry.nl
```

## Deployment

- **Frontend**: Auto-deploys to Cloudflare Pages on push to `main` → `https://fingerprint-3y6.pages.dev/niels/`
- **Server**: PM2 on bingo-barry.nl (84.235.169.30), Apache reverse proxy `/fingerprint/` → `localhost:3001`
- Deploy server changes: `cd server && ./deploy.sh`

## Adding a new collector

1. Create `src/collectors/my-thing.js` extending `Collector`
2. Create `tests/collectors/my-thing.test.js`
3. Register in `main.js`: `fingerprinter.register(new MyThingCollector())`
4. Run `npm run test` to verify
