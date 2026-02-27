/**
 * VPN/Proxy Detection Module
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 * Detects if user is likely behind a VPN or proxy.
 * For fraud prevention and security research.
 *
 * Methods:
 * - WebRTC IP leak detection
 * - Timezone vs browser mismatch
 * - Latency analysis
 * - Multiple IP detection
 */

import { ModuleInterface } from '../../types';

export class VPNDetectorModule implements ModuleInterface {
  name = 'vpn-detector';
  entropy = 0; // Binary detection, not for fingerprinting
  stability = 80;
  hardwareBased = false;

  isAvailable(): boolean {
    return true;
  }

  async collect(): Promise<any> {
    const signals: any = {};

    // 1. Check for WebRTC IP leaks
    signals.webrtc = await this.checkWebRTC();

    // 2. Timezone analysis
    signals.timezone = this.checkTimezone();

    // 3. Latency check
    signals.latency = await this.checkLatency();

    // Calculate VPN probability
    const probability = this.calculateVPNProbability(signals);

    return {
      isVPN: probability > 50,
      probability,
      confidence: this.getConfidence(signals),
      signals,
      methods: this.getDetectionMethods(signals)
    };
  }

  private async checkWebRTC(): Promise<any> {
    try {
      const RTCPc = (window as any).RTCPeerConnection ||
                    (window as any).webkitRTCPeerConnection;

      if (!RTCPc) {
        return { available: false, blocked: true };
      }

      const pc = new RTCPc({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      const ips = new Set<string>();

      return new Promise((resolve) => {
        let resolved = false;

        pc.onicecandidate = (e: any) => {
          if (!e.candidate) {
            if (!resolved) {
              resolved = true;
              pc.close();
              resolve({
                available: true,
                ipCount: ips.size,
                hasMultipleIPs: ips.size > 1,
                blocked: ips.size === 0
              });
            }
            return;
          }

          const ipMatch = e.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          if (ipMatch) {
            ips.add(ipMatch[0]);
          }
        };

        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            pc.close();
            resolve({
              available: true,
              ipCount: ips.size,
              hasMultipleIPs: ips.size > 1,
              blocked: ips.size === 0
            });
          }
        }, 2000);
      });
    } catch (e) {
      return { available: false, error: e.message };
    }
  }

  private checkTimezone(): any {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();

    return {
      timezone,
      offset,
      // Note: Actual geolocation check requires server-side IP lookup
      // For research: This demonstrates the concept
      suspicious: false // Would compare with IP location server-side
    };
  }

  private async checkLatency(): Promise<any> {
    const measurements: number[] = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch(window.location.origin + '/?ping=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache'
        });
        measurements.push(performance.now() - start);
      } catch (e) {
        // Ignore errors
      }
      await new Promise(r => setTimeout(r, 200));
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;

    return {
      measurements,
      average: avg,
      highLatency: avg > 150, // VPNs typically add 50-150ms
      veryHighLatency: avg > 300 // Tor or distant VPN
    };
  }

  private calculateVPNProbability(signals: any): number {
    let score = 0;
    let maxScore = 100;

    // WebRTC signals
    if (signals.webrtc?.blocked) {
      score += 30; // Blocking WebRTC is suspicious
    } else if (signals.webrtc?.hasMultipleIPs) {
      score += 20; // Multiple IPs may indicate leak
    }

    // Latency signals
    if (signals.latency?.veryHighLatency) {
      score += 40;
    } else if (signals.latency?.highLatency) {
      score += 25;
    }

    // Timezone (would need server-side for full check)
    if (signals.timezone?.suspicious) {
      score += 30;
    }

    return Math.round((score / maxScore) * 100);
  }

  private getConfidence(signals: any): string {
    const checks = Object.keys(signals).length;

    if (checks >= 3) return 'high';
    if (checks >= 2) return 'medium';
    return 'low';
  }

  private getDetectionMethods(signals: any): string[] {
    const methods: string[] = [];

    if (signals.webrtc?.blocked) methods.push('webrtc-blocked');
    if (signals.webrtc?.hasMultipleIPs) methods.push('multiple-ips');
    if (signals.latency?.highLatency) methods.push('high-latency');
    if (signals.timezone?.suspicious) methods.push('timezone-mismatch');

    return methods;
  }
}
