import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { Store } from './store.js';
import { findBestMatch } from './matching.js';

const app = express();
const store = new Store();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);
app.use(cors({
  origin: ['https://fingerprint-3y6.pages.dev', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());

// ETag store (in-memory map for simplicity)
const etagStore = new Map();

// POST /api/fingerprint — receive fingerprint, store, match
app.post('/api/fingerprint', (req, res) => {
  const data = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ipSubnet = ip.split('.').slice(0, 3).join('.'); // /24

  const signals = {
    ...data,
    ip,
    ipSubnet,
  };

  // Find matches
  const profiles = store.findMatches();
  const match = findBestMatch(signals, profiles);

  // Store the profile
  const visitorId = match ? match.visitorId : (data.visitorId || crypto.randomUUID());
  store.saveProfile({ ...signals, visitor_id: visitorId });

  res.json({
    matchedVisitorId: match ? match.visitorId : null,
    confidence: match ? match.confidence : 0,
    matchedSignals: match ? match.matchedSignals : [],
    visitorId,
  });
});

// GET /api/etag-store — ETag-based visitor ID
app.get('/api/etag-store', (req, res) => {
  const etag = req.headers['if-none-match'];
  if (etag && etagStore.has(etag)) {
    res.set('ETag', etag);
    res.json({ visitorId: etagStore.get(etag) });
  } else {
    res.status(204).end();
  }
});

// POST /api/etag-store — store visitor ID for ETag
app.post('/api/etag-store', (req, res) => {
  const { visitorId } = req.body;
  const etag = `"${visitorId}"`;
  etagStore.set(etag, visitorId);
  res.set('ETag', etag);
  res.json({ stored: true, etag });
});

app.listen(PORT, () => {
  console.log(`Fingerprint server running on port ${PORT}`);
});
