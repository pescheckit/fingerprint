import { Collector } from '../collector.js';

export class MediaCollector extends Collector {
  constructor() {
    super('media', 'Media codec support, speech voices, and image formats', []);
  }

  async collect() {
    return {
      codecs: this._detectCodecs(),
      mimeTypes: this._detectMimeTypes(),
      speechVoices: this._getSpeechVoices(),
      imageFormats: await this._detectImageFormats(),
      mediaDevices: await this._getMediaDeviceKinds(),
    };
  }

  _detectCodecs() {
    const codecs = [
      // Video
      'video/mp4; codecs="avc1.42E01E"',           // H.264 Baseline
      'video/mp4; codecs="avc1.4D401E"',           // H.264 Main
      'video/mp4; codecs="avc1.64001E"',           // H.264 High
      'video/mp4; codecs="hvc1.1.6.L93.B0"',      // HEVC/H.265
      'video/mp4; codecs="av01.0.01M.08"',         // AV1
      'video/mp4; codecs="vp09.00.10.08"',         // VP9
      'video/webm; codecs="vp8"',                   // VP8
      'video/webm; codecs="vp9"',                   // VP9
      'video/webm; codecs="av01.0.01M.08"',        // AV1 in WebM
      'video/ogg; codecs="theora"',                 // Theora
      // Audio
      'audio/mp4; codecs="mp4a.40.2"',             // AAC-LC
      'audio/mp4; codecs="mp4a.40.5"',             // HE-AAC
      'audio/mp4; codecs="ac-3"',                   // AC-3/Dolby
      'audio/mp4; codecs="ec-3"',                   // E-AC-3
      'audio/mp4; codecs="flac"',                   // FLAC in MP4
      'audio/webm; codecs="opus"',                  // Opus
      'audio/webm; codecs="vorbis"',                // Vorbis
      'audio/ogg; codecs="opus"',                   // Opus in Ogg
      'audio/ogg; codecs="vorbis"',                 // Vorbis in Ogg
    ];

    const results = {};
    const video = document.createElement('video');

    for (const codec of codecs) {
      const key = codec.replace(/[^a-zA-Z0-9]/g, '_');
      try {
        results[key] = video.canPlayType(codec) || 'no';
      } catch {
        results[key] = 'error';
      }
    }

    return results;
  }

  _detectMimeTypes() {
    if (typeof MediaSource === 'undefined') {
      return { supported: false };
    }

    const types = [
      'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
      'video/mp4; codecs="avc1.64001E,mp4a.40.2"',
      'video/mp4; codecs="hvc1.1.6.L93.B0"',
      'video/mp4; codecs="av01.0.01M.08"',
      'video/webm; codecs="vp8,vorbis"',
      'video/webm; codecs="vp9,opus"',
      'video/webm; codecs="av01.0.01M.08,opus"',
      'audio/mp4; codecs="mp4a.40.2"',
      'audio/webm; codecs="opus"',
      'audio/webm; codecs="vorbis"',
    ];

    const results = {};
    for (const type of types) {
      const key = type.replace(/[^a-zA-Z0-9]/g, '_');
      try {
        results[key] = MediaSource.isTypeSupported(type);
      } catch {
        results[key] = 'error';
      }
    }

    return results;
  }

  _getSpeechVoices() {
    if (typeof speechSynthesis === 'undefined') {
      return { supported: false };
    }

    try {
      const voices = speechSynthesis.getVoices();
      return {
        supported: true,
        count: voices.length,
        voices: voices.map(v => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
        })),
      };
    } catch {
      return { supported: false };
    }
  }

  async _detectImageFormats() {
    const formats = {
      webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLanAyaAAAAAAAAgABAAAAAWR3dHAAAAAAcml6eQAAAAARAAoABwAIAAAADGlzcGUAAAAAAAAAAQAAAAEAAAAOcGl4aQAAAAADCAgIAAAAFWlwbWEAAAAAAAAAAQABAgECAAAAI21kYXQSAAoIBxAGBogQEDQgMgkQAAAABAAVdg==',
      jpegxl: 'data:image/jxl;base64,/woAEBAJCAQBACwASxLFgkWAHL0xN28kBdl1OlhbWnZ4bw==',
    };

    const results = {};
    for (const [name, uri] of Object.entries(formats)) {
      results[name] = await this._canLoadImage(uri);
    }

    return results;
  }

  _canLoadImage(src) {
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 2000);
      const img = new Image();
      img.onload = () => { clearTimeout(timeout); resolve(img.width > 0 && img.height > 0); };
      img.onerror = () => { clearTimeout(timeout); resolve(false); };
      img.src = src;
    });
  }

  async _getMediaDeviceKinds() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { supported: false };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Without permission we only get device kinds, not labels
      const kinds = {};
      for (const d of devices) {
        kinds[d.kind] = (kinds[d.kind] || 0) + 1;
      }
      return { supported: true, kinds };
    } catch {
      return { supported: false };
    }
  }
}
