/**
 * Mouse Dynamics Module - Behavioral biometric fingerprinting
 * Entropy: ~8 bits | Stability: 70% | Hardware-based: No
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 *
 * Mouse dynamics analyzes how users move and interact with their mouse/trackpad.
 * Research shows individuals have unique mouse movement patterns:
 *
 * - Movement Velocity: Speed of mouse movements
 * - Acceleration Patterns: How quickly velocity changes
 * - Click Patterns: Timing between clicks and click duration
 * - Movement Trajectory: Curvature and directness of movements
 * - Jitter/Smoothness: Micro-movements and noise in the signal
 *
 * Academic Research:
 * - Pusara & Brodley (2004): "User re-authentication via mouse movements"
 * - Gamboa & Fred (2004): "A behavioral biometric system based on human-computer interaction"
 * - Zheng et al. (2011): "Efficient user re-authentication for mobile devices"
 *
 * Privacy Considerations:
 * - Requires active user interaction (mouse/trackpad usage)
 * - Can track user behavior continuously
 * - May reveal physical characteristics (e.g., motor impairments)
 * - Should only be used with explicit user consent
 * - Can be used for tracking across sessions
 *
 * Limitations:
 * - Low stability across sessions (70%)
 * - Affected by user state (fatigue, stress)
 * - Different behavior on mouse vs trackpad vs touchscreen
 * - Requires sufficient movement samples for accuracy
 * - Can be spoofed by automated mouse movements
 */

import { ModuleInterface } from '../../types';

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

interface ClickEvent {
  timestamp: number;
  duration: number;
  button: number;
}

interface MouseDynamicsData {
  avgVelocity: number;
  avgAcceleration: number;
  velocityVariance: number;
  accelerationVariance: number;
  avgClickDuration: number;
  clickFrequency: number;
  movementSmoothness: number;
  sampleSize: number;
  pattern: string;
}

export class MouseDynamicsModule implements ModuleInterface {
  name = 'mouse-dynamics';
  entropy = 8;
  stability = 70;
  hardwareBased = false; // Behavioral, not hardware

  private movements: MouseMovement[] = [];
  private clicks: ClickEvent[] = [];
  private lastPosition: { x: number; y: number; timestamp: number } | null = null;
  private lastVelocity: number = 0;
  private mouseDownTime: number = 0;
  private collectTimeout: number = 5000; // Collect for 5 seconds
  private isCollecting: boolean = false;

  isAvailable(): boolean {
    return typeof document !== 'undefined' && typeof document.addEventListener !== 'undefined';
  }

  async collect(): Promise<MouseDynamicsData> {
    return new Promise((resolve) => {
      if (this.isCollecting) {
        // If already collecting, return cached data
        resolve(this.analyzePattern());
        return;
      }

      this.isCollecting = true;
      this.movements = [];
      this.clicks = [];
      this.lastPosition = null;
      this.lastVelocity = 0;
      this.mouseDownTime = 0;

      const handleMouseMove = (event: MouseEvent) => {
        const now = performance.now();
        const x = event.clientX;
        const y = event.clientY;

        if (this.lastPosition) {
          // Calculate distance and time delta
          const dx = x - this.lastPosition.x;
          const dy = y - this.lastPosition.y;
          const dt = now - this.lastPosition.timestamp;

          if (dt > 0) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const velocity = distance / dt; // pixels per millisecond

            // Calculate acceleration
            const acceleration = (velocity - this.lastVelocity) / dt;

            this.movements.push({
              x,
              y,
              timestamp: now,
              velocity,
              acceleration
            });

            this.lastVelocity = velocity;
          }
        }

        this.lastPosition = { x, y, timestamp: now };
      };

      const handleMouseDown = (event: MouseEvent) => {
        this.mouseDownTime = performance.now();
      };

      const handleMouseUp = (event: MouseEvent) => {
        if (this.mouseDownTime > 0) {
          const now = performance.now();
          const duration = now - this.mouseDownTime;

          this.clicks.push({
            timestamp: now,
            duration,
            button: event.button
          });

          this.mouseDownTime = 0;
        }
      };

      // Attach event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);

      // Collect for specified timeout, then analyze
      setTimeout(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        this.isCollecting = false;

        resolve(this.analyzePattern());
      }, this.collectTimeout);
    });
  }

  private analyzePattern(): MouseDynamicsData {
    const movementSampleSize = this.movements.length;
    const clickSampleSize = this.clicks.length;

    // If no samples, return default pattern
    if (movementSampleSize === 0 && clickSampleSize === 0) {
      return {
        avgVelocity: 0,
        avgAcceleration: 0,
        velocityVariance: 0,
        accelerationVariance: 0,
        avgClickDuration: 0,
        clickFrequency: 0,
        movementSmoothness: 0,
        sampleSize: 0,
        pattern: 'no-input'
      };
    }

    // Analyze movement patterns
    let avgVelocity = 0;
    let avgAcceleration = 0;
    let velocityVariance = 0;
    let accelerationVariance = 0;
    let movementSmoothness = 0;

    if (movementSampleSize > 0) {
      const velocities = this.movements.map(m => m.velocity);
      const accelerations = this.movements.map(m => m.acceleration);

      avgVelocity = this.average(velocities);
      avgAcceleration = this.average(accelerations);
      velocityVariance = this.variance(velocities, avgVelocity);
      accelerationVariance = this.variance(accelerations, avgAcceleration);

      // Calculate smoothness (inverse of jitter)
      movementSmoothness = this.calculateSmoothness();
    }

    // Analyze click patterns
    let avgClickDuration = 0;
    let clickFrequency = 0;

    if (clickSampleSize > 0) {
      const clickDurations = this.clicks.map(c => c.duration);
      avgClickDuration = this.average(clickDurations);

      // Calculate click frequency (clicks per second)
      if (clickSampleSize > 1) {
        const totalTime = (this.clicks[clickSampleSize - 1].timestamp - this.clicks[0].timestamp) / 1000;
        clickFrequency = totalTime > 0 ? clickSampleSize / totalTime : 0;
      }
    }

    // Generate pattern signature
    const pattern = this.generatePatternSignature(
      avgVelocity,
      avgAcceleration,
      velocityVariance,
      movementSmoothness
    );

    return {
      avgVelocity: parseFloat(avgVelocity.toFixed(4)),
      avgAcceleration: parseFloat(avgAcceleration.toFixed(4)),
      velocityVariance: parseFloat(velocityVariance.toFixed(4)),
      accelerationVariance: parseFloat(accelerationVariance.toFixed(4)),
      avgClickDuration: parseFloat(avgClickDuration.toFixed(2)),
      clickFrequency: parseFloat(clickFrequency.toFixed(2)),
      movementSmoothness: parseFloat(movementSmoothness.toFixed(4)),
      sampleSize: movementSampleSize + clickSampleSize,
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

  private calculateSmoothness(): number {
    if (this.movements.length < 3) return 0;

    // Calculate smoothness as inverse of direction change frequency
    let directionChanges = 0;
    for (let i = 2; i < this.movements.length; i++) {
      const v1x = this.movements[i-1].x - this.movements[i-2].x;
      const v1y = this.movements[i-1].y - this.movements[i-2].y;
      const v2x = this.movements[i].x - this.movements[i-1].x;
      const v2y = this.movements[i].y - this.movements[i-1].y;

      // Calculate angle between vectors
      const dotProduct = v1x * v2x + v1y * v2y;
      const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = dotProduct / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        // Consider significant direction change if angle > 30 degrees
        if (angle > Math.PI / 6) {
          directionChanges++;
        }
      }
    }

    // Smoothness: fewer direction changes = higher smoothness
    return 1 - (directionChanges / this.movements.length);
  }

  private generatePatternSignature(
    avgVel: number,
    avgAcc: number,
    velVar: number,
    smoothness: number
  ): string {
    // Create a hash-like signature from the movement patterns
    const components = [
      Math.floor(avgVel * 1000),
      Math.floor(Math.abs(avgAcc) * 1000),
      Math.floor(velVar * 100),
      Math.floor(smoothness * 100)
    ];

    return components.map(c => c.toString(36)).join('-');
  }
}
