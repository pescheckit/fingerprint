# Screen Collector

## Overview

The Screen collector gathers display and screen properties from the browser. These include resolution, available screen area, color depth, pixel ratio, and touch capabilities. Together they form a **medium-entropy** fingerprint signal — not unique on its own, but useful when combined with other collectors.

## Collected Signals

| Signal | Source | Description |
|---|---|---|
| `width` | `screen.width` | Total screen width in CSS pixels |
| `height` | `screen.height` | Total screen height in CSS pixels |
| `availWidth` | `screen.availWidth` | Screen width minus OS UI (e.g. dock) |
| `availHeight` | `screen.availHeight` | Screen height minus OS UI (e.g. taskbar) |
| `colorDepth` | `screen.colorDepth` | Bits per pixel for color (typically 24 or 30) |
| `devicePixelRatio` | `window.devicePixelRatio` | Physical-to-CSS pixel ratio (e.g. 2 for Retina) |
| `maxTouchPoints` | `navigator.maxTouchPoints` | Max simultaneous touch points (0 = no touch) |
| `touchSupport` | `'ontouchstart' in window` | Whether touch events are supported |
| `screenFrame` | Calculated | OS chrome dimensions (see below) |

## The Screen Frame Trick

The **screenFrame** is derived from the difference between total and available screen dimensions:

```
top    = screen.height - screen.availHeight
left   = screen.width  - screen.availWidth
```

This reveals the size of the operating system's taskbar, dock, or menu bar. For example:

- **macOS** with the menu bar (25px) and dock (70px): `top: 25, bottom: 70`
- **Windows 11** with default taskbar: `bottom: 48`
- **Linux** with a top panel: `top: 28`

Because users rarely change taskbar size or position, screenFrame adds a stable distinguishing signal.

## Entropy and Uniqueness

**Rating: MEDIUM**

- Screen resolution alone has low entropy — most users share common resolutions (1920x1080, 2560x1440, etc.)
- devicePixelRatio adds differentiation (1, 1.25, 1.5, 2, 3 are all common)
- screenFrame is the highest-entropy sub-signal because it depends on OS, desktop environment, and taskbar configuration
- Touch properties help distinguish tablets/phones from desktops

## Browser Compatibility

All signals used are part of well-established web APIs:

- `screen.*` — supported in all browsers
- `window.devicePixelRatio` — supported in all modern browsers
- `navigator.maxTouchPoints` — supported in all modern browsers (IE 11+)
- `'ontouchstart' in window` — supported in all touch-capable browsers

## Privacy Considerations

Screen properties are passively available to any page without permissions. They are commonly used by responsive design and analytics scripts. The Screen Resolution entry in the EFF's Panopticlick study found that resolution + color depth provide roughly 4-5 bits of entropy on desktop browsers.

The screenFrame value is particularly notable because it can reveal OS and desktop environment details that the user may not intend to share.
