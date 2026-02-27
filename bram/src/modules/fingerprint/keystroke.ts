/**
 * Keystroke Dynamics Module - Behavioral biometric fingerprinting
 * Entropy: ~8 bits | Stability: 70% | Hardware-based: No
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 *
 * Keystroke dynamics is a behavioral biometric that analyzes typing patterns.
 * Research shows individuals have unique typing rhythms that can be measured:
 *
 * - Dwell Time: How long a key is held down
 * - Flight Time: Time between releasing one key and pressing the next
 * - Typing Speed: Overall words per minute and variance
 * - Key Pressure Patterns: Rhythm and cadence of typing
 *
 * Academic Research:
 * - Monrose & Rubin (2000): "Keystroke dynamics as a biometric for authentication"
 * - Banerjee & Woodard (2012): "Biometric authentication and identification using keystroke dynamics"
 * - Monaco et al. (2013): "Spoofing resistance of keystroke dynamics"
 *
 * Privacy Considerations:
 * - Requires active user interaction (keyboard input)
 * - Can track user behavior over time
 * - May reveal physical characteristics (e.g., typing impairments)
 * - Should only be used with explicit user consent
 *
 * Limitations:
 * - Low stability across sessions (70%)
 * - Affected by user state (fatigue, stress, injuries)
 * - Requires sufficient typing samples for accuracy
 * - Can be spoofed by replay attacks
 */

import { ModuleInterface } from '../../types';

interface KeystrokeEvent {
  key: string;
  pressTime: number;
  releaseTime: number;
  dwellTime: number;
}

interface KeystrokeData {
  avgDwellTime: number;
  avgFlightTime: number;
  dwellVariance: number;
  flightVariance: number;
  typingSpeed: number;
  sampleSize: number;
  pattern: string;
}

export class KeystrokeDynamicsModule implements ModuleInterface {
  name = 'keystroke-dynamics';
  entropy = 8;
  stability = 70;
  hardwareBased = false; // Behavioral, not hardware

  private keystrokeEvents: KeystrokeEvent[] = [];
  private keyDownTimes: Map<string, number> = new Map();
  private lastReleaseTime: number = 0;
  private flightTimes: number[] = [];
  private collectTimeout: number = 5000; // Collect for 5 seconds
  private isCollecting: boolean = false;

  isAvailable(): boolean {
    return typeof document !== 'undefined' && typeof document.addEventListener !== 'undefined';
  }

  async collect(): Promise<KeystrokeData> {
    return new Promise((resolve) => {
      if (this.isCollecting) {
        // If already collecting, return cached data
        resolve(this.analyzePattern());
        return;
      }

      this.isCollecting = true;
      this.keystrokeEvents = [];
      this.keyDownTimes.clear();
      this.flightTimes = [];
      this.lastReleaseTime = 0;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Ignore modifier keys and special keys
        if (event.key.length > 1) return;

        const now = performance.now();
        this.keyDownTimes.set(event.key, now);
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        // Ignore modifier keys and special keys
        if (event.key.length > 1) return;

        const now = performance.now();
        const pressTime = this.keyDownTimes.get(event.key);

        if (pressTime) {
          const dwellTime = now - pressTime;

          // Record keystroke event
          this.keystrokeEvents.push({
            key: event.key,
            pressTime,
            releaseTime: now,
            dwellTime
          });

          // Calculate flight time (time between key releases)
          if (this.lastReleaseTime > 0) {
            const flightTime = now - this.lastReleaseTime;
            this.flightTimes.push(flightTime);
          }

          this.lastReleaseTime = now;
          this.keyDownTimes.delete(event.key);
        }
      };

      // Attach event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      // Collect for specified timeout, then analyze
      setTimeout(() => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        this.isCollecting = false;

        resolve(this.analyzePattern());
      }, this.collectTimeout);
    });
  }

  private analyzePattern(): KeystrokeData {
    const sampleSize = this.keystrokeEvents.length;

    // If no samples, return default pattern
    if (sampleSize === 0) {
      return {
        avgDwellTime: 0,
        avgFlightTime: 0,
        dwellVariance: 0,
        flightVariance: 0,
        typingSpeed: 0,
        sampleSize: 0,
        pattern: 'no-input'
      };
    }

    // Calculate average dwell time
    const dwellTimes = this.keystrokeEvents.map(e => e.dwellTime);
    const avgDwellTime = this.average(dwellTimes);
    const dwellVariance = this.variance(dwellTimes, avgDwellTime);

    // Calculate average flight time
    const avgFlightTime = this.flightTimes.length > 0 ? this.average(this.flightTimes) : 0;
    const flightVariance = this.flightTimes.length > 0 ? this.variance(this.flightTimes, avgFlightTime) : 0;

    // Calculate typing speed (keys per minute)
    const totalTime = sampleSize > 1
      ? (this.keystrokeEvents[sampleSize - 1].releaseTime - this.keystrokeEvents[0].pressTime) / 1000 / 60
      : 0;
    const typingSpeed = totalTime > 0 ? sampleSize / totalTime : 0;

    // Generate pattern signature
    const pattern = this.generatePatternSignature(avgDwellTime, avgFlightTime, dwellVariance, flightVariance);

    return {
      avgDwellTime: parseFloat(avgDwellTime.toFixed(2)),
      avgFlightTime: parseFloat(avgFlightTime.toFixed(2)),
      dwellVariance: parseFloat(dwellVariance.toFixed(2)),
      flightVariance: parseFloat(flightVariance.toFixed(2)),
      typingSpeed: parseFloat(typingSpeed.toFixed(2)),
      sampleSize,
      pattern
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private variance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.average(squaredDiffs);
  }

  private generatePatternSignature(
    avgDwell: number,
    avgFlight: number,
    dwellVar: number,
    flightVar: number
  ): string {
    // Create a hash-like signature from the timing patterns
    const components = [
      Math.floor(avgDwell / 10),
      Math.floor(avgFlight / 10),
      Math.floor(dwellVar / 100),
      Math.floor(flightVar / 100)
    ];

    return components.map(c => c.toString(36)).join('-');
  }
}
