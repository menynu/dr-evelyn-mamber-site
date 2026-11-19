import {
  computeWeekly,
  dayKey,
  isBot,
  minuteKey,
  originAllowed,
  parseBody,
  sha256Hex,
  weekBounds,
  weekOverWeekChange,
  type EventRow,
} from "./logic";
import { dashboardHtml } from "./dashboard";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  MAX_EVENTS_PER_DAY?: string;
  WRITE_SPIKE_LIMIT?: string;
  V_PEPPER: string;
  IP_SALT_SECRET: string;
  DASH_USER: string;
  DASH_PASS: string;
  WEEKLY_TOKEN: string;
}

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
});

async function hashVisitor(v: string | undefined, pepper: string, day: string, ipHash: string): Promise<string> {
  if (v) return sha256Hex(`${pepper}|${v}`);
  return sha256Hex(`${pepper}|noid|${day}|${ipHash}`);
}

async function ipDailyHash(request: Request, secret: string, day: string): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";
  return sha256Hex(`${secret}|${day}|${ip}`);
}

async function handleEvent(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (!originAllowed(origin, env.ALLOWED_ORIGINS || "")) {
    return new Response("forbidden", { status: 403 });
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") {
    return new Response("method", { status: 405, headers: cors(origin) });
  }

  const ua = request.headers.get("user-agent");
  if (isBot(ua)) {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  const raw = await request.text();
  const parsed = parseBody(raw);
  if (!parsed.ok) {
    return new Response(parsed.error, { status: 400, headers: cors(origin) });
  }
  const ev = parsed.event;
  const now = Date.now();
  const day = dayKey(now);
  const ipHash = await ipDailyHash(request, env.IP_SALT_SECRET || "dev-ip", day);

  const spikeLimit = Number(env.WRITE_SPIKE_LIMIT || "400");
  const mk = minuteKey(now);
  const spike = await env.DB.prepare("SELECT count FROM write_spikes WHERE minute_key = ?")
    .bind(mk)
    .first<{ count: number }>();
  const spikeCount = (spike?.count || 0) + 1;
  if (spikeCount > spikeLimit) {
    return new Response("busy", { status: 503, headers: cors(origin) });
  }
  await env.DB.prepare(
    "INSERT INTO write_spikes (minute_key, count) VALUES (?, 1) ON CONFLICT(minute_key) DO UPDATE SET count = count + 1",
  )
    .bind(mk)
    .run();

  const maxDay = Number(env.MAX_EVENTS_PER_DAY || "60");
  const rateKey = ev.v ? await sha256Hex(`v|${env.V_PEPPER}|${ev.v}|${day}`) : `ip|${ipHash}`;
  const rate = await env.DB.prepare("SELECT count FROM rate_limits WHERE key = ? AND day = ?")
    .bind(rateKey, day)
    .first<{ count: number }>();
  const rateCount = (rate?.count || 0) + 1;
  if (rateCount > maxDay) {
    return new Response("rate", { status: 429, headers: cors(origin) });
  }
  await env.DB.prepare(
    `INSERT INTO rate_limits (key, day, count) VALUES (?, ?, 1)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN day = excluded.day THEN count + 1 ELSE 1 END,
       day = excluded.day`,
  )
    .bind(rateKey, day)
    .run();

  const vHash = await hashVisitor(ev.v, env.V_PEPPER || "dev-pepper", day, ipHash);

  if (ev.e !== "pageview" && ev.e !== "callback_form_success") {
    const recent = await env.DB.prepare(
      "SELECT 1 as ok FROM events WHERE v_hash = ? AND event = 'pageview' AND ts >= ? LIMIT 1",
    )
      .bind(vHash, now - 30 * 60 * 1000)
      .first();
    if (!recent) {
      return new Response("no_pageview", { status: 409, headers: cors(origin) });
    }
  }
  await env.DB.prepare(
    "INSERT INTO events (ts, day, event, path, v_hash, f, l, s, n) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(now, day, ev.e, ev.p, vHash, ev.f || null, ev.l || null, ev.s || null, ev.n || null)
    .run();

  return new Response(null, { status: 204, headers: cors(origin) });
}

function unauthorized(): Response {
  return new Response("auth", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="analytics"' },
  });
}

function checkBasic(request: Request, env: Env): boolean {
  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  try {
    const decoded = atob(h.slice(6));
    const i = decoded.indexOf(":");
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    return user === env.DASH_USER && pass === env.DASH_PASS;
  } catch {
    return false;
  }
}

async function loadRows(env: Env, start: number, end: number): Promise<EventRow[]> {
  const res = await env.DB.prepare(
    "SELECT ts, day, event, path, v_hash, f, l, s, n FROM events WHERE ts >= ? AND ts < ?",
  )
    .bind(start, end)
    .all<EventRow>();
  return res.results || [];
}

async function handleWeekly(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== env.WEEKLY_TOKEN) {
    return new Response("forbidden", { status: 403 });
  }
  const { start, end, prevStart, prevEnd } = weekBounds();
  const rows = await loadRows(env, prevStart, end);
  const current = computeWeekly(rows, start, end);
  const previous = computeWeekly(rows, prevStart, prevEnd);
  const body = {
    period: { start, end },
    current,
    previous,
    wow: {
      uniqueVisitors: weekOverWeekChange(current.uniqueVisitors, previous.uniqueVisitors),
      visits: weekOverWeekChange(current.visits, previous.visits),
      leads: weekOverWeekChange(current.leads.distinct, previous.leads.distinct),
    },
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleDashboard(request: Request, env: Env): Promise<Response> {
  if (!checkBasic(request, env)) return unauthorized();
  const { start, end, prevStart, prevEnd } = weekBounds();
  const rows = await loadRows(env, prevStart, end);
  const current = computeWeekly(rows, start, end);
  const previous = computeWeekly(rows, prevStart, prevEnd);
  const html = dashboardHtml(current, previous);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function purgeOld(env: Env): Promise<void> {
  const cutoff = Date.now() - 13 * 30 * 24 * 60 * 60 * 1000;
  await env.DB.prepare("DELETE FROM events WHERE ts < ?").bind(cutoff).run();
  const oldDay = dayKey(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await env.DB.prepare("DELETE FROM rate_limits WHERE day < ?").bind(oldDay).run();
  await env.DB.prepare("DELETE FROM write_spikes WHERE minute_key < ?")
    .bind(minuteKey(Date.now() - 2 * 60 * 60 * 1000))
    .run();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/e") return handleEvent(request, env);
      if (url.pathname === "/dashboard") return handleDashboard(request, env);
      if (url.pathname === "/api/weekly") return handleWeekly(request, env);
      return new Response("not found", { status: 404 });
    } catch {
      return new Response("error", { status: 500 });
    }
  },
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await purgeOld(env);
  },
};
