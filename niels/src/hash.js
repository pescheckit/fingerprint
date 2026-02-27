/**
 * Hash collected signals into a single fingerprint string using SHA-256.
 *
 * @param {Array<{name: string, data: any}>} signals - Array of collected signal results
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function hashSignals(signals) {
  const data = signals
    .filter(s => s.data !== null)
    .map(s => `${s.name}:${JSON.stringify(s.data, Object.keys(s.data).sort())}`)
    .join('|');

  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));

  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
