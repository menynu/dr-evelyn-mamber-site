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

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS write_spikes (
  minute_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);
