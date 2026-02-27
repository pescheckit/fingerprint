/**
 * Test script to verify Tor detection confidence calculation
 * Run with: node test-tor-calculation.js
 */

// Simulated indicators from actual Tor Browser
const torIndicators = {
  fixedCores: true,         // ✓
  fixedMemory: true,        // ✓
  webGLGeneric: true,       // ✓
  canvasRandomized: true,   // ✓
  limitedFonts: true,       // ✓
  resolutionRounded: true,  // ✓
  // All others false
  genericUA: false,
  forcedEnUS: false,
  uaConsistency: false,
  torCommonResolution: false,
  webGLBlocked: false,
  highLatency: false,
  timingAnomaly: false
};

// Current weights from tor-detection.ts
const weights = {
  fixedCores: 40,
  fixedMemory: 35,
  webGLGeneric: 30,
  genericUA: 25,
  webGLBlocked: 25,
  canvasRandomized: 20,
  forcedEnUS: 12,
  torCommonResolution: 12,
  uaConsistency: 12,
  timingAnomaly: 10,
  limitedFonts: 15,
  resolutionRounded: 15,
  highLatency: 5
};

// Calculate confidence
let score = 0;
let totalWeight = 0;
const detectedMethods = [];

console.log('=== TOR DETECTION CONFIDENCE CALCULATION ===\n');

for (const [key, weight] of Object.entries(weights)) {
  totalWeight += weight;
  if (torIndicators[key]) {
    score += weight;
    detectedMethods.push(key);
    console.log(`✓ ${key.padEnd(20)} +${weight.toString().padStart(2)} (TRUE)`);
  } else {
    console.log(`  ${key.padEnd(20)}  ${weight.toString().padStart(2)} (false)`);
  }
}

const confidence = Math.round((score / totalWeight) * 100);
const isTor = confidence >= 60;

console.log('\n=== RESULTS ===');
console.log(`Score:      ${score} / ${totalWeight}`);
console.log(`Confidence: ${confidence}%`);
console.log(`isTor:      ${isTor} (threshold: >= 60%)`);
console.log(`\nDetected methods (${detectedMethods.length}):`, detectedMethods);

// Verify against expected values
console.log('\n=== VERIFICATION ===');
if (detectedMethods.length === 6) {
  console.log('✓ Detected 6 indicators (expected)');
} else {
  console.log(`✗ Expected 6 indicators, got ${detectedMethods.length}`);
}

if (confidence >= 60) {
  console.log('✓ Confidence >= 60% (PASS)');
} else {
  console.log(`✗ Confidence is ${confidence}%, expected >= 60% (FAIL)`);
}

if (isTor === true) {
  console.log('✓ isTor is TRUE (expected)');
} else {
  console.log('✗ isTor is FALSE, expected TRUE (FAIL)');
}
