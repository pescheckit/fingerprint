import { Collector } from '../collector.js';

/**
 * Collects an audio fingerprint by rendering audio through an OfflineAudioContext
 * and hashing the resulting sample data.
 *
 * Different browser engines, audio stacks, and hardware produce subtly different
 * floating-point outputs for the same audio operations, creating a fingerprint signal.
 * No microphone access is required — all processing happens offline.
 */
export class AudioCollector extends Collector {
  constructor() {
    super('audio', 'Audio processing fingerprint', []);
  }

  async collect() {
    const OfflineCtx = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;

    if (!OfflineCtx) {
      return { supported: false, sampleSum: null, sampleRate: null, maxChannelCount: null, channelCount: null };
    }

    try {
      const context = new OfflineCtx(1, 44100, 44100);

      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, context.currentTime);
      compressor.knee.setValueAtTime(40, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);

      oscillator.start(0);

      const renderedBuffer = await context.startRendering();
      const samples = renderedBuffer.getChannelData(0);

      let sampleSum = 0;
      for (let i = 4500; i < 5000; i++) {
        sampleSum += Math.abs(samples[i]);
      }

      // Collect additional audio context properties
      let sampleRate = null;
      let maxChannelCount = null;
      let channelCount = null;

      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        sampleRate = audioContext.sampleRate;
        maxChannelCount = audioContext.destination.maxChannelCount;
        channelCount = audioContext.destination.channelCount;
        audioContext.close();
      }

      return { supported: true, sampleSum, sampleRate, maxChannelCount, channelCount };
    } catch {
      return { supported: false, sampleSum: null, sampleRate: null, maxChannelCount: null, channelCount: null };
    }
  }
}
