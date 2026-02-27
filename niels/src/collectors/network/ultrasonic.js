import { Collector } from '../../collector.js';

const FREQUENCIES = [18000, 18500, 19000, 19500];
const SLOT_DURATION = 200;  // ms per time slot
const REPEAT_COUNT = 3;

export class UltrasonicCollector extends Collector {
  constructor() {
    super('ultrasonic', 'Ultrasonic audio pairing beacon', []);
    this._audioCtx = null;
    this._oscillator = null;
    this._analyser = null;
    this._stream = null;
    this._emitting = false;
    this._receiving = false;
  }

  async collect() {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    const supported = !!AudioCtx;
    const micSupported = !!(globalThis.navigator && globalThis.navigator.mediaDevices &&
      globalThis.navigator.mediaDevices.getUserMedia);

    return {
      supported,
      audioContextSupported: supported,
      micSupported,
      mode: 'idle',
    };
  }

  async startEmitting(pairingCode) {
    if (this._emitting) return;
    this._emitting = true;

    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) throw new Error('AudioContext not supported');

    this._audioCtx = new AudioCtx();

    // Encode pairing code as 16-bit binary → 4 frequencies × 4 time slots
    const bits = this._codeToBits(pairingCode);

    for (let repeat = 0; repeat < REPEAT_COUNT && this._emitting; repeat++) {
      for (let slot = 0; slot < 4 && this._emitting; slot++) {
        const oscillators = [];
        for (let freq = 0; freq < FREQUENCIES.length; freq++) {
          const bitIndex = slot * 4 + freq;
          if (bits[bitIndex]) {
            const osc = this._audioCtx.createOscillator();
            const gain = this._audioCtx.createGain();
            osc.frequency.value = FREQUENCIES[freq];
            osc.type = 'sine';
            gain.gain.value = 0.15;
            osc.connect(gain);
            gain.connect(this._audioCtx.destination);
            osc.start();
            oscillators.push(osc);
          }
        }
        await this._sleep(SLOT_DURATION);
        oscillators.forEach(o => o.stop());
      }
      // Short pause between repeats
      if (repeat < REPEAT_COUNT - 1) await this._sleep(100);
    }

    this._emitting = false;
  }

  async startReceiving(timeout = 10000) {
    if (this._receiving) return { detected: false, pairingCode: null, confidence: 0 };
    this._receiving = true;

    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return { detected: false, pairingCode: null, confidence: 0 };

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._audioCtx = new AudioCtx();
      const source = this._audioCtx.createMediaStreamSource(this._stream);

      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 4096;
      source.connect(this._analyser);

      const sampleRate = this._audioCtx.sampleRate;
      const binSize = sampleRate / this._analyser.fftSize;
      const freqData = new Uint8Array(this._analyser.frequencyBinCount);

      // Collect samples over time slots
      const detectedBits = new Array(16).fill(0);
      const detectionCounts = new Array(16).fill(0);
      const totalSamples = Math.floor(timeout / 50);

      for (let sample = 0; sample < totalSamples && this._receiving; sample++) {
        this._analyser.getByteFrequencyData(freqData);

        for (let f = 0; f < FREQUENCIES.length; f++) {
          const targetBin = Math.round(FREQUENCIES[f] / binSize);
          const magnitude = freqData[targetBin] || 0;
          // Check surrounding bins too for robustness
          const left = freqData[targetBin - 1] || 0;
          const right = freqData[targetBin + 1] || 0;
          const peak = Math.max(magnitude, left, right);

          if (peak > 150) {
            // Determine which time slot this belongs to based on sample timing
            const slotInCycle = Math.floor((sample % (4 * (SLOT_DURATION / 50))) / (SLOT_DURATION / 50));
            const bitIndex = slotInCycle * 4 + f;
            if (bitIndex < 16) {
              detectionCounts[bitIndex]++;
            }
          }
        }

        await this._sleep(50);
      }

      // Threshold: require at least 2 detections per bit
      for (let i = 0; i < 16; i++) {
        detectedBits[i] = detectionCounts[i] >= 2 ? 1 : 0;
      }

      const pairingCode = this._bitsToCode(detectedBits);
      const totalDetections = detectionCounts.reduce((a, b) => a + b, 0);
      const confidence = Math.min(1, totalDetections / (16 * 3));

      this._receiving = false;
      this._cleanup();

      return {
        detected: totalDetections > 0,
        pairingCode: totalDetections > 0 ? pairingCode : null,
        confidence,
      };
    } catch (err) {
      this._receiving = false;
      this._cleanup();
      return { detected: false, pairingCode: null, confidence: 0, error: err.message };
    }
  }

  destroy() {
    this._emitting = false;
    this._receiving = false;
    this._cleanup();
  }

  _cleanup() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    if (this._audioCtx && this._audioCtx.state !== 'closed') {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
    this._analyser = null;
  }

  _codeToBits(code) {
    const num = typeof code === 'number' ? code : parseInt(code, 10);
    const bits = [];
    for (let i = 15; i >= 0; i--) {
      bits.push((num >> i) & 1);
    }
    return bits;
  }

  _bitsToCode(bits) {
    let num = 0;
    for (let i = 0; i < 16; i++) {
      num = (num << 1) | (bits[i] ? 1 : 0);
    }
    return num;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
