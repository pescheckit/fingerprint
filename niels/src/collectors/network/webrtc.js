import { Collector } from '../../collector.js';

export class WebRTCCollector extends Collector {
  constructor() {
    super('webrtc', 'WebRTC local IP leak', []);
  }

  async collect() {
    const RTCPc = globalThis.RTCPeerConnection || globalThis.webkitRTCPeerConnection;
    if (!RTCPc) {
      return { supported: false, localIPs: [], publicIPs: [], localSubnet: null };
    }

    const pc = new RTCPc({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    const localIPs = new Set();
    const publicIPs = new Set();

    return new Promise((resolve) => {
      let resolved = false;

      const finish = () => {
        if (resolved) return;
        resolved = true;
        pc.close();

        const locals = Array.from(localIPs);
        const publics = Array.from(publicIPs);
        const localSubnet = locals.length > 0
          ? locals[0].split('.').slice(0, 3).join('.')
          : null;

        resolve({
          supported: true,
          localIPs: locals,
          publicIPs: publics,
          localSubnet,
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          finish();
          return;
        }

        const candidate = event.candidate.candidate;
        const ipv4Match = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (ipv4Match) {
          const ip = ipv4Match[0];
          if (this._isLocalIP(ip)) {
            localIPs.add(ip);
          } else {
            publicIPs.add(ip);
          }
        }
      };

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      setTimeout(() => finish(), 3000);
    });
  }

  _isLocalIP(ip) {
    return ip.startsWith('192.168.') ||
           ip.startsWith('10.') ||
           ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
           ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
           ip.startsWith('172.2') ||
           ip.startsWith('172.30.') || ip.startsWith('172.31.') ||
           ip.startsWith('127.') ||
           ip.startsWith('169.254.');
  }
}
