/**
 * VPN Detection Module
 * Detects if user is behind a VPN
 * Methods: WebRTC leaks, timezone mismatches, IP analysis, latency patterns
 */
export default class VPNDetectorModule {
  static name = 'vpn-detector';
  static entropy = 0; // Binary detection (yes/no)
  static hardware = false;

  static isAvailable() {
    return typeof RTCPeerConnection !== 'undefined';
  }

  static async collect() {
    const signals = {};

    // 1. WebRTC IP Leak Detection
    signals.webrtcLeak = await this.detectWebRTCLeak();

    // 2. Timezone vs Expected from IP (requires server-side IP lookup)
    signals.timezoneMismatch = this.detectTimezoneMismatch();

    // 3. DNS Leak Detection (requires server-side)
    // signals.dnsLeak = await this.detectDNSLeak();

    // 4. Latency Analysis (VPNs add latency)
    signals.latency = await this.measureLatency();

    // Calculate VPN probability
    const probability = this.calculateVPNProbability(signals);

    return {
      signals,
      probability,
      likely: probability > 0.5
    };
  }

  static async detectWebRTCLeak() {
    const ips = new Set();

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('');

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const ipMatch = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(e.candidate.candidate);
        if (ipMatch) ips.add(ipMatch[0]);
      };

      await pc.createOffer().then(offer => pc.setLocalDescription(offer));

      // Wait for ICE gathering
      await new Promise(resolve => setTimeout(resolve, 2000));

      pc.close();

      return {
        ips: Array.from(ips),
        count: ips.size,
        hasMultiple: ips.size > 1
      };
    } catch (e) {
      return {
        error: e.message,
        blocked: true
      };
    }
  }

  static detectTimezoneMismatch() {
    // Get browser timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();

    // Note: Actual IP-based geolocation requires server-side lookup
    return {
      timezone,
      offset,
      // serverTimezone: null, // Would be filled by server
      // mismatch: false
    };
  }

  static async measureLatency() {
    const measurements = [];

    // Measure latency to external resource
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
        const latency = performance.now() - start;
        measurements.push(latency);
      } catch (e) {
        // Ignore errors
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;

    return {
      measurements,
      average: avg,
      suspiciouslyHigh: avg > 150 // VPNs typically add 50-150ms
    };
  }

  static calculateVPNProbability(signals) {
    let score = 0;
    let factors = 0;

    // WebRTC leak detection
    if (signals.webrtcLeak?.blocked) {
      score += 0.3; // Blocking WebRTC is suspicious
      factors++;
    } else if (signals.webrtcLeak?.hasMultiple) {
      score += 0.2; // Multiple IPs might indicate VPN
      factors++;
    }

    // High latency
    if (signals.latency?.suspiciouslyHigh) {
      score += 0.4;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }
}
