# Audio Fingerprinting

## What is Audio Fingerprinting?

Audio fingerprinting generates a unique identifier by processing audio through the Web Audio API's `OfflineAudioContext`. No microphone or speaker access is needed — all audio is rendered entirely in memory. Different browsers, operating systems, and audio hardware produce subtly different floating-point results when processing the same audio operations, creating a distinguishable signal.

## How It Works

1. An `OfflineAudioContext` is created (1 channel, 44100 samples, 44100Hz sample rate).
2. An `OscillatorNode` generates a triangle wave at 10000Hz.
3. The signal passes through a `DynamicsCompressorNode` which introduces non-linear processing.
4. The audio is rendered offline (no sound is played).
5. Sample values from a specific range (indices 4500–5000) of the output buffer are summed.
6. The resulting sum serves as the fingerprint signal — small floating-point differences across environments produce different sums.

The `DynamicsCompressorNode` is key: its non-linear compression amplifies tiny differences in how each browser/OS implements the audio processing pipeline.

## Our Implementation

The `AudioCollector` produces the following signals:

- **sampleSum** — The sum of absolute sample values in the 4500–5000 index range of the rendered audio buffer. This is the primary fingerprint value.
- **sampleRate** — The default sample rate of the audio hardware (typically 44100 or 48000).
- **maxChannelCount** — Maximum number of audio output channels supported by the hardware.
- **channelCount** — Current number of output channels.

### Return Format

```js
{
  supported: true,       // false if OfflineAudioContext is unavailable
  sampleSum: 35.749...,  // sum of absolute sample values
  sampleRate: 44100,     // hardware sample rate
  maxChannelCount: 2,    // max output channels
  channelCount: 1        // current output channels
}
```

## Entropy & Uniqueness

**MEDIUM-HIGH** — Audio fingerprinting provides good entropy, though somewhat less than canvas fingerprinting. Differences arise from:

- Browser engine audio implementation (Blink, Gecko, WebKit each produce different results)
- Operating system audio stack (WASAPI, CoreAudio, PulseAudio/PipeWire, ALSA)
- Audio hardware and drivers
- Floating-point implementation details across CPU architectures

The signal is most useful when combined with other fingerprint signals (canvas, WebGL, etc.) for higher overall entropy.

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | Full    | Uses `OfflineAudioContext` |
| Firefox | Full    | Uses `OfflineAudioContext` |
| Safari  | Full    | Requires `webkitOfflineAudioContext` prefix |
| Edge    | Full    | Uses `OfflineAudioContext` |

The collector automatically falls back to the `webkit`-prefixed constructor for Safari compatibility.

## Privacy Considerations

Audio fingerprinting is less well-known than canvas fingerprinting but is still a tracking vector:

- **Tor Browser** blocks or restricts audio context access to prevent fingerprinting.
- **Brave** may randomize audio output to mitigate fingerprinting.
- **Firefox** (with `privacy.resistFingerprinting`) returns uniform audio data.
- Unlike canvas fingerprinting, audio fingerprinting does not trigger visible permission prompts in most browsers, making it less detectable by users.
- **GDPR/ePrivacy** regulations may require informed consent before collecting audio fingerprints, depending on jurisdiction and use case.

Use audio fingerprinting responsibly and in compliance with applicable privacy laws.
