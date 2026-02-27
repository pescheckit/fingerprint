export class FingerprintClient {
  constructor(serverEndpoint) {
    this.endpoint = serverEndpoint.replace(/\/$/, ''); // trim trailing slash
  }

  async submit(result) {
    // Extract signals from collector results
    const signals = this._extractSignals(result);

    const response = await fetch(`${this.endpoint}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signals),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return response.json();
  }

  _extractSignals(result) {
    const data = {
      fingerprint: result.fingerprint,
      deviceId: result.deviceId,
      visitorId: result.visitorId,
    };

    // Extract individual signal data
    for (const signal of result.signals) {
      if (signal.name === 'audio' && signal.data) {
        data.audioSum = signal.data.sampleSum;
      }
      if (signal.name === 'timezone' && signal.data) {
        data.timezone = signal.data.timezone;
        data.timezoneOffset = signal.data.timezoneOffset;
      }
      if (signal.name === 'navigator' && signal.data) {
        data.languages = JSON.stringify(signal.data.languages);
        data.hardwareConcurrency = signal.data.hardwareConcurrency;
        data.deviceMemory = signal.data.deviceMemory;
        data.platform = signal.data.platform;
      }
      if (signal.name === 'screen' && signal.data) {
        data.screenWidth = signal.data.width;
        data.screenHeight = signal.data.height;
        data.colorDepth = signal.data.colorDepth;
        data.touchSupport = signal.data.touchSupport ? 1 : 0;
      }
      if (signal.name === 'webrtc' && signal.data) {
        data.localSubnet = signal.data.localSubnet;
      }
      if (signal.name === 'battery' && signal.data) {
        data.batteryLevel = signal.data.level;
        data.batteryCharging = signal.data.charging ? 1 : 0;
      }
      if (signal.name === 'dns-probe' && signal.data) {
        data.dnsProbes = signal.data.probes;
      }
    }

    return data;
  }

  async resolveEtag() {
    const response = await fetch(`${this.endpoint}/api/etag-store`, {
      headers: { 'If-None-Match': localStorage.getItem('_fp_etag') || '' },
    });

    if (response.ok) {
      const { visitorId } = await response.json();
      const etag = response.headers.get('ETag');
      if (etag) localStorage.setItem('_fp_etag', etag);
      return visitorId;
    }
    return null;
  }

  async fetchDnsProbes() {
    const response = await fetch(`${this.endpoint}/api/dns-probes`);
    if (!response.ok) return [];
    const { probes } = await response.json();
    return probes || [];
  }

  async storeEtag(visitorId) {
    const response = await fetch(`${this.endpoint}/api/etag-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
    });

    if (response.ok) {
      const { etag } = await response.json();
      if (etag) localStorage.setItem('_fp_etag', etag);
      return true;
    }
    return false;
  }
}
