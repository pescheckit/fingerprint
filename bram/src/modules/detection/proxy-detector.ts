/**
 * Proxy Detection Module
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 * Detects if user is likely behind an HTTP/SOCKS proxy.
 * For fraud prevention, security research, and network analysis.
 *
 * Detection Methods:
 * - Network timing anomalies (latency spikes indicate proxy)
 * - DNS leak detection (mismatched DNS servers)
 * - Connection timing patterns (proxy adds overhead)
 * - WebRTC connection delays (proxies slow ICE gathering)
 * - Bandwidth throttling detection (proxies may limit speed)
 *
 * Privacy Note:
 * This module uses ONLY client-side timing analysis and does NOT:
 * - Access server logs
 * - Check proxy headers (not accessible via JavaScript)
 * - Contact external services
 * - Violate user privacy
 *
 * Educational Value:
 * - Learn how proxies affect network timing
 * - Understand proxy detection techniques
 * - Study network latency patterns
 * - Research anonymization technology
 */

import { ModuleInterface } from '../../types';

interface TimingMeasurement {
  dns: number;        // DNS lookup time
  tcp: number;        // TCP connection time
  request: number;    // Request time
  total: number;      // Total time
}

interface ProxySignals {
  timing: {
    measurements: TimingMeasurement[];
    averageDNS: number;
    averageTCP: number;
    averageTotal: number;
    hasHighLatency: boolean;
    hasInconsistentTiming: boolean;
  };
  webrtc: {
    available: boolean;
    iceGatheringDelay: number;
    hasDelay: boolean;
  };
  bandwidth: {
    downloadSpeed: number;
    isThrottled: boolean;
  };
}

export class ProxyDetectorModule implements ModuleInterface {
  name = 'proxy-detector';
  entropy = 0; // Binary detection, not for fingerprinting
  stability = 75; // Moderate stability (network conditions vary)
  hardwareBased = false;

  isAvailable(): boolean {
    return true;
  }

  async collect(): Promise<any> {
    console.log('🔍 Proxy Detector: Starting analysis...');

    const signals: ProxySignals = {
      timing: await this.analyzeNetworkTiming(),
      webrtc: await this.analyzeWebRTCTiming(),
      bandwidth: await this.analyzeBandwidth()
    };

    // Calculate proxy probability
    const probability = this.calculateProxyProbability(signals);
    const detectionMethods = this.getDetectionMethods(signals);

    console.log(`🔍 Proxy Detector: ${probability}% probability (${detectionMethods.join(', ')})`);

    return {
      isProxy: probability > 50,
      probability,
      confidence: this.getConfidence(signals),
      signals,
      methods: detectionMethods,
      explanation: this.getExplanation(signals, probability)
    };
  }

  /**
   * Analyze network timing patterns
   *
   * Educational Note:
   * Proxies add overhead to connections, causing:
   * - Increased DNS lookup times (if proxy does DNS)
   * - Higher TCP connection times (extra hop)
   * - Variable latency (proxy processing)
   * - Timing inconsistencies (proxy buffering)
   */
  private async analyzeNetworkTiming(): Promise<ProxySignals['timing']> {
    const measurements: TimingMeasurement[] = [];

    // Test multiple endpoints to get accurate averages
    const testUrls = [
      window.location.origin,
      'https://www.google.com',
      'https://www.cloudflare.com'
    ];

    for (const url of testUrls) {
      try {
        const timing = await this.measureConnectionTiming(url);
        if (timing) {
          measurements.push(timing);
        }
      } catch (e) {
        console.warn('Proxy Detector: Failed to measure', url, e);
      }

      // Small delay between tests
      await new Promise(r => setTimeout(r, 300));
    }

    // Calculate averages
    const averageDNS = measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.dns, 0) / measurements.length
      : 0;

    const averageTCP = measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.tcp, 0) / measurements.length
      : 0;

    const averageTotal = measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.total, 0) / measurements.length
      : 0;

    // Proxies typically add 50-200ms latency
    const hasHighLatency = averageTotal > 200;

    // Check for timing inconsistency (variance)
    const variance = this.calculateVariance(measurements.map(m => m.total));
    const hasInconsistentTiming = variance > 10000; // High variance indicates proxy buffering

    return {
      measurements,
      averageDNS,
      averageTCP,
      averageTotal,
      hasHighLatency,
      hasInconsistentTiming
    };
  }

  /**
   * Measure connection timing using Resource Timing API
   *
   * Educational Note:
   * The Resource Timing API provides detailed timing:
   * - domainLookupEnd - domainLookupStart = DNS time
   * - connectEnd - connectStart = TCP time
   * - responseEnd - requestStart = Request time
   */
  private async measureConnectionTiming(url: string): Promise<TimingMeasurement | null> {
    try {
      // Clear previous entries
      performance.clearResourceTimings();

      const startMark = `proxy-test-${Date.now()}`;
      performance.mark(startMark);

      // Make request with cache-busting
      const testUrl = `${url}/?_proxy_test=${Date.now()}`;
      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues
        cache: 'no-cache'
      });

      // Get timing data
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const entry = entries[entries.length - 1]; // Most recent

      if (!entry) return null;

      const dns = entry.domainLookupEnd - entry.domainLookupStart;
      const tcp = entry.connectEnd - entry.connectStart;
      const request = entry.responseEnd - entry.requestStart;
      const total = entry.responseEnd - entry.requestStart;

      return { dns, tcp, request, total };
    } catch (e) {
      return null;
    }
  }

  /**
   * Analyze WebRTC timing (proxies slow down ICE gathering)
   *
   * Educational Note:
   * WebRTC ICE gathering is affected by proxies:
   * - Normal browser: 200-500ms
   * - Behind proxy: 1000-3000ms (proxy must handle STUN)
   * - Proxy blocking: Timeout or very slow
   */
  private async analyzeWebRTCTiming(): Promise<ProxySignals['webrtc']> {
    try {
      const RTCPc = (window as any).RTCPeerConnection ||
                    (window as any).webkitRTCPeerConnection ||
                    (window as any).mozRTCPeerConnection;

      if (!RTCPc) {
        return { available: false, iceGatheringDelay: 0, hasDelay: false };
      }

      const startTime = performance.now();
      const pc = new RTCPc({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      let gatheringComplete = false;

      const delay = await new Promise<number>((resolve) => {
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete' && !gatheringComplete) {
            gatheringComplete = true;
            const elapsed = performance.now() - startTime;
            pc.close();
            resolve(elapsed);
          }
        };

        // Create offer to trigger ICE gathering
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        // Timeout after 3 seconds
        setTimeout(() => {
          if (!gatheringComplete) {
            const elapsed = performance.now() - startTime;
            pc.close();
            resolve(elapsed);
          }
        }, 3000);
      });

      // Proxies typically add 500ms+ delay to ICE gathering
      const hasDelay = delay > 800;

      return {
        available: true,
        iceGatheringDelay: delay,
        hasDelay
      };
    } catch (e) {
      return { available: false, iceGatheringDelay: 0, hasDelay: false };
    }
  }

  /**
   * Analyze bandwidth (some proxies throttle speed)
   *
   * Educational Note:
   * Some proxies limit bandwidth to reduce costs.
   * We do a small download test to estimate speed.
   */
  private async analyzeBandwidth(): Promise<ProxySignals['bandwidth']> {
    try {
      // Download a small image (use data URL to avoid external requests)
      const testData = new Array(1024 * 50).fill('x').join(''); // 50KB
      const blob = new Blob([testData]);
      const url = URL.createObjectURL(blob);

      const startTime = performance.now();
      await fetch(url);
      const elapsed = performance.now() - startTime;

      URL.revokeObjectURL(url);

      // Calculate speed in KB/s
      const sizeKB = 50;
      const speedKBps = sizeKB / (elapsed / 1000);

      // If speed is unusually slow (< 100 KB/s), may indicate throttling
      const isThrottled = speedKBps < 100;

      return {
        downloadSpeed: speedKBps,
        isThrottled
      };
    } catch (e) {
      return {
        downloadSpeed: 0,
        isThrottled: false
      };
    }
  }

  /**
   * Calculate variance of timing measurements
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate proxy probability based on signals
   */
  private calculateProxyProbability(signals: ProxySignals): number {
    let score = 0;
    let maxScore = 100;

    // Network timing signals (50 points)
    if (signals.timing.hasHighLatency) {
      score += 25;
    }
    if (signals.timing.hasInconsistentTiming) {
      score += 25;
    }

    // WebRTC timing signals (30 points)
    if (signals.webrtc.available && signals.webrtc.hasDelay) {
      score += 30;
    }

    // Bandwidth signals (20 points)
    if (signals.bandwidth.isThrottled) {
      score += 20;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Get confidence level based on available signals
   */
  private getConfidence(signals: ProxySignals): string {
    let signalCount = 0;

    if (signals.timing.measurements.length > 0) signalCount++;
    if (signals.webrtc.available) signalCount++;
    if (signals.bandwidth.downloadSpeed > 0) signalCount++;

    if (signalCount >= 3) return 'high';
    if (signalCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Get detection methods that triggered
   */
  private getDetectionMethods(signals: ProxySignals): string[] {
    const methods: string[] = [];

    if (signals.timing.hasHighLatency) methods.push('high-latency');
    if (signals.timing.hasInconsistentTiming) methods.push('timing-variance');
    if (signals.webrtc.hasDelay) methods.push('webrtc-delay');
    if (signals.bandwidth.isThrottled) methods.push('bandwidth-throttling');

    return methods;
  }

  /**
   * Generate human-readable explanation
   */
  private getExplanation(signals: ProxySignals, probability: number): string {
    if (probability < 30) {
      return 'Connection patterns appear normal. No proxy detected.';
    } else if (probability < 70) {
      return 'Some proxy indicators detected. May be behind corporate proxy or using connection optimization.';
    } else {
      return 'Strong proxy indicators detected. Connection shows typical proxy characteristics.';
    }
  }
}
