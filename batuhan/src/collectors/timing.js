export function getTimingSignals() {
  // performance.now() resolution detection
  const samples = [];
  for (let i = 0; i < 100; i++) {
    samples.push(performance.now());
  }
  const diffs = [];
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i] - samples[i - 1];
    if (d > 0) diffs.push(d);
  }
  const minResolution = diffs.length > 0 ? Math.min(...diffs) : 0;

  // Timezone
  const timezoneOffset = new Date().getTimezoneOffset();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  // Cross-origin isolation
  const crossOriginIsolated = window.crossOriginIsolated;

  // Quick CPU benchmark
  const start = performance.now();
  let sum = 0;
  for (let i = 0; i < 1e6; i++) sum += Math.sqrt(i);
  const cpuBenchmarkMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    timezone,
    timezoneOffset,
    locale,
    performanceNowResolution: minResolution,
    crossOriginIsolated,
    cpuBenchmarkMs,
    dateString: new Date(0).toLocaleString(),
  };
}
