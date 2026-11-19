-- Option C (no linkage): no row may hold both a path and a visitor hash.
-- page_views: true aggregate counter (day, path, n) — no ts, no visitor id.
-- visits / clicks: day-granularity only, random TEXT primary keys (no rowid / ts
--   correlation with other tables). No path.
-- leads: callback_form_success only (n; no path, no id).
-- IP-derived values live only in rate_limits (purged after 2 days).

CREATE TABLE IF NOT EXISTS page_views (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  n TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (day, path, n)
);

CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views(day);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  v_hash TEXT NOT NULL,
  f TEXT,
  l TEXT,
  s INTEGER
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_visits_vhash_day ON visits(v_hash, day);
CREATE INDEX IF NOT EXISTS idx_visits_day ON visits(day);

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  v_hash TEXT,
  f TEXT,
  s INTEGER
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_clicks_event_day ON clicks(event, day);
CREATE INDEX IF NOT EXISTS idx_clicks_vhash_day ON clicks(v_hash, day);
CREATE INDEX IF NOT EXISTS idx_clicks_day ON clicks(day);

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
