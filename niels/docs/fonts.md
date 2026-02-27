# Font Detection Collector

## Overview

The Font Detection collector identifies which fonts are installed on the user's system by measuring how text renders in the browser. Because every OS ships a different default font set and users install additional fonts (design tools, language packs, office suites), the combination of installed fonts is a **high-entropy** fingerprint signal that is remarkably distinctive.

## How It Works

Font detection uses a **dimension-based measurement** technique:

1. A hidden `<span>` element is created off-screen with a test string (`mmmmmmmmmmlli`) at a large font size (72px). The characters are chosen to maximize width variation between typefaces — `m` is wide in most fonts, `l` and `i` are narrow, and different fonts handle their proportions differently.

2. Three **base fonts** are measured first: `monospace`, `sans-serif`, and `serif`. These are CSS generic font families that always resolve to _some_ installed font. Their rendered width and height serve as the baseline.

3. For each **candidate font**, the font-family is set to `'CandidateFont', basefont`. If the candidate is installed, the browser uses it and the rendered dimensions change. If it is _not_ installed, the browser falls back to the base font and the dimensions stay the same.

4. A font is reported as "detected" if its dimensions differ from the base font for **any** of the three base font families. Testing against all three bases reduces false negatives — a candidate might happen to have the same width as one base font but differ from another.

```
Base measurement:     font-family: monospace         → width: 100px
Candidate installed:  font-family: 'Arial', monospace → width: 87px   ← different = detected
Candidate missing:    font-family: 'FakeFont', monospace → width: 100px ← same = not installed
```

## Collected Signals

| Signal | Type | Description |
|---|---|---|
| `detectedFonts` | `string[]` | List of fonts confirmed as installed |
| `totalTested` | `number` | Total number of candidate fonts tested |
| `detectionMethod` | `string` | Always `'dimension'` — the technique used |

## Entropy and Uniqueness

**Rating: HIGH**

Font fingerprinting is one of the highest-entropy browser signals available:

- A typical system has 50-300+ fonts installed depending on OS, language, and installed applications
- The Panopticlick study found that font lists can provide **10+ bits of entropy** on their own
- Creative professionals (designers, developers) tend to have highly unique font sets due to commercial and custom font installations
- Even among users with the same OS, application installations (Microsoft Office, Adobe Creative Suite, LibreOffice) create variation

The `detectedFonts` array is marked as a **cross-browser key** because installed fonts are an OS-level property — the same fonts are available regardless of which browser is used.

## Browser Compatibility

The dimension-based technique works in **all browsers** because it relies only on:

- `document.createElement('span')` — universally supported
- `element.offsetWidth` / `element.offsetHeight` — universally supported
- CSS `font-family` with fallback — universally supported

No special APIs or permissions are required.

## Privacy Considerations

Font fingerprinting is a well-known tracking vector and browsers are actively working to limit it:

- **Firefox** (Enhanced Tracking Protection strict mode): restricts the list of fonts visible to web pages to a system-default set, significantly reducing entropy
- **Tor Browser**: returns a fixed, minimal font list to make all users look identical
- **Brave**: randomizes font metrics slightly to add noise to measurements
- **Safari**: limits the fonts available to web content (since macOS Catalina / Safari 13)
- **Chrome**: as of early 2025, does not restrict font enumeration, but the Privacy Sandbox initiative has discussed limiting it in future

The CSS Font Loading API (`document.fonts`) and `Local Font Access API` are related but separate mechanisms. The Local Font Access API requires explicit user permission, while the dimension-based technique used here works silently — which is precisely why browsers are restricting it.

Web developers should be aware that fingerprinting fonts without user consent may conflict with privacy regulations such as GDPR and ePrivacy, which generally require informed consent for non-essential tracking.
