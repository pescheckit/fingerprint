/**
 * Server-Side Tor Detection Module
 * Detects Tor exit nodes and suspicious connections
 * Requires Node.js environment
 */

import * as dns from 'dns';
import { promisify } from 'util';

interface ServerTorDetectionResult {
  isTorExitNode: boolean;
  confidence: number;
  method: 'exit-list' | 'dns' | 'geoip' | 'combined';
  details: {
    exitListCheck: boolean;
    dnsCheck: boolean;
    geoipMismatch?: boolean;
  };
}

interface IPGeoLocation {
  country: string;
  city?: string;
  isp?: string;
}

export class ServerTorDetectionModule {
  private torExitNodeCache: Map<string, boolean> = new Map();
  private cacheTTL = 3600000;  // 1 hour
  private lastUpdate = 0;
  private dnsLookup = promisify(dns.lookup);

  // Cached Tor exit node list
  private torExitNodes: Set<string> = new Set();

  constructor() {
    this.updateTorExitNodeList();
  }

  /**
   * Primary detection method - check if IP is Tor exit node
   */
  async detectTorExitNode(clientIP: string): Promise<ServerTorDetectionResult> {
    // Check cache first
    if (this.torExitNodeCache.has(clientIP)) {
      return {
        isTorExitNode: this.torExitNodeCache.get(clientIP)!,
        confidence: 95,
        method: 'exit-list',
        details: {
          exitListCheck: true,
          dnsCheck: false
        }
      };
    }

    const details = {
      exitListCheck: false,
      dnsCheck: false,
      geoipMismatch: false
    };

    // Method 1: Check against exit node list
    let isTorExit = this.checkAgainstExitList(clientIP);
    if (isTorExit) {
      details.exitListCheck = true;
      this.torExitNodeCache.set(clientIP, true);
      return {
        isTorExitNode: true,
        confidence: 98,
        method: 'exit-list',
        details
      };
    }

    // Method 2: DNS-based check
    const dnsResult = await this.checkDNSBasedTor(clientIP);
    if (dnsResult) {
      details.dnsCheck = true;
      this.torExitNodeCache.set(clientIP, true);
      return {
        isTorExitNode: true,
        confidence: 99,
        method: 'dns',
        details
      };
    }

    this.torExitNodeCache.set(clientIP, false);
    return {
      isTorExitNode: false,
      confidence: 0,
      method: 'combined',
      details
    };
  }

  /**
   * Detect Tor using multiple signals: IP, User-Agent, and Geolocation
   */
  async compositeDetectTor(
    clientIP: string,
    userAgent: string,
    geoLocation?: IPGeoLocation,
    acceptLanguage?: string
  ): Promise<ServerTorDetectionResult & { suspiciousIndicators: string[] }> {
    const suspiciousIndicators: string[] = [];

    // Check exit node
    const exitNodeResult = await this.detectTorExitNode(clientIP);
    if (exitNodeResult.isTorExitNode) {
      suspiciousIndicators.push('tor-exit-node-detected');
    }

    // Check User-Agent consistency with actual capabilities
    const isTorUA = this.checkTorUserAgent(userAgent);
    if (isTorUA) {
      suspiciousIndicators.push('tor-user-agent-detected');
    }

    // Check geolocation/language mismatch
    if (geoLocation && acceptLanguage) {
      const geoMismatch = this.checkGeoLanguageMismatch(
        geoLocation,
        acceptLanguage
      );
      if (geoMismatch) {
        suspiciousIndicators.push('geo-language-mismatch');
      }
    }

    const confidence = Math.min(
      99,
      suspiciousIndicators.length * 30 + exitNodeResult.confidence
    );

    return {
      ...exitNodeResult,
      confidence,
      suspiciousIndicators
    };
  }

  /**
   * Check IP against cached Tor exit node list
   */
  private checkAgainstExitList(ip: string): boolean {
    return this.torExitNodes.has(ip);
  }

  /**
   * DNS-based Tor detection using dnsel.torproject.org
   * Returns 127.0.0.2 if IP is Tor exit node
   */
  private async checkDNSBasedTor(ip: string): Promise<boolean> {
    try {
      // Reverse the IP address
      const parts = ip.split('.');
      if (parts.length !== 4) return false;

      const reversedIP = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}`;
      const dnsQuery = `${reversedIP}.dnsel.torproject.org`;

      // Perform DNS lookup
      const result = await this.dnsLookup(dnsQuery);

      // If result is 127.0.0.2, it's a Tor exit node
      return result.address === '127.0.0.2';
    } catch {
      // DNS lookup failed - IP is likely not in Tor exit list
      return false;
    }
  }

  /**
   * Check if User-Agent matches Tor Browser pattern
   */
  private checkTorUserAgent(ua: string): boolean {
    // Tor Browser's standardized UA (as of 2026)
    const torUA = 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0';

    if (ua === torUA) {
      return true;
    }

    // Also check for other Tor indicators in UA
    if (ua.includes('Tor') || ua.includes('TorBrowser')) {
      return true;
    }

    return false;
  }

  /**
   * Check for geolocation and language mismatches
   * E.g., IP from China but Accept-Language: en-US
   */
  private checkGeoLanguageMismatch(
    geoLocation: IPGeoLocation,
    acceptLanguage: string
  ): boolean {
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    const country = geoLocation.country.toUpperCase();

    // Map language to expected countries
    const languageCountries: { [key: string]: string[] } = {
      'en': ['US', 'GB', 'CA', 'AU', 'NZ'],
      'zh': ['CN', 'TW', 'HK', 'MO'],
      'ja': ['JP'],
      'ko': ['KR'],
      'ru': ['RU', 'BY', 'KZ'],
      'de': ['DE', 'AT', 'CH'],
      'fr': ['FR', 'BE', 'CA'],
      'es': ['ES', 'MX', 'AR'],
      'pt': ['PT', 'BR'],
      'it': ['IT']
    };

    const expectedCountries = languageCountries[primaryLang] || [];

    // If language doesn't match geolocation, it's suspicious
    if (primaryLang === 'en' && country !== 'US' && !expectedCountries.includes(country)) {
      return true;
    }

    return false;
  }

  /**
   * Update Tor exit node list from official sources
   */
  async updateTorExitNodeList(): Promise<void> {
    const now = Date.now();

    // Only update if cache is stale (1 hour)
    if (now - this.lastUpdate < this.cacheTTL) {
      return;
    }

    try {
      const response = await fetch('https://check.torproject.org/torbulkexitlist');
      const text = await response.text();
      const lines = text.split('\n');

      this.torExitNodes.clear();
      for (const line of lines) {
        const ip = line.trim();
        if (ip) {
          this.torExitNodes.add(ip);
        }
      }

      this.lastUpdate = now;
      console.log(`Updated Tor exit node list: ${this.torExitNodes.size} nodes`);
    } catch (error) {
      console.error('Failed to update Tor exit node list:', error);
    }
  }

  /**
   * Get exit node list size
   */
  getExitNodeCount(): number {
    return this.torExitNodes.size;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.torExitNodeCache.clear();
  }
}

// Express middleware for Tor detection
export function createTorDetectionMiddleware(torDetector: ServerTorDetectionModule) {
  return async (req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';

    try {
      const result = await torDetector.compositeDetectTor(
        clientIP,
        userAgent,
        undefined,  // Geolocation would require additional service
        acceptLanguage
      );

      // Attach result to request
      req.torDetection = result;

      // You can add custom logic here:
      if (result.isTorExitNode && result.confidence > 95) {
        // Option 1: Block
        // return res.status(403).json({ error: 'Tor access not allowed' });

        // Option 2: Flag for monitoring
        console.warn(`[TOR] Potential Tor user from ${clientIP}`);

        // Option 3: Just log
        req.torDetection.flagged = true;
      }
    } catch (error) {
      console.error('Tor detection error:', error);
      // Don't block on error, continue normally
    }

    next();
  };
}

/**
 * Example usage with Express:
 *
 * const express = require('express');
 * const app = express();
 * const torDetector = new ServerTorDetectionModule();
 *
 * app.use(createTorDetectionMiddleware(torDetector));
 *
 * app.get('/api/data', (req, res) => {
 *   if (req.torDetection?.isTorExitNode) {
 *     return res.json({
 *       warning: 'Tor detected',
 *       data: limitedData  // Serve reduced data
 *     });
 *   }
 *   res.json({ data: fullData });
 * });
 */
