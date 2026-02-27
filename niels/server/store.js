import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Store {
  constructor(dbPath) {
    this.db = new Database(dbPath || join(__dirname, 'fingerprints.db'));
    this._initialize();
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
    `);
  }

  saveProfile(data) {
    const stmt = this.db.prepare(`
      INSERT INTO profiles (
        visitor_id, fingerprint, device_id, ip, ip_subnet,
        audio_sum, timezone, timezone_offset, languages,
        screen_width, screen_height, hardware_concurrency,
        device_memory, platform, touch_support, color_depth
      ) VALUES (
        @visitor_id, @fingerprint, @device_id, @ip, @ip_subnet,
        @audio_sum, @timezone, @timezone_offset, @languages,
        @screen_width, @screen_height, @hardware_concurrency,
        @device_memory, @platform, @touch_support, @color_depth
      )
    `);

    return stmt.run({
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
    });
  }

  findMatches() {
    const stmt = this.db.prepare('SELECT * FROM profiles');
    return stmt.all();
  }

  getProfile(visitorId) {
    const stmt = this.db.prepare('SELECT * FROM profiles WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(visitorId);
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
}
