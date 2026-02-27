import { Collector } from '../../collector.js';

const LAN_TARGETS = [
  // Common gateways
  { ip: '192.168.1.1', port: 80 },
  { ip: '192.168.0.1', port: 80 },
  { ip: '10.0.0.1',    port: 80 },
  { ip: '10.0.1.1',    port: 80 },
  { ip: '192.168.1.254', port: 80 },
  { ip: '192.168.0.254', port: 80 },
  { ip: '172.16.0.1',  port: 80 },
  // Alt ports on common gateways
  { ip: '192.168.1.1', port: 8080 },
  { ip: '192.168.0.1', port: 8080 },
  { ip: '10.0.0.1',    port: 8080 },
  // Chromecast
  { ip: '192.168.1.100', port: 8008 },
  { ip: '192.168.0.100', port: 8008 },
  { ip: '192.168.1.50',  port: 8008 },
  // Sonos
  { ip: '192.168.1.101', port: 1400 },
  { ip: '192.168.0.101', port: 1400 },
  // Printers (IPP)
  { ip: '192.168.1.200', port: 631 },
  { ip: '192.168.0.200', port: 631 },
  // NAS / media servers
  { ip: '192.168.1.10', port: 80 },
  { ip: '192.168.1.2',  port: 80 },
  { ip: '192.168.0.2',  port: 80 },
];

const BATCH_SIZE = 6;

export class LanTopologyCollector extends Collector {
  constructor() {
    super('lanTopology', 'LAN device topology fingerprint', []);
  }

  async collect() {
    if (typeof document === 'undefined') {
      return { probes: [], topologyBitmask: '0'.repeat(LAN_TARGETS.length), responsiveCount: 0 };
    }

    const probes = [];

    // Run in batches to avoid overwhelming the network
    for (let i = 0; i < LAN_TARGETS.length; i += BATCH_SIZE) {
      const batch = LAN_TARGETS.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(target => this._probeTarget(target.ip, target.port))
      );
      results.forEach((result, idx) => {
        probes.push({
          target: `${batch[idx].ip}:${batch[idx].port}`,
          ...result,
        });
      });
    }

    let bitmask = '';
    let responsiveCount = 0;
    for (const probe of probes) {
      const isResponsive = probe.status === 'responsive';
      bitmask += isResponsive ? '1' : '0';
      if (isResponsive) responsiveCount++;
    }

    return { probes, topologyBitmask: bitmask, responsiveCount };
  }

  _probeTarget(ip, port, timeout = 1500) {
    return new Promise(resolve => {
      const img = new Image();
      const start = performance.now();
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          img.src = '';
          resolve({ status: 'timeout', timing: timeout });
        }
      }, timeout);

      const onResponse = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const timing = Math.round(performance.now() - start);
          // Any response faster than timeout means device is present
          // (either loaded, or connection refused/reset which fires onerror quickly)
          resolve({ status: timing < 100 ? 'responsive' : 'slow', timing });
        }
      };

      img.onload = onResponse;
      img.onerror = onResponse;

      img.src = `http://${ip}:${port}/favicon.ico?_=${Date.now()}`;
    });
  }
}
