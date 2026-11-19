-- Option C: no row may hold both a path and a visitor hash.
-- page_views: aggregate page counter only (path + new/ret), no v_hash.
-- visits: per-identifier visit (no path).
-- clicks: channel click linked to hashed id optionally (no path).
-- leads: callback_form_success only (n; no path, no id).
-- IP-derived values live only in rate_limits (purged after 2 days).

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  n TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views(day);
CREATE INDEX IF NOT EXISTS idx_page_views_ts ON page_views(ts);
CREATE INDEX IF NOT EXISTS idx_page_views_path_day ON page_views(path, day);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  v_hash TEXT NOT NULL,
  f TEXT,
  l TEXT,
  s INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visits_vhash_ts ON visits(v_hash, ts);
CREATE INDEX IF NOT EXISTS idx_visits_day ON visits(day);
CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  v_hash TEXT,
  f TEXT,
  s INTEGER
);

CREATE INDEX IF NOT EXISTS idx_clicks_event_day ON clicks(event, day);
CREATE INDEX IF NOT EXISTS idx_clicks_vhash_day ON clicks(v_hash, day);
CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks(ts);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  n TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_day ON leads(day);
CREATE INDEX IF NOT EXISTS idx_leads_ts ON leads(ts);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS write_spikes (
  minute_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);
