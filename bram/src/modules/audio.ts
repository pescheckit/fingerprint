/**
 * Audio Hardware Module - Audio processing fingerprint
 * Entropy: ~6 bits | Stability: 85% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class AudioModule implements ModuleInterface {
  name = 'audio';
  entropy = 6;
  stability = 85;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }

  async collect(): Promise<any> {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioCtx();

    try {
      // Create offline context for consistent results
      const offlineContext = new OfflineAudioContext(1, 44100, 44100);

      // Create oscillator (1kHz sine wave)
      const oscillator = offlineContext.createOscillator();
      oscillator.frequency.value = 1000;

      // Dynamics compressor (hardware-dependent)
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // Connect nodes
      oscillator.connect(compressor);
      compressor.connect(offlineContext.destination);

      oscillator.start(0);

      // Render audio
      const audioBuffer = await offlineContext.startRendering();
      const channelData = audioBuffer.getChannelData(0);

      // Calculate fingerprint
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += Math.abs(channelData[i]);
      }

      const result = {
        sum: sum.toFixed(10),
        hash: this.hashAudioData(channelData),
        sampleRate: audioContext.sampleRate,
        maxChannels: audioContext.destination.maxChannelCount,
        channelCount: audioContext.destination.channelCount,
        baseLatency: audioContext.baseLatency || 0,
        outputLatency: audioContext.outputLatency || 0
      };

      await audioContext.close();
      return result;

    } catch (error) {
      await audioContext.close();
      throw error;
    }
  }

  private hashAudioData(data: Float32Array): string {
    let hash = 0;
    const step = Math.floor(data.length / 50);

    for (let i = 0; i < data.length; i += step) {
      const value = Math.floor(data[i] * 1000000);
      hash = ((hash << 5) - hash) + value;
      hash = hash & hash;
    }

    return hash.toString(36);
  }
}
