/**
 * Detection Modules
 *
 * These modules detect special browser environments and anonymization tools.
 *
 * Key capabilities:
 * - Tor Browser detection (client-side and server-side)
 * - VPN/Proxy detection (server-side)
 * - Bot detection
 * - Anonymization tool identification
 */

export { TorDetectionModule } from './tor-detection';
// Server-side module excluded from browser build (uses Node.js APIs)
// export { ServerTorDetectionModule, createTorDetectionMiddleware } from './tor-detection-server';
