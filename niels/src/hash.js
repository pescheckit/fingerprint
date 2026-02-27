/**
 * Recursively create a stable JSON string with sorted keys.
 * Excludes keys starting with '_' at all levels (display-only fields).
 * Properly handles nested objects, arrays, and typed arrays.
 */
function stableStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (ArrayBuffer.isView(value)) {
    return '[' + Array.from(value).map(stableStringify).join(',') + ']';
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter(k => !k.startsWith('_')).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }
  return String(value);
}

/**
 * Hash collected signals into a single fingerprint string using SHA-256.
 *
 * Keys starting with '_' are excluded from the hash (display-only fields).
 * Nested objects are properly serialized with sorted keys at all levels.
 *
 * @param {Array<{name: string, data: any}>} signals - Array of collected signal results
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function hashSignals(signals) {
  const data = signals
    .filter(s => s.data !== null)
    .map(s => `${s.name}:${stableStringify(s.data)}`)
    .join('|');

  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));

  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
