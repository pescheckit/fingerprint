# Canvas Fingerprinting

## What is Canvas Fingerprinting?

Canvas fingerprinting exploits the HTML5 `<canvas>` element to generate a unique identifier for a browser/device combination. When instructed to render the same text, shapes, and colors, different browsers, operating systems, graphics drivers, and GPU hardware produce subtly different pixel-level output. By extracting the rendered image data (via `toDataURL()`), we get a signal that varies across environments but stays consistent for the same setup.

## How It Works

1. A hidden `<canvas>` element is created.
2. A series of drawing operations are performed — gradients, arcs, rectangles, text with specific fonts, and emoji.
3. The rendered pixel data is extracted as a base64-encoded PNG string using `canvas.toDataURL()`.
4. The resulting string serves as the fingerprint signal.

## Our Implementation

The `CanvasCollector` produces two separate signals:

- **geometry** — Renders shapes only (gradient rectangle, arc, stroked triangle). Geometry signals tend to be more stable across sessions because they don't depend on font rendering.
- **text** — Renders text strings using different fonts (Arial, Georgia, monospace) along with special characters and emoji. Text rendering is highly variable across environments, providing higher entropy.

Splitting these two signals allows consumers to choose the right stability/entropy tradeoff for their use case.

### Return Format

```js
{
  supported: true,       // false if canvas 2D context is unavailable
  geometry: "data:...",  // base64 PNG of geometry rendering
  text: "data:..."       // base64 PNG of text rendering
}
```

## Entropy & Uniqueness

**HIGH** — Canvas fingerprinting is one of the highest-entropy browser signals available. Studies have shown it can distinguish between a very large number of unique configurations due to differences in:

- GPU hardware and drivers
- Operating system text rendering (ClearType, subpixel AA, etc.)
- Browser rendering engine (Blink, Gecko, WebKit)
- Installed fonts and font fallback behavior
- Anti-aliasing and compositing implementation details

## Browser Compatibility

Canvas 2D is supported in all modern browsers:

| Browser | Support |
|---------|---------|
| Chrome  | Full    |
| Firefox | Full    |
| Safari  | Full    |
| Edge    | Full    |

Some browsers (Tor Browser, Brave) actively defend against canvas fingerprinting by adding noise to the rendered output or prompting the user for permission.

## Privacy Considerations

Canvas fingerprinting is a well-known tracking technique. Users and regulators are aware of it:

- **Tor Browser** randomizes canvas readout data, making the signal useless.
- **Brave** blocks or randomizes canvas fingerprinting by default.
- **Firefox** (with `privacy.resistFingerprinting`) returns uniform blank data.
- **GDPR/ePrivacy** regulations may require informed consent before collecting canvas fingerprints, depending on jurisdiction and use case.

Use canvas fingerprinting responsibly and in compliance with applicable privacy laws.
