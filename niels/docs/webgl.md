# WebGL Fingerprinting

## What It Is

WebGL fingerprinting extracts information about the user's GPU and graphics driver through the WebGL API. Since WebGL exposes hardware-level details, the combination of parameters acts as a high-entropy identifier.

## Signals Collected

| Signal | Description |
|---|---|
| `vendor` | GPU vendor string (via `WEBGL_debug_renderer_info`) |
| `renderer` | GPU renderer string (e.g., "NVIDIA GeForce GTX 1080") |
| `maxTextureSize` | Maximum texture dimension supported |
| `maxViewportDims` | Maximum viewport width and height |
| `maxRenderbufferSize` | Maximum renderbuffer dimension |
| `extensions` | List of supported WebGL extensions |
| `vertexShaderPrecision` | Precision format ranges for vertex shaders |
| `fragmentShaderPrecision` | Precision format ranges for fragment shaders |

## Entropy / Uniqueness

**HIGH** -- The unmasked renderer string alone is highly distinctive, as it encodes the specific GPU model and driver version. Combined with supported extensions and shader precision formats, WebGL signals provide strong discriminating power across devices.

## How It Works

1. A hidden `<canvas>` element is created
2. A WebGL rendering context is obtained
3. The `WEBGL_debug_renderer_info` extension is queried for unmasked vendor/renderer strings
4. Hardware limits (`MAX_TEXTURE_SIZE`, `MAX_VIEWPORT_DIMS`, `MAX_RENDERBUFFER_SIZE`) are read via `getParameter()`
5. The full list of supported extensions is retrieved
6. Shader precision formats are queried for both vertex and fragment shaders across all precision types

## Browser Compatibility

- Chrome, Edge, Firefox, Safari, Opera: Full support
- Mobile browsers: Generally supported, though some may restrict `WEBGL_debug_renderer_info`
- Firefox 110+: Returns generic renderer strings by default (`privacy.resistFingerprinting`)
- Safari: May return limited renderer info depending on privacy settings

## Privacy Considerations

- The `WEBGL_debug_renderer_info` extension is the most privacy-sensitive signal, as it reveals exact GPU hardware
- Some browsers restrict or spoof this extension to reduce fingerprint surface
- WebGL fingerprinting works even when cookies are blocked or cleared
- Users running privacy-focused browsers (Tor, Brave) may see randomized or blocked WebGL data
