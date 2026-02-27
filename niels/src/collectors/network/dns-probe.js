import { Collector } from '../../collector.js';

export class DnsProbeCollector extends Collector {
  constructor() {
    super('dns-probe', 'DNS cache timing probe', []);
    this._probes = [];
  }

  setProbes(hostnames) {
    this._probes = hostnames || [];
  }

  async collect() {
    if (this._probes.length === 0) {
      return { supported: true, probes: [] };
    }

    const results = [];
    for (const hostname of this._probes) {
      try {
        const start = performance.now();
        await fetch(`https://${hostname}/pixel.gif`, {
          mode: 'no-cors',
          cache: 'no-store',
        });
        const responseTime = performance.now() - start;
        results.push({
          hostname,
          responseTime: Math.round(responseTime * 100) / 100,
          cached: responseTime < 5,
        });
      } catch {
        results.push({
          hostname,
          responseTime: -1,
          cached: false,
        });
      }
    }

    return { supported: true, probes: results };
  }
}
