/**
 * Media Devices API Module
 * SCHOOL RESEARCH - Camera/Microphone enumeration
 * Entropy: ~5 bits | Stability: 85% | Hardware-based: Yes
 */

import { ModuleInterface } from '../../types';

export class MediaDevicesModule implements ModuleInterface {
  name = 'media-devices';
  entropy = 5;
  stability = 85;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' &&
           typeof navigator.mediaDevices !== 'undefined' &&
           typeof navigator.mediaDevices.enumerateDevices === 'function';
  }

  async collect(): Promise<any> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const counts = {
        videoinput: 0,
        audioinput: 0,
        audiooutput: 0
      };

      const kinds: string[] = [];

      devices.forEach(device => {
        if (device.kind in counts) {
          (counts as any)[device.kind]++;
        }
        kinds.push(device.kind);
      });

      return {
        counts,
        total: devices.length,
        kinds,
        signature: `${counts.videoinput}-${counts.audioinput}-${counts.audiooutput}`,
        research: {
          note: 'Device labels hidden without permission for privacy',
          entropy: 'Device count combinations provide ~5 bits'
        }
      };
    } catch (e) {
      return { error: 'Permission denied or not available' };
    }
  }
}
