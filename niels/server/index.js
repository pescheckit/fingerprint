import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { Store } from './store.js';
import { findBestMatch, findBestCrossDeviceMatch } from './matching.js';

const app = express();
const store = new Store();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

app.set('trust proxy', true);

app.use(cors({
  origin: ['https://fingerprint-3y6.pages.dev', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
  exposedHeaders: ['ETag'],
}));

app.use(express.json({ limit: '50kb' }));

// Rate limiting: per-IP, sliding window
const rateLimits = new Map();
const RATE_LIMIT = 120;     // requests
const RATE_WINDOW = 60_000; // per minute

function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }

  const timestamps = rateLimits.get(ip).filter(t => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests, try again later' });
  }

  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  next();
}

app.use('/api', rateLimit);

// --- Routes ---

// POST /api/fingerprint — receive fingerprint, store, match
app.post('/api/fingerprint', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ipSubnet = ip.split('.').slice(0, 3).join('.');

    // Compute household ID
    const householdId = crypto.createHash('sha256')
      .update(`${ipSubnet}|${data.timezone || ''}|${data.languages || ''}`)
      .digest('hex');

    const signals = {
      ...data,
      ip,
      ipSubnet,
      householdId,
      localSubnet: data.localSubnet || null,
      batteryLevel: data.batteryLevel ?? null,
      batteryCharging: data.batteryCharging ?? null,
      loginBitmask: data.loginBitmask || null,
      lanTopology: data.lanTopology || null,
    };

    // Find matches using indexed candidate search
    const profiles = store.findMatches(signals);
    let match = findBestMatch(signals, profiles);

    let matchType = null;
    if (match) {
      matchType = 'same-device';
    } else {
      // Try cross-device match within same household
      const householdMembers = store.findHouseholdMembers(householdId);
      const crossMatch = findBestCrossDeviceMatch(signals, householdMembers);
      if (crossMatch) {
        match = crossMatch;
        matchType = 'cross-device';
      }
    }

    // Store the profile
    const visitorId = match ? match.visitorId : (data.visitorId || crypto.randomUUID());
    store.saveProfile({
      ...signals,
      visitor_id: visitorId,
      household_id: householdId,
      local_ip_subnet: signals.localSubnet,
      battery_level: signals.batteryLevel,
      battery_charging: signals.batteryCharging,
      login_bitmask: signals.loginBitmask,
      lan_topology: signals.lanTopology,
    });

    // Upsert household and update last active timestamp
    store.upsertHousehold(householdId);
    store.updateLastActive(visitorId);

    res.json({
      matchedVisitorId: match ? match.visitorId : null,
      confidence: match ? match.confidence : 0,
      matchedSignals: match ? match.matchedSignals : [],
      matchType,
      visitorId,
    });
  } catch (err) {
    console.error('POST /api/fingerprint error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fingerprint/mouse — update mouse input data for a visitor
app.post('/api/fingerprint/mouse', (req, res) => {
  try {
    const { visitorId, ...mouseData } = req.body;
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    store.updateMouse(visitorId, mouseData);
    res.json({ updated: true });
  } catch (err) {
    console.error('POST /api/fingerprint/mouse error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/etag-store — ETag-based visitor ID persistence
app.get('/api/etag-store', (req, res) => {
  try {
    const etag = req.headers['if-none-match'];
    if (etag) {
      const visitorId = store.getEtag(etag);
      if (visitorId) {
        res.set('ETag', etag);
        return res.json({ visitorId });
      }
    }
    res.status(204).end();
  } catch (err) {
    console.error('GET /api/etag-store error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/etag-store — store visitor ID for ETag persistence
app.post('/api/etag-store', (req, res) => {
  try {
    const { visitorId } = req.body;
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    const etag = `"${visitorId}"`;
    store.setEtag(etag, visitorId);
    res.set('ETag', etag);
    res.json({ stored: true, etag });
  } catch (err) {
    console.error('POST /api/etag-store error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dns-probes — generate DNS probe hostnames for recent visitors
app.get('/api/dns-probes', (req, res) => {
  try {
    const recentProfiles = store.findRecentProfiles(30);
    const probes = recentProfiles
      .map(p => p.visitor_id.slice(0, 8) + '.fp.bingo-barry.nl')
      .slice(0, 10);
    res.json({ probes });
  } catch (err) {
    console.error('GET /api/dns-probes error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ultrasonic/pair — emitter requests a pairing code
app.post('/api/ultrasonic/pair', (req, res) => {
  try {
    const { visitorId } = req.body;
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    // Generate random 16-bit pairing code (0-65535)
    const pairingCode = Math.floor(Math.random() * 65536);
    store.createUltrasonicSession(pairingCode, visitorId);

    res.json({ pairingCode });
  } catch (err) {
    console.error('POST /api/ultrasonic/pair error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ultrasonic/confirm — receiver reports detected pairing code
app.post('/api/ultrasonic/confirm', (req, res) => {
  try {
    const { visitorId, pairingCode } = req.body;
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ error: 'visitorId is required' });
    }
    if (pairingCode == null || typeof pairingCode !== 'number') {
      return res.status(400).json({ error: 'pairingCode is required' });
    }

    const session = store.findUltrasonicSession(pairingCode);
    if (!session) {
      return res.json({ matched: false, reason: 'No active session for this pairing code' });
    }

    // Link the two visitor IDs — receiver adopts emitter's visitor ID
    const emitterVisitorId = session.visitor_id;

    res.json({
      matched: true,
      emitterVisitorId,
      receiverVisitorId: visitorId,
      linkedVisitorId: emitterVisitorId,
    });
  } catch (err) {
    console.error('POST /api/ultrasonic/confirm error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats — basic health check
app.get('/api/stats', (req, res) => {
  try {
    const stats = store.getStats();
    res.json({ status: 'ok', ...stats, uptime: process.uptime() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Maintenance ---

// Prune old/duplicate profiles every 6 hours
setInterval(() => {
  try {
    const result = store.prune();
    store.pruneUltrasonicSessions();
    if (result.duplicatesRemoved + result.staleRemoved + result.etagsRemoved > 0) {
      console.log('Pruned:', result);
    }
  } catch (err) {
    console.error('Prune error:', err.message);
  }
}, 6 * 60 * 60 * 1000);

// Clean up rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimits) {
    const active = timestamps.filter(t => now - t < RATE_WINDOW);
    if (active.length === 0) {
      rateLimits.delete(ip);
    } else {
      rateLimits.set(ip, active);
    }
  }
}, 5 * 60 * 1000);

// --- Start ---

app.listen(PORT, () => {
  console.log(`Fingerprint server running on port ${PORT}`);
  // Run initial prune on startup
  try {
    const result = store.prune();
    console.log('Startup prune:', result);
  } catch (err) {
    console.error('Startup prune error:', err.message);
  }
});
