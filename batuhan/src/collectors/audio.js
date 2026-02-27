export function getAudioFingerprint() {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AudioCtx) return resolve({ supported: false });

      const ctx = new AudioCtx(1, 44100, 44100);

      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, ctx.currentTime);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, ctx.currentTime);
      compressor.knee.setValueAtTime(40, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      oscillator.connect(compressor);
      compressor.connect(ctx.destination);
      oscillator.start(0);

      ctx.oncomplete = (event) => {
        const buffer = event.renderedBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 4500; i < 5000; i++) {
          sum += Math.abs(buffer[i]);
        }
        resolve({
          supported: true,
          fingerprint: sum.toString(),
          sampleRate: 44100,
        });
      };

      ctx.startRendering();
    } catch (e) {
      resolve({ supported: false, error: e.message });
    }
  });
}

export function getAudioContextProperties() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const props = {
      supported: true,
      sampleRate: ctx.sampleRate,
      maxChannelCount: ctx.destination.maxChannelCount,
      channelCount: ctx.destination.channelCount,
      channelCountMode: ctx.destination.channelCountMode,
      channelInterpretation: ctx.destination.channelInterpretation,
    };
    ctx.close();
    return props;
  } catch (e) {
    return { supported: false, error: e.message };
  }
}
