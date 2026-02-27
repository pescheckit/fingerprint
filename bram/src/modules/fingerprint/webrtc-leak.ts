/**
 * WebRTC IP Leak Detection Module
 *
 * EDUCATIONAL/RESEARCH PURPOSE:
 * Demonstrates how WebRTC can leak real IP addresses even through VPNs/proxies.
 * Used for security research and understanding privacy vulnerabilities.
 *
 * Entropy: ~10 bits | Stability: 85% | Hardware-based: No
 * Proxy-Resistant: YES (STUN bypasses HTTP proxies)
 */

import { ModuleInterface } from '../../types';

export class WebRTCLeakModule implements ModuleInterface {
  name = 'webrtc-leak';
  entropy = 10;
  stability = 85;
  hardwareBased = false;

  isAvailable(): boolean {
    return typeof RTCPeerConnection !== 'undefined' ||
           typeof (window as any).webkitRTCPeerConnection !== 'undefined';
  }

  async collect(): Promise<any> {
    const RTCPc = (window as any).RTCPeerConnection ||
                  (window as any).webkitRTCPeerConnection ||
                  (window as any).mozRTCPeerConnection;

    if (!RTCPc) return null;

    const pc = new RTCPc({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    const ips = new Set<string>();
    const ipv6s = new Set<string>();
    const localIPs = new Set<string>();

    return new Promise((resolve) => {
      let resolved = false;

      const resolveResult = () => {
        if (resolved) return;
        resolved = true;

        pc.close();

        const allIPs = Array.from(ips);
        const allIPv6 = Array.from(ipv6s);
        const allLocal = Array.from(localIPs);

        resolve({
          publicIPs: allIPs,
          ipv6Addresses: allIPv6,
          localIPs: allLocal,
          totalIPs: allIPs.length + allIPv6.length + allLocal.length,
          hasMultipleIPs: (allIPs.length + allIPv6.length + allLocal.length) > 1,
          signature: this.hashIPs(allIPs, allIPv6, allLocal),

          // Educational: Explain what was found
          explanation: this.explainFindings(allIPs, allIPv6, allLocal)
        });
      };

      pc.onicecandidate = (event: any) => {
        if (!event.candidate) {
          resolveResult();
          return;
        }

        const candidate = event.candidate.candidate;

        // Extract IPv4
        const ipv4Match = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (ipv4Match) {
          const ip = ipv4Match[0];
          if (this.isLocalIP(ip)) {
            localIPs.add(ip);
          } else {
            ips.add(ip);
          }
        }

        // Extract IPv6
        const ipv6Match = candidate.match(/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})/);
        if (ipv6Match) {
          ipv6s.add(ipv6Match[0]);
        }
      };

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      // Timeout after 3 seconds
      setTimeout(() => resolveResult(), 3000);
    });
  }

  private isLocalIP(ip: string): boolean {
    return ip.startsWith('192.168.') ||
           ip.startsWith('10.') ||
           ip.startsWith('172.16.') ||
           ip.startsWith('172.17.') ||
           ip.startsWith('172.18.') ||
           ip.startsWith('172.19.') ||
           ip.startsWith('172.2') ||
           ip.startsWith('172.30.') ||
           ip.startsWith('172.31.') ||
           ip.startsWith('127.') ||
           ip.startsWith('169.254.');
  }

  private hashIPs(ips: string[], ipv6s: string[], localIPs: string[]): string {
    const combined = [...ips, ...ipv6s, ...localIPs].sort().join('|');
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private explainFindings(ips: string[], ipv6s: string[], localIPs: string[]): string {
    if (ips.length === 0 && ipv6s.length === 0 && localIPs.length === 0) {
      return 'WebRTC blocked or no IP candidates found';
    }

    const parts: string[] = [];

    if (localIPs.length > 0) {
      parts.push(`${localIPs.length} local IP(s): ${localIPs.join(', ')}`);
    }

    if (ips.length > 0) {
      parts.push(`${ips.length} public IP(s): ${ips.join(', ')}`);
    }

    if (ipv6s.length > 0) {
      parts.push(`${ipv6s.length} IPv6 address(es)`);
    }

    if (ips.length > 1) {
      parts.push('Multiple IPs may indicate VPN leak or dual-stack network');
    }

    return parts.join('. ');
  }
}
