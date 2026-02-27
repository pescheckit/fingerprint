# Navigator Collector

## Overview

The Navigator collector gathers browser and device properties from the `navigator` object. These include user-agent strings, hardware hints, language preferences, and feature flags. Together they form a **medium-high entropy** fingerprint signal that varies significantly across browsers, OS versions, and device configurations.

## Collected Signals

| Signal | Source | Description |
|---|---|---|
| `userAgent` | `navigator.userAgent` | Full user-agent string identifying browser and OS |
| `platform` | `navigator.platform` | OS platform string (e.g. "Win32", "Linux x86_64") |
| `languages` | `navigator.languages` | Ordered list of preferred languages |
| `hardwareConcurrency` | `navigator.hardwareConcurrency` | Number of logical CPU cores |
| `deviceMemory` | `navigator.deviceMemory` | Approximate device RAM in GB (Chromium-only) |
| `vendor` | `navigator.vendor` | Browser vendor string |
| `cookieEnabled` | `navigator.cookieEnabled` | Whether cookies are enabled |
| `doNotTrack` | `navigator.doNotTrack` | Do Not Track preference ("1", "0", or null) |
| `pdfViewerEnabled` | `navigator.pdfViewerEnabled` | Whether the built-in PDF viewer is active |
| `maxTouchPoints` | `navigator.maxTouchPoints` | Maximum simultaneous touch points (0 = no touch) |

## Entropy and Uniqueness

**Rating: MEDIUM-HIGH**

- **userAgent** is the highest-entropy single signal here. Despite User-Agent reduction efforts (see Privacy below), it still encodes browser name, version, OS, and architecture.
- **languages** varies by locale and user configuration. Multi-language users (e.g. `["nl", "en-US", "de"]`) are more unique.
- **hardwareConcurrency** + **deviceMemory** together narrow down device class (budget phone vs. workstation).
- **platform** is being frozen in newer browsers but still differs across OS families today.
- Low-entropy signals like **cookieEnabled** and **pdfViewerEnabled** add incremental bits when combined with the rest.

## Browser Compatibility

| Signal | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| `userAgent` | Yes | Yes | Yes | Yes |
| `platform` | Yes | Yes | Yes | Yes |
| `languages` | Yes | Yes | Yes | Yes |
| `hardwareConcurrency` | Yes | Yes | Yes | Yes |
| `deviceMemory` | Yes | **No** | **No** | Yes |
| `vendor` | Yes | Yes | Yes | Yes |
| `cookieEnabled` | Yes | Yes | Yes | Yes |
| `doNotTrack` | Yes | Yes | Yes | Yes |
| `pdfViewerEnabled` | Yes | Yes | Yes | Yes |
| `maxTouchPoints` | Yes | Yes | Yes | Yes |

`deviceMemory` is Chromium-only (Chrome, Edge, Opera). The collector returns `null` when it is unavailable.

## Privacy Considerations

- **User-Agent Reduction (UA-CH):** Chrome is progressively freezing parts of the user-agent string through the User-Agent Client Hints initiative. Minor version, OS version, and platform details are being replaced with fixed values. This reduces `userAgent` entropy over time but does not eliminate it.
- **navigator.platform deprecation:** Browsers are moving toward returning a fixed string (e.g. always "Win32" on Windows regardless of architecture). This signal will lose entropy as browsers roll out changes.
- **deviceMemory** is considered a high-entropy surface by privacy-focused browsers. Firefox and Safari have chosen not to implement it.
- **doNotTrack** is being deprecated. Chrome removed support in version 133. Its presence or absence can itself be a signal.
- All navigator properties are passively readable without user permission, making them a common target for fingerprinting scripts and a focus area for browser privacy teams.
