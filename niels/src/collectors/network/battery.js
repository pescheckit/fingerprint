import { Collector } from '../../collector.js';

export class BatteryCollector extends Collector {
  constructor() {
    super('battery', 'Battery state', []);
  }

  async collect() {
    if (!navigator.getBattery) {
      return { supported: false, charging: null, level: null, chargingTime: null, dischargingTime: null };
    }

    try {
      const battery = await navigator.getBattery();
      return {
        supported: true,
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    } catch {
      return { supported: false, charging: null, level: null, chargingTime: null, dischargingTime: null };
    }
  }
}
