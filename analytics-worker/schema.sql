-- events: never store IP or IP-derived values.
-- v_hash is sha256(pepper|v) for identified visitors, or NULL for no-id
-- (GPC / DNT / opt-out / callback_form_success).
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  path TEXT NOT NULL,
  v_hash TEXT,
  f TEXT,
  l TEXT,
  s INTEGER,
  n TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_day ON events(day);
CREATE INDEX IF NOT EXISTS idx_events_event_day ON events(event, day);
CREATE INDEX IF NOT EXISTS idx_events_vhash_ts ON events(v_hash, ts);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);

-- Hashed visitor id or hashed IP (abuse limiting only). Purged after N=2 days.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS write_spikes (
  minute_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);
