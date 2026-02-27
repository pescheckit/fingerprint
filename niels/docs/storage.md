# Storage Collector

## Overview

The Storage collector detects the availability of browser storage mechanisms and related web platform features. Differences in storage API support -- especially in private/incognito browsing modes -- provide useful signals for distinguishing browser configurations.

## Collected Signals

| Signal | Source | Description |
|---|---|---|
| `localStorage` | `window.localStorage` | Whether localStorage is available and writable |
| `sessionStorage` | `window.sessionStorage` | Whether sessionStorage is available and writable |
| `indexedDB` | `window.indexedDB` | Whether IndexedDB is available |
| `openDatabase` | `window.openDatabase` | Whether WebSQL is available (Chromium-only) |
| `cookieEnabled` | `navigator.cookieEnabled` | Whether the browser reports cookies as enabled |
| `cookieWritable` | `document.cookie` | Whether a cookie can actually be set and read back |
| `serviceWorker` | `navigator.serviceWorker` | Whether the Service Worker API is available |
| `webWorker` | `window.Worker` | Whether Web Workers are supported |

All values are booleans.

## Entropy and Uniqueness

**Rating: LOW**

Most modern browsers support all of these storage mechanisms, so the majority of users will have identical results. However, there are meaningful distinctions in specific scenarios:

- **Private/incognito mode** may disable or restrict localStorage, sessionStorage, and cookie writing. Some browsers throw exceptions when accessing storage in private mode, which the collector detects.
- **openDatabase (WebSQL)** is Chromium-only. Firefox and Safari do not support it, making this signal a reliable browser-engine differentiator.
- **cookieEnabled vs cookieWritable** can diverge when browser extensions or policies block cookies while still reporting them as enabled.
- **Service Workers** are unavailable on insecure origins (non-HTTPS) and in some privacy-focused configurations.

Combined, these signals add incremental entropy when paired with other collectors, particularly for detecting private browsing and distinguishing browser engines.

## Cross-Browser Keys

None. The `openDatabase` signal is engine-dependent (Chromium vs. Gecko vs. WebKit), and private-browsing behavior varies by browser, so no storage signals are stable across browsers for the same device.

## Browser Compatibility

| Signal | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| `localStorage` | Yes | Yes | Yes | Yes |
| `sessionStorage` | Yes | Yes | Yes | Yes |
| `indexedDB` | Yes | Yes | Yes | Yes |
| `openDatabase` | Yes | **No** | **No** | Yes |
| `cookieEnabled` | Yes | Yes | Yes | Yes |
| `cookieWritable` | Yes | Yes | Yes | Yes |
| `serviceWorker` | Yes | Yes | Yes | Yes |
| `webWorker` | Yes | Yes | Yes | Yes |

`openDatabase` (WebSQL) was never standardized and is only available in Chromium-based browsers (Chrome, Edge, Opera). Safari dropped support in recent versions.

## Privacy Considerations

- Storage availability detection is **passive** -- it does not store persistent data. The collector writes a temporary test key and immediately removes it.
- Detecting private-browsing mode through storage behavior is a known fingerprinting technique. Browsers are actively working to make private mode indistinguishable from normal mode by no longer throwing exceptions on storage access.
- The `cookieWritable` test sets and immediately deletes a test cookie. No persistent tracking cookie is created.
- Service Worker availability can reveal whether the page is served over HTTPS, which is generally not sensitive information.
