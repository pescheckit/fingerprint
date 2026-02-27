# Advanced Browser Fingerprinting Techniques Research

This document provides comprehensive research on advanced browser fingerprinting techniques, focusing on cookie-based tracking, protocol handler detection, and storage-based identification methods.

---

## 1. Cookie-Based Fingerprinting Techniques

### 1.1 Overview of Cookie Tracking

Cookies remain a fundamental tracking mechanism, with two primary categories:

**First-Party Cookies**
- Set by the website you're directly visiting
- Used for legitimate purposes like authentication, preferences, and shopping cart state
- Help remember preferences like language settings or login status
- Generally considered less privacy-invasive

**Third-Party Cookies**
- Set by external domains (advertisers, analytics services)
- Enable cross-site tracking and targeted advertising
- Being phased out by some browsers (Firefox blocks by default)
- Chrome reversed its 2020 decision to phase out third-party cookies in April 2025

### 1.2 Cookie Attributes for Fingerprinting

Modern cookies include several security attributes that can reveal information about the implementation:

#### HttpOnly Attribute
```http
Set-Cookie: sessionId=abc123; HttpOnly
```
- Cookies are only accessible via HTTP(S), not JavaScript
- Cannot be read via `document.cookie`
- Prevents XSS attacks from stealing cookie values
- Detection: Attempt to read cookie via JavaScript - if inaccessible, HttpOnly is set

#### Secure Attribute
```http
Set-Cookie: sessionId=abc123; Secure
```
- Cookie only sent over HTTPS connections
- Prevents MITM attacks from intercepting cookies
- Detection: Check if cookie is sent on HTTP vs HTTPS requests

#### SameSite Attribute
```http
Set-Cookie: sessionId=abc123; SameSite=Strict
Set-Cookie: tracking=xyz789; SameSite=Lax
Set-Cookie: crosssite=def456; SameSite=None; Secure
```

**SameSite=Strict**
- Cookie only sent for same-site requests
- Strongest CSRF protection
- May break legitimate cross-site workflows

**SameSite=Lax** (default in modern browsers)
- Sent on top-level navigation (clicking links)
- Blocks most cross-site request types
- Balance between security and usability

**SameSite=None**
- Allows all cross-site requests
- Must be combined with Secure attribute
- Required for legitimate cross-origin use cases

### 1.3 Detecting Cookie Support

```javascript
// Basic cookie detection
function areCookiesEnabled() {
    try {
        document.cookie = "cookietest=1";
        const cookiesEnabled = document.cookie.indexOf("cookietest=") !== -1;
        document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        return cookiesEnabled;
    } catch (e) {
        return false;
    }
}

// Detect third-party cookie support
function detectThirdPartyCookies(callback) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://third-party-test.example.com/cookie-test';

    window.addEventListener('message', function(event) {
        if (event.origin === 'https://third-party-test.example.com') {
            callback(event.data.cookiesEnabled);
        }
    });

    document.body.appendChild(iframe);
}
```

### 1.4 Supercookies and Evercookies

**Evercookie** is a persistent tracking technique that abuses multiple storage mechanisms to create virtually undeletable identifiers.

#### Storage Locations Used
1. Standard HTTP Cookies
2. Local Shared Objects (Flash cookies - deprecated)
3. Silverlight Isolated Storage (deprecated)
4. HTML5 localStorage
5. HTML5 sessionStorage
6. HTML5 IndexedDB
7. HTML5 Web SQL (deprecated)
8. window.name caching
9. Internet Explorer userData storage
10. HTML5 Canvas fingerprinting
11. PNG generation and caching
12. HTTP ETags
13. HTTP Cache

#### Evercookie Implementation Example

```javascript
class PersistentIdentifier {
    constructor() {
        this.id = this.generateOrRetrieveId();
    }

    generateOrRetrieveId() {
        // Try to retrieve from multiple sources
        let id = this.getFromLocalStorage() ||
                 this.getFromSessionStorage() ||
                 this.getFromIndexedDB() ||
                 this.getFromCookie() ||
                 this.getFromCache() ||
                 this.generateNewId();

        // Store in all available locations
        this.storeEverywhere(id);
        return id;
    }

    storeEverywhere(id) {
        this.storeInLocalStorage(id);
        this.storeInSessionStorage(id);
        this.storeInIndexedDB(id);
        this.storeInCookie(id);
        this.storeInCache(id);
    }

    storeInLocalStorage(id) {
        try {
            localStorage.setItem('_uid', id);
        } catch (e) {}
    }

    storeInSessionStorage(id) {
        try {
            sessionStorage.setItem('_uid', id);
        } catch (e) {}
    }

    async storeInIndexedDB(id) {
        try {
            const request = indexedDB.open('fingerprint', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('ids')) {
                    db.createObjectStore('ids');
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['ids'], 'readwrite');
                const store = transaction.objectStore('ids');
                store.put(id, 'uid');
            };
        } catch (e) {}
    }

    storeInCookie(id) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 10);
        document.cookie = `_uid=${id}; expires=${expiry.toUTCString()}; path=/`;
    }

    generateNewId() {
        return 'fp_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
```

### 1.5 Cookie Syncing and Cross-Domain Tracking

Cookie syncing allows advertisers to track users across multiple domains:

```javascript
// Advertiser A redirects to Advertiser B with user ID
// Example: user visits site1.com with Advertiser A tracking
// Advertiser A redirects to:
// https://adtech-b.com/sync?partner=adtech-a&uid=user123

// On adtech-b.com:
const urlParams = new URLSearchParams(window.location.search);
const partnerId = urlParams.get('partner');
const partnerUid = urlParams.get('uid');

// Store mapping in database
// Now Advertiser B knows that their userXYZ = Advertiser A's user123

// Create cookie for Advertiser B
document.cookie = `uid=userXYZ; domain=.adtech-b.com; path=/; max-age=31536000`;

// Redirect back or to 1x1 pixel
window.location.href = 'https://site1.com/pixel.gif';
```

### 1.6 Storage API Detection and Fingerprinting

```javascript
// Detect available storage APIs
function detectStorageAPIs() {
    const features = {
        cookies: false,
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        webSQL: false,
        cacheAPI: false,
        serviceWorker: false
    };

    // Cookie detection
    try {
        document.cookie = "test=1";
        features.cookies = document.cookie.indexOf("test=") !== -1;
        document.cookie = "test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    } catch (e) {}

    // localStorage
    try {
        localStorage.setItem('test', '1');
        features.localStorage = localStorage.getItem('test') === '1';
        localStorage.removeItem('test');
    } catch (e) {}

    // sessionStorage
    try {
        sessionStorage.setItem('test', '1');
        features.sessionStorage = sessionStorage.getItem('test') === '1';
        sessionStorage.removeItem('test');
    } catch (e) {}

    // IndexedDB
    features.indexedDB = !!window.indexedDB;

    // WebSQL (deprecated, removed in 2024)
    features.webSQL = !!window.openDatabase;

    // Cache API
    features.cacheAPI = !!window.caches;

    // Service Worker
    features.serviceWorker = !!navigator.serviceWorker;

    return features;
}

// Detect storage quota and usage
async function detectStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            return {
                quota: estimate.quota,
                usage: estimate.usage,
                percentage: (estimate.usage / estimate.quota) * 100,
                available: estimate.quota - estimate.usage
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}
```

### 1.7 Browser-Specific Storage Limitations

Different browsers implement different privacy protections:

**Safari (Intelligent Tracking Prevention)**
- localStorage, sessionStorage, IndexedDB cleared after 7 days of inactivity
- Third-party storage blocked entirely
- First-party cookies limited to 7-day expiry when set via JavaScript

**Firefox (Total Cookie Protection)**
- Cookies isolated per first-party domain
- Third-party cookies blocked by default
- Enhanced Tracking Protection blocks known trackers

**Chrome (Privacy Sandbox)**
- Delayed third-party cookie phase-out (as of 2025, still allowed)
- Topics API for interest-based advertising
- Attribution Reporting API for conversion tracking

```javascript
// Detect browser privacy features
function detectPrivacyFeatures() {
    const features = {
        browser: detectBrowser(),
        doNotTrack: navigator.doNotTrack === '1',
        globalPrivacyControl: navigator.globalPrivacyControl === true,
        storageAccess: !!document.requestStorageAccess,
        thirdPartyCookiesBlocked: false
    };

    // Test third-party cookie blocking
    // This requires cooperation from a third-party domain
    testThirdPartyCookieBlocking((blocked) => {
        features.thirdPartyCookiesBlocked = blocked;
    });

    return features;
}

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Unknown';
}
```

---

## 2. Protocol Handler Detection

### 2.1 Overview

Protocol handler detection exploits custom URL schemes registered by installed applications to fingerprint users. This technique can identify installed applications without requiring permissions or user interaction.

### 2.2 How Protocol Handlers Work

Applications register custom URL schemes (protocols) with the operating system:
- `steam://` - Steam gaming platform
- `discord://` - Discord chat application
- `spotify://` - Spotify music player
- `slack://` - Slack collaboration tool
- `zoom://` - Zoom video conferencing
- `vscode://` - Visual Studio Code
- `ms-teams://` - Microsoft Teams
- And hundreds more...

### 2.3 Detection Techniques

#### Method 1: Blur-Based Detection

This technique uses focus changes to detect if an application was launched:

```javascript
// Chrome, Safari, iOS detection
function detectProtocolHandler(scheme, timeout = 2000) {
    return new Promise((resolve) => {
        let blurred = false;

        // Detect if window loses focus
        const onBlur = () => {
            blurred = true;
            clearTimeout(timer);
            resolve(true); // Protocol handler exists
        };

        window.addEventListener('blur', onBlur, { once: true });

        // Create hidden iframe to test protocol
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Attempt to navigate to custom protocol
        iframe.contentWindow.location.href = scheme + '://test';

        // Timeout - if window didn't blur, handler likely doesn't exist
        const timer = setTimeout(() => {
            if (!blurred) {
                window.removeEventListener('blur', onBlur);
                document.body.removeChild(iframe);
                resolve(false); // Protocol handler doesn't exist
            }
        }, timeout);
    });
}

// Usage
async function detectInstalledApps() {
    const protocols = {
        steam: 'steam',
        discord: 'discord',
        spotify: 'spotify',
        slack: 'slack',
        zoom: 'zoom',
        vscode: 'vscode',
        teams: 'ms-teams',
        skype: 'skype',
        telegram: 'tg'
    };

    const results = {};

    for (const [app, protocol] of Object.entries(protocols)) {
        results[app] = await detectProtocolHandler(protocol);
        // Wait between tests to avoid overlapping blur events
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}
```

#### Method 2: Timing-Based Detection

Measures how long it takes for the browser to process an unknown protocol:

```javascript
function detectProtocolTiming(scheme) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const timeout = 1000;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        iframe.addEventListener('error', () => {
            const elapsed = performance.now() - startTime;
            // Known protocols typically fail faster
            resolve(elapsed < 100);
        });

        document.body.appendChild(iframe);

        try {
            iframe.src = scheme + '://';
        } catch (e) {
            const elapsed = performance.now() - startTime;
            resolve(elapsed < 100);
        }

        setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(false);
        }, timeout);
    });
}
```

#### Method 3: Firefox-Specific Detection

Firefox 64+ requires a different approach:

```javascript
function detectProtocolFirefox(scheme) {
    return new Promise((resolve) => {
        let detected = false;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';

        const onBlur = () => {
            detected = true;
            resolve(true);
        };

        iframe.addEventListener('blur', onBlur);
        document.body.appendChild(iframe);

        setTimeout(() => {
            try {
                iframe.contentWindow.location.href = scheme + '://test';
            } catch (e) {}
        }, 100);

        setTimeout(() => {
            iframe.removeEventListener('blur', onBlur);
            document.body.removeChild(iframe);
            if (!detected) {
                resolve(false);
            }
        }, 2000);
    });
}
```

#### Method 4: Scheme Flooding

A more aggressive technique that tests many protocols simultaneously:

```javascript
async function schemeFlooding() {
    const schemes = [
        // Gaming
        'steam', 'epicgames', 'origin', 'battlenet', 'minecraft',
        'riotgames', 'uplay', 'discord',

        // Communication
        'slack', 'zoom', 'teams', 'skype', 'telegram', 'whatsapp',
        'signal', 'wire',

        // Development
        'vscode', 'atom', 'sublime', 'webstorm', 'git',

        // Media
        'spotify', 'itunes', 'vlc', 'netflix',

        // Browsers
        'chrome', 'firefox', 'safari', 'edge',

        // Finance
        'metamask', 'coinbase',

        // Other
        'notion', 'obsidian', 'evernote', 'dropbox'
    ];

    const installedApps = [];
    const chunkSize = 5; // Test 5 at a time to avoid browser blocking

    for (let i = 0; i < schemes.length; i += chunkSize) {
        const chunk = schemes.slice(i, i + chunkSize);
        const results = await Promise.all(
            chunk.map(scheme => detectProtocolHandler(scheme))
        );

        chunk.forEach((scheme, index) => {
            if (results[index]) {
                installedApps.push(scheme);
            }
        });

        // Delay between chunks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return installedApps;
}
```

### 2.4 Common Protocol Handlers

Here's a comprehensive list of protocol handlers valuable for fingerprinting:

```javascript
const COMMON_PROTOCOLS = {
    // Gaming Platforms
    gaming: [
        { name: 'Steam', scheme: 'steam' },
        { name: 'Epic Games', scheme: 'com.epicgames.launcher' },
        { name: 'Origin', scheme: 'origin' },
        { name: 'Battle.net', scheme: 'battlenet' },
        { name: 'GOG Galaxy', scheme: 'goggalaxy' },
        { name: 'Ubisoft Connect', scheme: 'uplay' },
        { name: 'Xbox', scheme: 'xbox' },
        { name: 'Minecraft', scheme: 'minecraft' },
        { name: 'League of Legends', scheme: 'league-of-legends' },
        { name: 'Riot Games', scheme: 'riotgames' }
    ],

    // Communication
    communication: [
        { name: 'Discord', scheme: 'discord' },
        { name: 'Slack', scheme: 'slack' },
        { name: 'Zoom', scheme: 'zoom' },
        { name: 'Microsoft Teams', scheme: 'msteams' },
        { name: 'Skype', scheme: 'skype' },
        { name: 'Telegram', scheme: 'tg' },
        { name: 'WhatsApp', scheme: 'whatsapp' },
        { name: 'Signal', scheme: 'signal' },
        { name: 'Wire', scheme: 'wire' },
        { name: 'Element', scheme: 'element' }
    ],

    // Development Tools
    development: [
        { name: 'VS Code', scheme: 'vscode' },
        { name: 'Visual Studio', scheme: 'vs' },
        { name: 'IntelliJ IDEA', scheme: 'idea' },
        { name: 'WebStorm', scheme: 'webstorm' },
        { name: 'PyCharm', scheme: 'pycharm' },
        { name: 'Sublime Text', scheme: 'sublime' },
        { name: 'Atom', scheme: 'atom' },
        { name: 'Git', scheme: 'git' },
        { name: 'GitHub Desktop', scheme: 'github-mac' },
        { name: 'GitKraken', scheme: 'gitkraken' }
    ],

    // Media & Entertainment
    media: [
        { name: 'Spotify', scheme: 'spotify' },
        { name: 'iTunes', scheme: 'itunes' },
        { name: 'VLC', scheme: 'vlc' },
        { name: 'Netflix', scheme: 'netflix' },
        { name: 'YouTube Music', scheme: 'youtubemusic' },
        { name: 'Apple Music', scheme: 'music' }
    ],

    // Productivity
    productivity: [
        { name: 'Notion', scheme: 'notion' },
        { name: 'Obsidian', scheme: 'obsidian' },
        { name: 'Evernote', scheme: 'evernote' },
        { name: 'OneNote', scheme: 'onenote' },
        { name: 'Todoist', scheme: 'todoist' }
    ],

    // Cloud Storage
    storage: [
        { name: 'Dropbox', scheme: 'dbx' },
        { name: 'Google Drive', scheme: 'googledrive' },
        { name: 'OneDrive', scheme: 'onedrive' },
        { name: 'Box', scheme: 'box' }
    ],

    // Cryptocurrency
    crypto: [
        { name: 'MetaMask', scheme: 'metamask' },
        { name: 'Coinbase', scheme: 'coinbase' },
        { name: 'Binance', scheme: 'binance' },
        { name: 'Exodus', scheme: 'exodus' }
    ],

    // System/Browser
    system: [
        { name: 'Calculator', scheme: 'calculator' },
        { name: 'Settings', scheme: 'ms-settings' },
        { name: 'Mail', scheme: 'mailto' },
        { name: 'Tel', scheme: 'tel' },
        { name: 'SMS', scheme: 'sms' }
    ]
};
```

### 2.5 Browser Countermeasures

Modern browsers are implementing defenses against protocol handler detection:

**Chrome/Chromium**
- Shows permission prompt for unknown protocols
- Limits the rate of protocol handler requests
- May implement protocol handler randomization in future

**Firefox**
- Changed behavior in version 64+ to make detection harder
- Prompts user before launching external applications
- Some protocols are allowlisted and don't show prompts

**Safari**
- Strict protocol handler policies
- Limited custom protocol support
- Generally more restrictive than other browsers

**Brave**
- Blocks scheme flooding attacks
- Randomizes some fingerprinting vectors
- Enhanced privacy protections

### 2.6 Privacy Implications

Protocol handler detection is particularly invasive because:

1. **Cross-Browser Tracking**: Installed apps are consistent across browsers on the same device
2. **Persistent**: Apps remain installed for long periods
3. **Passive**: No user interaction or permission required
4. **Unique**: Combination of installed apps creates a distinctive pattern
5. **VPN-Resistant**: Works regardless of network-level privacy tools

### 2.7 Complete Detection Implementation

```javascript
class ProtocolDetector {
    constructor() {
        this.detectedProtocols = new Set();
        this.browser = this.detectBrowser();
    }

    detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox/')) return 'firefox';
        if (ua.includes('Edg/')) return 'edge';
        if (ua.includes('Chrome/')) return 'chrome';
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'safari';
        return 'unknown';
    }

    async detect(scheme, timeout = 2000) {
        if (this.browser === 'firefox') {
            return this.detectFirefox(scheme, timeout);
        }
        return this.detectBlur(scheme, timeout);
    }

    async detectBlur(scheme, timeout) {
        return new Promise((resolve) => {
            let detected = false;
            let timer;

            const cleanup = () => {
                window.removeEventListener('blur', onBlur);
                clearTimeout(timer);
                if (iframe && iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
            };

            const onBlur = () => {
                detected = true;
                cleanup();
                resolve(true);
            };

            window.addEventListener('blur', onBlur);

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px';
            document.body.appendChild(iframe);

            setTimeout(() => {
                try {
                    iframe.contentWindow.location.href = scheme + '://';
                } catch (e) {
                    cleanup();
                    resolve(false);
                }
            }, 100);

            timer = setTimeout(() => {
                cleanup();
                resolve(detected);
            }, timeout);
        });
    }

    async detectFirefox(scheme, timeout) {
        return new Promise((resolve) => {
            let detected = false;

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px';

            const onBlur = () => {
                detected = true;
                resolve(true);
            };

            iframe.addEventListener('blur', onBlur);
            document.body.appendChild(iframe);

            setTimeout(() => {
                try {
                    iframe.contentWindow.location.href = scheme + '://';
                } catch (e) {}
            }, 100);

            setTimeout(() => {
                iframe.removeEventListener('blur', onBlur);
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
                if (!detected) {
                    resolve(false);
                }
            }, timeout);
        });
    }

    async scanAll(protocols = COMMON_PROTOCOLS) {
        const results = {};
        const allProtocols = [];

        // Flatten protocols object
        for (const [category, items] of Object.entries(protocols)) {
            results[category] = [];
            allProtocols.push(...items.map(p => ({ ...p, category })));
        }

        // Test in batches to avoid browser throttling
        const batchSize = 3;
        for (let i = 0; i < allProtocols.length; i += batchSize) {
            const batch = allProtocols.slice(i, i + batchSize);

            await Promise.all(batch.map(async (protocol) => {
                const detected = await this.detect(protocol.scheme);
                if (detected) {
                    results[protocol.category].push(protocol.name);
                    this.detectedProtocols.add(protocol.scheme);
                }
            }));

            // Delay between batches
            if (i + batchSize < allProtocols.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    getFingerprint() {
        return {
            protocols: Array.from(this.detectedProtocols).sort(),
            hash: this.generateHash()
        };
    }

    generateHash() {
        const sorted = Array.from(this.detectedProtocols).sort().join(',');
        return this.simpleHash(sorted);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
}

// Usage
const detector = new ProtocolDetector();
detector.scanAll(COMMON_PROTOCOLS).then(results => {
    console.log('Detected applications:', results);
    console.log('Fingerprint:', detector.getFingerprint());
});
```

---

## 3. Advanced Storage Detection

### 3.1 HSTS Supercookie Technique

HTTP Strict Transport Security (HSTS) can be abused for tracking by exploiting how browsers cache HSTS policies.

#### How HSTS Tracking Works

1. Server sends HSTS header for specific subdomains
2. Browser caches which subdomains have HSTS enabled
3. On subsequent visits, browser behavior differs for HSTS vs non-HSTS domains
4. By encoding a unique ID in subdomain patterns, user can be tracked

#### HSTS Supercookie Implementation

```javascript
// Server-side (conceptual - actual implementation is server-dependent)
// For user ID "10110" (binary representation)
// Respond with HSTS for: bit0.example.com, bit2.example.com, bit3.example.com
// (bits that are "1")

// Client-side detection
class HSTSDetector {
    constructor(domain) {
        this.domain = domain;
        this.bits = 32; // 32-bit identifier
    }

    async readId() {
        const results = await Promise.all(
            Array.from({ length: this.bits }, (_, i) =>
                this.testBit(i)
            )
        );

        // Convert bit array to integer
        let id = 0;
        results.forEach((bit, index) => {
            if (bit) {
                id |= (1 << index);
            }
        });

        return id;
    }

    async testBit(bitIndex) {
        return new Promise((resolve) => {
            const subdomain = `bit${bitIndex}.${this.domain}`;
            const img = new Image();
            const timeout = 1000;

            let resolved = false;

            img.onload = img.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    // If HSTS is set, browser will automatically upgrade to HTTPS
                    // and connection will be faster/different
                    resolve(true);
                }
            };

            // Try HTTP - if HSTS is set, browser upgrades to HTTPS
            img.src = `http://${subdomain}/pixel.gif?t=${Date.now()}`;

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            }, timeout);
        });
    }
}

// Modern browsers have largely patched this by partitioning HSTS cache
```

**Browser Defenses:**
- Chrome: Partitions HSTS cache by top-level site (2020+)
- Firefox: Similar partitioning implemented
- Safari: HSTS cache isolation

### 3.2 Cache-Based Tracking

Browsers cache resources to improve performance, but this can be exploited for tracking.

#### Traditional Cache Detection

```javascript
class CacheTracker {
    constructor() {
        this.baseUrl = 'https://tracking.example.com/';
    }

    async testCached(resourceId) {
        const url = `${this.baseUrl}${resourceId}.png?cache=1`;
        const startTime = performance.now();

        try {
            await fetch(url, { cache: 'default' });
            const loadTime = performance.now() - startTime;

            // Cached resources load much faster (typically < 10ms)
            // Non-cached resources take longer (50ms+)
            return loadTime < 20;
        } catch (e) {
            return false;
        }
    }

    async readId(bits = 32) {
        const results = await Promise.all(
            Array.from({ length: bits }, (_, i) =>
                this.testCached(`bit${i}`)
            )
        );

        let id = 0;
        results.forEach((cached, index) => {
            if (cached) {
                id |= (1 << index);
            }
        });

        return id;
    }

    async writeId(id, bits = 32) {
        const promises = [];

        for (let i = 0; i < bits; i++) {
            const bitSet = (id >> i) & 1;
            if (bitSet) {
                // Force caching by loading resource
                const img = new Image();
                img.src = `${this.baseUrl}bit${i}.png?write=1`;
                promises.push(new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                }));
            }
        }

        await Promise.all(promises);
    }
}
```

#### Favicon Cache Tracking (Supercookie)

A sophisticated technique that exploits favicon caching:

```javascript
class FaviconTracker {
    constructor() {
        this.baseUrl = 'https://tracking.example.com/';
        this.bits = 32;
    }

    async readId() {
        const results = await Promise.all(
            Array.from({ length: this.bits }, (_, i) =>
                this.testFavicon(i)
            )
        );

        let id = 0;
        results.forEach((cached, index) => {
            if (cached) {
                id |= (1 << index);
            }
        });

        return id;
    }

    async testFavicon(bitIndex) {
        return new Promise((resolve) => {
            const subdomain = `f${bitIndex}`;
            const url = `${this.baseUrl}${subdomain}/favicon.ico`;

            const startTime = performance.now();

            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';

            let resolved = false;

            const cleanup = () => {
                if (!resolved) {
                    resolved = true;
                    const loadTime = performance.now() - startTime;
                    // Cached favicons load much faster
                    resolve(loadTime < 20);

                    setTimeout(() => {
                        if (link.parentNode) {
                            document.head.removeChild(link);
                        }
                    }, 100);
                }
            };

            link.addEventListener('load', cleanup);
            link.addEventListener('error', cleanup);

            link.href = url;
            document.head.appendChild(link);

            setTimeout(cleanup, 500);
        });
    }

    async writeId(id) {
        for (let i = 0; i < this.bits; i++) {
            const bitSet = (id >> i) & 1;
            if (bitSet) {
                await this.cacheFavicon(i);
            }
        }
    }

    async cacheFavicon(bitIndex) {
        return new Promise((resolve) => {
            const subdomain = `f${bitIndex}`;
            const url = `${this.baseUrl}${subdomain}/favicon.ico`;

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `${this.baseUrl}${subdomain}/`;

            iframe.onload = () => {
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }, 500);
            };

            document.body.appendChild(iframe);
        });
    }
}

// Browser defenses:
// Modern browsers partition favicon cache by top-level site
```

### 3.3 Service Worker Registration Tracking

Service Workers provide powerful caching capabilities that can be abused:

```javascript
class ServiceWorkerTracker {
    constructor() {
        this.scope = '/tracking/';
    }

    async isTracking() {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            return registrations.some(reg =>
                reg.scope.includes(this.scope)
            );
        } catch (e) {
            return false;
        }
    }

    async install(trackingId) {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register(
                '/sw-tracker.js',
                { scope: this.scope }
            );

            // Store tracking ID in service worker
            if (registration.active) {
                registration.active.postMessage({
                    type: 'SET_TRACKING_ID',
                    id: trackingId
                });
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    async getTrackingId() {
        if (!('serviceWorker' in navigator)) {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration(this.scope);

            if (!registration || !registration.active) {
                return null;
            }

            return new Promise((resolve) => {
                const channel = new MessageChannel();

                channel.port1.onmessage = (event) => {
                    if (event.data.type === 'TRACKING_ID') {
                        resolve(event.data.id);
                    }
                };

                registration.active.postMessage(
                    { type: 'GET_TRACKING_ID' },
                    [channel.port2]
                );

                setTimeout(() => resolve(null), 1000);
            });
        } catch (e) {
            return null;
        }
    }
}

// Service Worker file (sw-tracker.js)
/*
let trackingId = null;

self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_TRACKING_ID') {
        trackingId = event.data.id;

        // Persist in Cache API
        caches.open('tracking-cache').then(cache => {
            cache.put(
                new Request('/tracking-id'),
                new Response(JSON.stringify({ id: trackingId }))
            );
        });
    } else if (event.data.type === 'GET_TRACKING_ID') {
        event.ports[0].postMessage({
            type: 'TRACKING_ID',
            id: trackingId
        });
    }
});

self.addEventListener('install', () => {
    // Load tracking ID from cache on install
    caches.open('tracking-cache').then(cache => {
        cache.match('/tracking-id').then(response => {
            if (response) {
                response.json().then(data => {
                    trackingId = data.id;
                });
            }
        });
    });
});

self.addEventListener('fetch', (event) => {
    // Can track all requests made by the page
    if (trackingId) {
        // Send tracking beacon
        fetch('/track', {
            method: 'POST',
            body: JSON.stringify({
                id: trackingId,
                url: event.request.url,
                timestamp: Date.now()
            })
        });
    }
});
*/
```

### 3.4 WebSQL (Deprecated - Removed 2024)

WebSQL was removed from all browsers by 2024, but for historical context:

```javascript
// DEPRECATED - No longer works in modern browsers
class WebSQLTracker {
    constructor() {
        this.db = null;
    }

    async init() {
        if (!window.openDatabase) {
            return false;
        }

        try {
            this.db = openDatabase(
                'tracking_db',
                '1.0',
                'Tracking Database',
                5 * 1024 * 1024
            );

            this.db.transaction((tx) => {
                tx.executeSql(
                    'CREATE TABLE IF NOT EXISTS tracking (id TEXT PRIMARY KEY, value TEXT)'
                );
            });

            return true;
        } catch (e) {
            return false;
        }
    }

    async setId(trackingId) {
        if (!this.db) return false;

        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                tx.executeSql(
                    'INSERT OR REPLACE INTO tracking (id, value) VALUES (?, ?)',
                    ['user_id', trackingId],
                    () => resolve(true),
                    () => resolve(false)
                );
            });
        });
    }

    async getId() {
        if (!this.db) return null;

        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                tx.executeSql(
                    'SELECT value FROM tracking WHERE id = ?',
                    ['user_id'],
                    (tx, results) => {
                        if (results.rows.length > 0) {
                            resolve(results.rows.item(0).value);
                        } else {
                            resolve(null);
                        }
                    },
                    () => resolve(null)
                );
            });
        });
    }
}
```

### 3.5 Comprehensive Storage Fingerprinting

```javascript
class StorageFingerprinter {
    constructor() {
        this.results = {};
    }

    async generateFingerprint() {
        await this.testAllStorage();
        await this.measureQuotas();
        await this.testPersistence();

        return {
            ...this.results,
            hash: this.generateHash()
        };
    }

    async testAllStorage() {
        this.results.storage = {
            cookies: this.testCookies(),
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: await this.testIndexedDB(),
            cacheAPI: this.testCacheAPI(),
            serviceWorker: this.testServiceWorker(),
            webSQL: this.testWebSQL()
        };
    }

    testCookies() {
        try {
            document.cookie = 'test=1';
            const enabled = document.cookie.indexOf('test=') !== -1;
            document.cookie = 'test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
            return enabled;
        } catch (e) {
            return false;
        }
    }

    testLocalStorage() {
        try {
            localStorage.setItem('test', '1');
            const works = localStorage.getItem('test') === '1';
            localStorage.removeItem('test');
            return works;
        } catch (e) {
            return false;
        }
    }

    testSessionStorage() {
        try {
            sessionStorage.setItem('test', '1');
            const works = sessionStorage.getItem('test') === '1';
            sessionStorage.removeItem('test');
            return works;
        } catch (e) {
            return false;
        }
    }

    async testIndexedDB() {
        if (!window.indexedDB) return false;

        try {
            const request = indexedDB.open('test_db', 1);

            return new Promise((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    indexedDB.deleteDatabase('test_db');
                    resolve(true);
                };

                request.onerror = () => resolve(false);

                setTimeout(() => resolve(false), 1000);
            });
        } catch (e) {
            return false;
        }
    }

    testCacheAPI() {
        return !!window.caches;
    }

    testServiceWorker() {
        return !!navigator.serviceWorker;
    }

    testWebSQL() {
        return !!window.openDatabase;
    }

    async measureQuotas() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                this.results.quota = {
                    total: estimate.quota,
                    used: estimate.usage,
                    percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
                };
            } catch (e) {
                this.results.quota = null;
            }
        } else {
            this.results.quota = null;
        }
    }

    async testPersistence() {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            try {
                this.results.persistent = await navigator.storage.persisted();
            } catch (e) {
                this.results.persistent = false;
            }
        } else {
            this.results.persistent = false;
        }
    }

    generateHash() {
        const str = JSON.stringify(this.results);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
}

// Usage
const fingerprinter = new StorageFingerprinter();
fingerprinter.generateFingerprint().then(fp => {
    console.log('Storage Fingerprint:', fp);
});
```

---

## 4. Detection Prevention and Browser Countermeasures

### 4.1 Browser Privacy Features (2026)

**Brave Browser**
- Blocks fingerprinting by default
- Randomizes fingerprinting vectors per session
- Blocks third-party storage
- Implements script injection to spoof APIs

**Firefox**
- Enhanced Tracking Protection
- Total Cookie Protection (cookie partitioning)
- Blocks known fingerprinting scripts
- RFP (Resist Fingerprinting) mode available

**Safari**
- Intelligent Tracking Prevention (ITP)
- 7-day storage expiry for script-writable storage
- Third-party storage blocking
- Favicon cache partitioning

**Chrome**
- Privacy Sandbox initiatives
- Delayed third-party cookie deprecation
- User-Agent Client Hints
- Storage partitioning rollout

### 4.2 User Defenses

```javascript
// Detect if running in privacy mode
function detectPrivacyMode() {
    const tests = {
        cookiesDisabled: !navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === '1',
        globalPrivacyControl: navigator.globalPrivacyControl === true,
        privateMode: false
    };

    // Test for private browsing
    if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(() => {
            tests.privateMode = false;
        }).catch(() => {
            tests.privateMode = true;
        });
    }

    return tests;
}
```

---

## 5. Practical Implementation Example

Here's a complete fingerprinting system combining all techniques:

```javascript
class AdvancedFingerprinter {
    constructor() {
        this.fingerprint = {};
    }

    async generate() {
        console.log('Generating comprehensive fingerprint...');

        // Cookie-based tracking
        this.fingerprint.cookies = await this.analyzeCookies();

        // Storage detection
        this.fingerprint.storage = await this.analyzeStorage();

        // Protocol handlers
        this.fingerprint.protocols = await this.analyzeProtocols();

        // Generate final hash
        this.fingerprint.hash = this.generateHash();
        this.fingerprint.timestamp = Date.now();

        return this.fingerprint;
    }

    async analyzeCookies() {
        const cookieAnalyzer = {
            enabled: navigator.cookieEnabled,
            testCookie: false,
            thirdParty: null,
            attributes: {
                secure: null,
                httpOnly: null,
                sameSite: null
            }
        };

        // Test cookie setting
        try {
            document.cookie = 'fp_test=1; path=/';
            cookieAnalyzer.testCookie = document.cookie.includes('fp_test=1');
            document.cookie = 'fp_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (e) {}

        return cookieAnalyzer;
    }

    async analyzeStorage() {
        const storage = new StorageFingerprinter();
        return await storage.generateFingerprint();
    }

    async analyzeProtocols() {
        // Test a subset of high-value protocols
        const detector = new ProtocolDetector();
        const highValue = {
            gaming: [
                { name: 'Steam', scheme: 'steam' },
                { name: 'Discord', scheme: 'discord' }
            ],
            development: [
                { name: 'VS Code', scheme: 'vscode' }
            ],
            communication: [
                { name: 'Slack', scheme: 'slack' },
                { name: 'Zoom', scheme: 'zoom' }
            ]
        };

        return await detector.scanAll(highValue);
    }

    generateHash() {
        const str = JSON.stringify(this.fingerprint);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    }

    async save() {
        // Save to all available storage mechanisms
        const id = this.fingerprint.hash;

        try {
            localStorage.setItem('fp_id', id);
        } catch (e) {}

        try {
            sessionStorage.setItem('fp_id', id);
        } catch (e) {}

        try {
            document.cookie = `fp_id=${id}; max-age=31536000; path=/`;
        } catch (e) {}

        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction(['fingerprints'], 'readwrite');
            const store = tx.objectStore('fingerprints');
            store.put({ id: 'current', value: id });
        } catch (e) {}
    }

    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('fingerprint_db', 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('fingerprints')) {
                    db.createObjectStore('fingerprints', { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    }
}

// Usage
const fingerprinter = new AdvancedFingerprinter();
fingerprinter.generate().then(async (fp) => {
    console.log('Complete Fingerprint:', fp);
    await fingerprinter.save();

    // Send to server
    fetch('/api/fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fp)
    });
});
```

---

## 6. Privacy and Ethical Considerations

### Important Notes

1. **Legal Compliance**: Many jurisdictions require user consent before tracking (GDPR, CCPA, etc.)
2. **Transparency**: Users should be informed about data collection
3. **Purpose Limitation**: Data should only be used for stated purposes
4. **Security**: Fingerprinting data must be properly secured
5. **User Rights**: Provide mechanisms for users to opt-out or delete their data

### Browser Fingerprinting Detection

Users can test if they're being fingerprinted using tools like:
- EFF's Cover Your Tracks (https://coveryourtracks.eff.org/)
- AmIUnique (https://amiunique.org/)
- BrowserScan (https://www.browserscan.net/)

---

## 7. Sources and References

### Cookie-Based Fingerprinting
- [Browser Fingerprinting Cookie Tracking Techniques](https://factually.co/fact-checks/technology/browser-fingerprinting-first-party-tracking-bypass-protections-mitigation-6bb415)
- [The Rise of Fingerprinting in Marketing 2025](https://transcenddigital.com/blog/fingerprinting-marketing-tracking-without-cookies-2025/)
- [Browser Fingerprinting vs Cookies - Pixelscan](https://pixelscan.net/blog/fingerprinting-cookies/)
- [Cookie Security Guide - Barrion](https://barrion.io/blog/cookie-security-best-practices)
- [Cookie Security 101 - Medium](https://medium.com/@christian.asterisk/cookie-security-101-httponly-secure-and-samesite-8509e1b7f498)

### Protocol Handler Detection
- [Custom Protocol Handlers for Fingerprinting - gHacks](https://www.ghacks.net/2021/05/14/custom-browser-protocol-handlers-may-be-used-for-fingerprinting/)
- [External Protocol Flooding - Fingerprint.com](https://fingerprint.com/blog/external-protocol-flooding/)
- [Detect Custom Protocol Handler - GitHub Gist](https://gist.github.com/kfatehi/f2f521c654bab106fdf9)
- [Custom Protocol Check - GitHub](https://github.com/vireshshah/custom-protocol-check)
- [List of URI Schemes - Wikipedia](https://en.wikipedia.org/wiki/List_of_URI_schemes)

### Supercookies and Storage Tracking
- [Evercookie - Wikipedia](https://en.wikipedia.org/wiki/Evercookie)
- [Evercookie GitHub - Samy Kamkar](https://github.com/samyk/evercookie)
- [HSTS Cookie GitHub](https://github.com/ben174/hsts-cookie)
- [Supercookie via Favicon - GitHub](https://github.com/jonasstrehle/supercookie)
- [What is Evercookie - DICloak](https://dicloak.com/glossary/evercookie)

### Cache-Based Tracking
- [Cache-Based Tracking Methods - Hackers Arise](https://hackers-arise.com/digital-forensics-browser-fingerprinting-part-2-audio-and-cache-based-tracking-methods/)
- [Tales of Favicons and Caches - ResearchGate](https://www.researchgate.net/publication/350051466_Tales_of_Favicons_and_Caches_Persistent_Tracking_in_Modern_Browsers)
- [SafeCache Prevention Guide](https://lifetips.alibaba.com/tech-efficiency/prevent-cache-based-tracking-with-safecache)

### Storage APIs and Detection
- [Web Tracking Overview - WebSec](https://albertofdr.github.io/web-security-class/advanced/web.tracking)
- [Browser Storage Explained - DEV Community](https://dev.to/arnavsharma2711/browser-storage-explained-localstorage-vs-sessionstorage-vs-indexeddb-vs-cookies-283k)
- [Safari Intelligent Tracking Prevention](https://www.customerlabs.com/blog/understanding-safari-intelligent-tracking-prevention-apple-itp-impact/)

### WebSQL and Deprecated Technologies
- [Deprecating Web SQL - Chrome Developers](https://developer.chrome.com/blog/deprecating-web-sql)
- [Web SQL Database - Wikipedia](https://en.wikipedia.org/wiki/Web_SQL_Database)

### Timing Attacks and iframes
- [2026 Iframe Security Risks](https://qrvey.com/blog/iframe-security/)
- [Network Timing - XS-Leaks Wiki](https://xsleaks.dev/docs/attacks/timing-attacks/network-timing/)
- [Pixel Perfect Timing Attacks - Black Hat](https://media.blackhat.com/us-13/US-13-Stone-Pixel-Perfect-Timing-Attacks-with-HTML5-WP.pdf)

### Browser Privacy and Defenses (2026)
- [Browser Privacy Test 2026 - Digital Digest](https://digitaldigest.com/browser-privacy-test-2026/)
- [Privacy Focused Browsers 2026](https://twitiq.com/privacy-focused-browsers-in-2026/)
- [Browser Fingerprinting Defense 2026 - BrightCoding](http://www.blog.brightcoding.dev/2026/01/21/browser-fingerprint-defense-guide-how-to-become-invisible-online-in-2026)
- [AI-Driven Browser Fingerprinting - Incogniton](https://incogniton.com/blog/ai-driven-browser-fingerprinting-how-tracking-is-evolving/)
- [Browser Fingerprinting Metadata Surveillance - Freemindtronic](https://freemindtronic.com/browser-fingerprinting-tracking/)

### General Fingerprinting Resources
- [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs)
- [Browser Fingerprinting - web.dev](https://web.dev/learn/privacy/fingerprinting/)
- [Browser Detection Guide 2026 - Chameleon](https://chameleonmode.com/browser-detection-fingerprinting-2026/)
- [Cover Your Tracks - EFF](https://coveryourtracks.eff.org/)
- [BrowserScan Fingerprint Tool](https://www.browserscan.net/)

---

## Conclusion

Advanced browser fingerprinting techniques represent a significant privacy challenge in 2026. While browsers have implemented various countermeasures, tracking techniques continue to evolve. The combination of cookie-based tracking, protocol handler detection, and storage-based identification creates a powerful fingerprinting arsenal that can identify users across sessions and even across different browsers on the same device.

Key takeaways:
1. **Cookie tracking** remains effective despite browser restrictions through techniques like cookie syncing and first-party workarounds
2. **Protocol handler detection** provides cross-browser identification based on installed applications
3. **Storage mechanisms** (localStorage, IndexedDB, cache) enable persistent tracking even when cookies are cleared
4. **Browser defenses** are improving but tracking techniques adapt quickly
5. **Combining techniques** creates highly unique and persistent fingerprints

This research is intended for educational purposes to understand the privacy landscape and develop better protections.
