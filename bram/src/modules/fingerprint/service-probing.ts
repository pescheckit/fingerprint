/**
 * Service Login Probing Module
 *
 * SCHOOL RESEARCH - Educational demonstration of login detection
 * Uses image timing to detect which services user is logged into
 *
 * Entropy: ~8 bits | Stability: 60% (session-dependent) | Hardware-based: No
 * Use: Browser UUID only (session-specific!)
 */

import { ModuleInterface } from '../../types';

interface ServiceProbe {
  name: string;
  url: string;
  category: string;
}

export class ServiceProbingModule implements ModuleInterface {
  name = 'service-probing';
  entropy = 8;
  stability = 60; // Session-dependent
  hardwareBased = false;

  private services: ServiceProbe[] = [
    // Social Media
    { name: 'Facebook', url: 'https://www.facebook.com/favicon.ico', category: 'social' },
    { name: 'Twitter', url: 'https://twitter.com/favicon.ico', category: 'social' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/favicon.ico', category: 'social' },
    { name: 'Instagram', url: 'https://www.instagram.com/favicon.ico', category: 'social' },

    // Development
    { name: 'GitHub', url: 'https://github.com/favicon.ico', category: 'dev' },
    { name: 'GitLab', url: 'https://gitlab.com/favicon.ico', category: 'dev' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com/favicon.ico', category: 'dev' },

    // Google Services
    { name: 'Google', url: 'https://www.google.com/favicon.ico', category: 'google' },
    { name: 'Gmail', url: 'https://mail.google.com/favicon.ico', category: 'google' },
    { name: 'YouTube', url: 'https://www.youtube.com/favicon.ico', category: 'google' },

    // Other
    { name: 'Reddit', url: 'https://www.reddit.com/favicon.ico', category: 'social' },
    { name: 'Dropbox', url: 'https://www.dropbox.com/favicon.ico', category: 'productivity' }
  ];

  isAvailable(): boolean {
    return typeof Image !== 'undefined';
  }

  async collect(): Promise<any> {
    const results: Record<string, any> = {};
    const detected: string[] = [];
    const timings: Record<string, number> = {};

    for (const service of this.services) {
      const result = await this.probeService(service.url);

      results[service.name] = result;

      if (result.accessible) {
        detected.push(service.name);
        timings[service.name] = result.loadTime;
      }
    }

    return {
      detected,
      detectedCount: detected.length,
      byCategory: this.categorize(detected),
      timings,
      signature: this.generateSignature(detected),

      // Educational note
      research: {
        technique: 'Image probe timing to detect logged-in services',
        privacy: 'Can reveal which services user actively uses',
        entropy: 'Each unique login combination adds ~2-3 bits',
        mitigation: 'Use cookie isolation or private browsing'
      }
    };
  }

  private probeService(url: string): Promise<{ accessible: boolean; loadTime: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const startTime = performance.now();
      let resolved = false;

      const resolveResult = (accessible: boolean) => {
        if (resolved) return;
        resolved = true;

        const loadTime = performance.now() - startTime;
        resolve({ accessible, loadTime });
      };

      img.onload = () => resolveResult(true);
      img.onerror = () => resolveResult(false);

      // Timeout after 3 seconds
      setTimeout(() => resolveResult(false), 3000);

      img.src = url;
    });
  }

  private categorize(detected: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {};

    for (const serviceName of detected) {
      const service = this.services.find(s => s.name === serviceName);
      if (service) {
        if (!categories[service.category]) {
          categories[service.category] = [];
        }
        categories[service.category].push(serviceName);
      }
    }

    return categories;
  }

  private generateSignature(detected: string[]): string {
    if (detected.length === 0) return 'none';

    const sorted = detected.sort();
    let hash = 0;
    const str = sorted.join('|');

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
