export function getWebRTCIPs() {
  return new Promise((resolve) => {
    try {
      if (!window.RTCPeerConnection) return resolve({ supported: false });

      const ips = new Set();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('');

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          resolve({ supported: true, ips: [...ips] });
          return;
        }
        const candidateStr = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const match = ipRegex.exec(candidateStr);
        if (match) ips.add(match[1]);
      };

      pc.createOffer().then((offer) => pc.setLocalDescription(offer));

      setTimeout(() => {
        pc.close();
        resolve({ supported: true, ips: [...ips] });
      }, 3000);
    } catch (e) {
      resolve({ supported: false, error: e.message });
    }
  });
}
