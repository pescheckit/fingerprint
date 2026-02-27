/**
 * Audio Fingerprinting Module
 * Entropy: ~4.5 bits
 * Stability: Very High
 * Hardware-based: Yes (audio processing hardware)
 */
export default class AudioModule {
  static name = 'audio';
  static entropy = 4.5;
  static hardware = true;

  static isAvailable() {
    return typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
  }

  static async collect() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioCtx();

    try {
      // Create offline context for consistent results
      const offlineContext = new OfflineAudioContext(1, 44100, 44100);

      // Create oscillator (1kHz sine wave)
      const oscillator = offlineContext.createOscillator();
      oscillator.frequency.value = 1000;

      // Create dynamics compressor (introduces variations)
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // Connect nodes
      oscillator.connect(compressor);
      compressor.connect(offlineContext.destination);

      // Start oscillator
      oscillator.start(0);

      // Render audio
      const audioBuffer = await offlineContext.startRendering();
      const channelData = audioBuffer.getChannelData(0);

      // Calculate fingerprint from audio data
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += Math.abs(channelData[i]);
      }

      // Get compressor properties (hardware-specific)
      const fingerprint = {
        sum: sum.toString(),
        hash: this.hashAudioData(channelData),
        sampleRate: audioContext.sampleRate,
        maxChannels: audioContext.destination.maxChannelCount,
        channelCount: audioContext.destination.channelCount,
        numberOfInputs: compressor.numberOfInputs,
        numberOfOutputs: compressor.numberOfOutputs,
        compressorReduction: compressor.reduction
      };

      audioContext.close();
      return fingerprint;

    } catch (e) {
      audioContext.close();
      throw e;
    }
  }

  static hashAudioData(data) {
    // Sample data points for faster hashing
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
