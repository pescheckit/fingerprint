import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Store {
  constructor(dbPath) {
    this.db = new Database(dbPath || join(__dirname, 'fingerprints.db'));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this._initialize();
    this._prepareStatements();
  }

  _initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT NOT NULL,
        fingerprint TEXT,
        device_id TEXT,
        ip TEXT,
        ip_subnet TEXT,
        audio_sum REAL,
        timezone TEXT,
        timezone_offset INTEGER,
        languages TEXT,
        screen_width INTEGER,
        screen_height INTEGER,
        hardware_concurrency INTEGER,
        device_memory REAL,
        platform TEXT,
        touch_support INTEGER,
        color_depth INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_visitor_id ON profiles(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_ip_subnet ON profiles(ip_subnet);
      CREATE INDEX IF NOT EXISTS idx_profiles_fingerprint ON profiles(fingerprint);

      CREATE TABLE IF NOT EXISTS etags (
        etag TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_etags_visitor_id ON etags(visitor_id);

      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        first_seen TEXT DEFAULT (datetime('now')),
        last_seen TEXT DEFAULT (datetime('now')),
        device_count INTEGER DEFAULT 0
      );
    `);

    // Add new columns to profiles (try/catch since SQLite has no IF NOT EXISTS for ALTER)
    const newColumns = [
      'ALTER TABLE profiles ADD COLUMN household_id TEXT',
      'ALTER TABLE profiles ADD COLUMN local_ip_subnet TEXT',
      'ALTER TABLE profiles ADD COLUMN last_active TEXT',
      'ALTER TABLE profiles ADD COLUMN battery_level REAL',
      'ALTER TABLE profiles ADD COLUMN battery_charging INTEGER',
    ];
    for (const sql of newColumns) {
      try { this.db.exec(sql); } catch { /* column already exists */ }
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);
    `);
  }

  _prepareStatements() {
    this._stmts = {
      saveProfile: this.db.prepare(`
        INSERT INTO profiles (
          visitor_id, fingerprint, device_id, ip, ip_subnet,
          audio_sum, timezone, timezone_offset, languages,
          screen_width, screen_height, hardware_concurrency,
          device_memory, platform, touch_support, color_depth,
          household_id, local_ip_subnet, battery_level, battery_charging
        ) VALUES (
          @visitor_id, @fingerprint, @device_id, @ip, @ip_subnet,
          @audio_sum, @timezone, @timezone_offset, @languages,
          @screen_width, @screen_height, @hardware_concurrency,
          @device_memory, @platform, @touch_support, @color_depth,
          @household_id, @local_ip_subnet, @battery_level, @battery_charging
        )
      `),
      getProfile: this.db.prepare(
        'SELECT * FROM profiles WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1'
      ),
      // Pre-filter candidates by indexed columns to avoid full table scan
      findCandidates: this.db.prepare(`
        SELECT * FROM profiles
        WHERE device_id = @device_id
           OR ip_subnet = @ip_subnet
           OR fingerprint = @fingerprint
        ORDER BY created_at DESC
      `),
      // Fallback: get recent unique profiles (capped) when no indexed matches
      findRecent: this.db.prepare(`
        SELECT * FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY id DESC) as rn
          FROM profiles
        ) WHERE rn = 1
        ORDER BY id DESC
        LIMIT 500
      `),
      // Deduplicate: keep only the latest profile per visitor_id, delete older ones
      pruneOld: this.db.prepare(`
        DELETE FROM profiles WHERE id NOT IN (
          SELECT MAX(id) FROM profiles GROUP BY visitor_id
        ) AND created_at < datetime('now', '-7 days')
      `),
      // Delete profiles older than N days
      pruneStale: this.db.prepare(
        "DELETE FROM profiles WHERE created_at < datetime('now', ? || ' days')"
      ),
      profileCount: this.db.prepare('SELECT COUNT(*) as count FROM profiles'),

      // ETag operations
      getEtag: this.db.prepare('SELECT visitor_id FROM etags WHERE etag = ?'),
      setEtag: this.db.prepare(`
        INSERT INTO etags (etag, visitor_id) VALUES (@etag, @visitor_id)
        ON CONFLICT(etag) DO UPDATE SET visitor_id = @visitor_id, updated_at = datetime('now')
      `),
      pruneEtags: this.db.prepare(
        "DELETE FROM etags WHERE updated_at < datetime('now', '-90 days')"
      ),

      // Household operations
      getHousehold: this.db.prepare('SELECT * FROM households WHERE id = ?'),
      upsertHousehold: this.db.prepare(`
        INSERT INTO households (id) VALUES (@id)
        ON CONFLICT(id) DO UPDATE SET
          last_seen = datetime('now'),
          device_count = (SELECT COUNT(DISTINCT visitor_id) FROM profiles WHERE household_id = @id)
      `),
      findHouseholdMembers: this.db.prepare(
        'SELECT * FROM profiles WHERE household_id = ? ORDER BY last_active DESC'
      ),
      updateLastActive: this.db.prepare(
        "UPDATE profiles SET last_active = datetime('now') WHERE visitor_id = @visitor_id"
      ),
      findRecentProfiles: this.db.prepare(`
        SELECT DISTINCT visitor_id FROM profiles
        WHERE last_active > datetime('now', '-' || ? || ' minutes')
        ORDER BY last_active DESC
        LIMIT 20
      `),
    };
  }

  saveProfile(data) {
    return this._stmts.saveProfile.run({
      visitor_id: data.visitor_id || null,
      fingerprint: data.fingerprint || null,
      device_id: data.deviceId || null,
      ip: data.ip || null,
      ip_subnet: data.ipSubnet || null,
      audio_sum: data.audioSum ?? null,
      timezone: data.timezone || null,
      timezone_offset: data.timezoneOffset ?? null,
      languages: data.languages || null,
      screen_width: data.screenWidth ?? null,
      screen_height: data.screenHeight ?? null,
      hardware_concurrency: data.hardwareConcurrency ?? null,
      device_memory: data.deviceMemory ?? null,
      platform: data.platform || null,
      touch_support: data.touchSupport ?? null,
      color_depth: data.colorDepth ?? null,
      household_id: data.household_id || null,
      local_ip_subnet: data.local_ip_subnet || null,
      battery_level: data.battery_level ?? null,
      battery_charging: data.battery_charging ?? null,
    });
  }

  findMatches(signals = {}) {
    // Try indexed candidate search first
    if (signals.deviceId || signals.ipSubnet || signals.fingerprint) {
      const candidates = this._stmts.findCandidates.all({
        device_id: signals.deviceId || '',
        ip_subnet: signals.ipSubnet || '',
        fingerprint: signals.fingerprint || '',
      });
      if (candidates.length > 0) return candidates;
    }
    // Fallback to recent unique profiles (capped at 500)
    return this._stmts.findRecent.all();
  }

  getProfile(visitorId) {
    return this._stmts.getProfile.get(visitorId);
  }

  updateProfile(visitorId, data) {
    const fields = [];
    const values = {};

    const fieldMap = {
      fingerprint: 'fingerprint',
      deviceId: 'device_id',
      ip: 'ip',
      ipSubnet: 'ip_subnet',
      audioSum: 'audio_sum',
      timezone: 'timezone',
      timezoneOffset: 'timezone_offset',
      languages: 'languages',
      screenWidth: 'screen_width',
      screenHeight: 'screen_height',
      hardwareConcurrency: 'hardware_concurrency',
      deviceMemory: 'device_memory',
      platform: 'platform',
      touchSupport: 'touch_support',
      colorDepth: 'color_depth',
      householdId: 'household_id',
      localIpSubnet: 'local_ip_subnet',
      batteryLevel: 'battery_level',
      batteryCharging: 'battery_charging',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = @${column}`);
        values[column] = data[key];
      }
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = datetime('now')");
    values.visitor_id = visitorId;

    const stmt = this.db.prepare(`
      UPDATE profiles SET ${fields.join(', ')}
      WHERE visitor_id = @visitor_id
    `);

    return stmt.run(values);
  }

  // ETag operations
  getEtag(etag) {
    const row = this._stmts.getEtag.get(etag);
    return row ? row.visitor_id : null;
  }

  setEtag(etag, visitorId) {
    return this._stmts.setEtag.run({ etag, visitor_id: visitorId });
  }

  // Maintenance
  prune() {
    const dupes = this._stmts.pruneOld.run();
    const stale = this._stmts.pruneStale.run('-90');
    const etags = this._stmts.pruneEtags.run();
    return {
      duplicatesRemoved: dupes.changes,
      staleRemoved: stale.changes,
      etagsRemoved: etags.changes,
    };
  }

  getStats() {
    const { count } = this._stmts.profileCount.get();
    return { profileCount: count };
  }

  // Household operations
  getHousehold(householdId) {
    return this._stmts.getHousehold.get(householdId);
  }

  upsertHousehold(householdId) {
    return this._stmts.upsertHousehold.run({ id: householdId });
  }

  findHouseholdMembers(householdId) {
    return this._stmts.findHouseholdMembers.all(householdId);
  }

  updateLastActive(visitorId) {
    return this._stmts.updateLastActive.run({ visitor_id: visitorId });
  }

  findRecentProfiles(minutes = 30) {
    return this._stmts.findRecentProfiles.all(String(minutes));
  }
}
