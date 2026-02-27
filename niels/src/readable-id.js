/**
 * Converts a hex hash into a human-readable identifier.
 *
 * Format: adjective-color-animal-XX
 * Example: "bold-amber-hawk-3f"
 *
 * Uses 3 bytes from the hash to index into word lists (64 entries each),
 * plus 2 hex chars as suffix. Total combinations: 64^3 × 256 ≈ 67 million.
 * The full hash is kept for exact matching; this is for display only.
 */

const ADJECTIVES = [
  'swift', 'bold', 'calm', 'keen', 'warm', 'cool', 'wild', 'free',
  'rare', 'fair', 'deep', 'vast', 'pure', 'wise', 'true', 'dark',
  'soft', 'loud', 'sharp', 'bright', 'quick', 'proud', 'brave', 'noble',
  'grand', 'prime', 'vivid', 'eager', 'lucid', 'agile', 'dense', 'broad',
  'lean', 'stern', 'brisk', 'fierce', 'gentle', 'silent', 'steady', 'golden',
  'silver', 'cosmic', 'mystic', 'subtle', 'frozen', 'molten', 'radiant', 'stellar',
  'ancient', 'hollow', 'woven', 'rugged', 'nimble', 'serene', 'hidden', 'daring',
  'fading', 'rising', 'lasting', 'dusty', 'rustic', 'primal', 'neural', 'lucent',
];

const COLORS = [
  'red', 'blue', 'green', 'amber', 'coral', 'ivory', 'jade', 'onyx',
  'ruby', 'sage', 'teal', 'plum', 'gold', 'zinc', 'iron', 'lime',
  'mint', 'opal', 'rose', 'rust', 'sand', 'snow', 'aqua', 'bark',
  'clay', 'dawn', 'dusk', 'fern', 'flax', 'foam', 'haze', 'lava',
  'leaf', 'moss', 'pine', 'rain', 'reed', 'salt', 'silk', 'slate',
  'smoke', 'stone', 'storm', 'ash', 'birch', 'bone', 'bronze', 'cedar',
  'chalk', 'chrome', 'cobalt', 'copper', 'cream', 'ebony', 'ember', 'frost',
  'granite', 'honey', 'indigo', 'khaki', 'lilac', 'mauve', 'navy', 'pearl',
];

const ANIMALS = [
  'fox', 'owl', 'elk', 'jay', 'bee', 'ram', 'eel', 'yak',
  'lynx', 'moth', 'puma', 'seal', 'dove', 'frog', 'goat', 'hare',
  'ibis', 'lark', 'mole', 'orca', 'pike', 'rook', 'swan', 'toad',
  'vole', 'wasp', 'wolf', 'bear', 'colt', 'crow', 'deer', 'duck',
  'hawk', 'kite', 'lion', 'mink', 'crane', 'eagle', 'finch', 'heron',
  'horse', 'otter', 'quail', 'raven', 'robin', 'shark', 'snake', 'stork',
  'tiger', 'trout', 'viper', 'whale', 'wren', 'bison', 'gecko', 'lemur',
  'mouse', 'panda', 'coral', 'drake', 'egret', 'koala', 'macaw', 'newt',
];

/**
 * Convert a hex hash string to a human-readable identifier.
 *
 * @param {string} hexHash - SHA-256 hex string (64 chars)
 * @returns {string} Readable identifier like "bold-amber-hawk-3f"
 */
export function hashToReadableId(hexHash) {
  if (!hexHash || hexHash.length < 6) return hexHash || '';

  const adj = parseInt(hexHash.slice(0, 2), 16) % ADJECTIVES.length;
  const col = parseInt(hexHash.slice(2, 4), 16) % COLORS.length;
  const ani = parseInt(hexHash.slice(4, 6), 16) % ANIMALS.length;
  const suffix = hexHash.slice(-2);

  return `${ADJECTIVES[adj]}-${COLORS[col]}-${ANIMALS[ani]}-${suffix}`;
}
