import {
  CLICK_EVENTS,
  computeWeekly,
  dayKey,
  DEFAULT_RETENTION_DAYS,
  isBot,
  minuteKey,
  originAllowed,
  parseBody,
  RATE_LIMIT_RETENTION_DAYS,
  sha256Hex,
  visitorHashForEvent,
  weekBounds,
  weekOverWeekChange,
  type ClickRow,
  type LeadRow,
  type PageViewRow,
  type VisitRow,
} from "./logic";
import { dashboardHtml } from "./dashboard";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  MAX_EVENTS_PER_DAY?: string;
  WRITE_SPIKE_LIMIT?: string;
  RETENTION_DAYS?: string;
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

function retentionDays(env: Env): number {
  const n = Number(env.RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RETENTION_DAYS;
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
  if (isBot(request.headers.get("user-agent"))) {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  const parsed = parseBody(await request.text());
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
  if ((spike?.count || 0) + 1 > spikeLimit) {
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
  if ((rate?.count || 0) + 1 > maxDay) {
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

  const vHash = await visitorHashForEvent(ev.v, env.V_PEPPER || "dev-pepper");

  if (ev.e === "pageview") {
    await env.DB.prepare("INSERT INTO page_views (ts, day, path, n) VALUES (?, ?, ?, ?)")
      .bind(now, day, ev.p!, ev.n!)
      .run();
    if (vHash) {
      await env.DB.prepare("INSERT INTO visits (ts, day, v_hash, f, l, s) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(now, day, vHash, ev.f || null, ev.l || null, ev.s || null)
        .run();
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (ev.e === "callback_form_success") {
    await env.DB.prepare("INSERT INTO leads (ts, day, n) VALUES (?, ?, ?)").bind(now, day, ev.n!).run();
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (CLICK_EVENTS.has(ev.e)) {
    if (vHash) {
      const recent = await env.DB.prepare("SELECT 1 as ok FROM visits WHERE v_hash = ? AND ts >= ? LIMIT 1")
        .bind(vHash, now - 30 * 60 * 1000)
        .first();
      if (!recent) {
        return new Response("no_pageview", { status: 409, headers: cors(origin) });
      }
    }
    await env.DB.prepare("INSERT INTO clicks (ts, day, event, v_hash, f, s) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(now, day, ev.e, vHash, ev.f || null, ev.s || null)
      .run();
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  return new Response("bad_event", { status: 400, headers: cors(origin) });
}

function unauthorized(): Response {
  return new Response("auth", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="analytics"' } });
}

function checkBasic(request: Request, env: Env): boolean {
  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  try {
    const decoded = atob(h.slice(6));
    const i = decoded.indexOf(":");
    return decoded.slice(0, i) === env.DASH_USER && decoded.slice(i + 1) === env.DASH_PASS;
  } catch {
    return false;
  }
}

async function loadTables(env: Env, start: number, end: number) {
  const [pv, vs, ck, ld] = await Promise.all([
    env.DB.prepare("SELECT ts, day, path, n FROM page_views WHERE ts >= ? AND ts < ?").bind(start, end).all<PageViewRow>(),
    env.DB.prepare("SELECT ts, day, v_hash, f, l, s FROM visits WHERE ts >= ? AND ts < ?").bind(start, end).all<VisitRow>(),
    env.DB.prepare("SELECT ts, day, event, v_hash, f, s FROM clicks WHERE ts >= ? AND ts < ?").bind(start, end).all<ClickRow>(),
    env.DB.prepare("SELECT ts, day, n FROM leads WHERE ts >= ? AND ts < ?").bind(start, end).all<LeadRow>(),
  ]);
  return {
    pageViews: pv.results || [],
    visits: vs.results || [],
    clicks: ck.results || [],
    leads: ld.results || [],
  };
}

async function weeklyBundle(env: Env) {
  const days = retentionDays(env);
  const { start, end, prevStart, prevEnd } = weekBounds();
  const cur = await loadTables(env, start, end);
  const prev = await loadTables(env, prevStart, prevEnd);
  return {
    start,
    end,
    retentionDays: days,
    current: computeWeekly(cur.pageViews, cur.visits, cur.clicks, cur.leads, start, end, days),
    previous: computeWeekly(prev.pageViews, prev.visits, prev.clicks, prev.leads, prevStart, prevEnd, days),
  };
}

async function handleWeekly(request: Request, env: Env): Promise<Response> {
  if (new URL(request.url).searchParams.get("token") !== env.WEEKLY_TOKEN) {
    return new Response("forbidden", { status: 403 });
  }
  const { start, end, current, previous, retentionDays: days } = await weeklyBundle(env);
  return new Response(
    JSON.stringify({
      retentionDays: days,
      note: `Retention window: ${days} days. ${current.limitations}`,
      period: { start, end },
      current,
      previous,
      wow: {
        uniqueVisitors: weekOverWeekChange(current.uniqueVisitors, previous.uniqueVisitors),
        visits: weekOverWeekChange(current.visits, previous.visits),
        leads: weekOverWeekChange(current.leads.distinct, previous.leads.distinct),
        pageViews: weekOverWeekChange(current.pageViews, previous.pageViews),
      },
    }),
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
}

async function handleDashboard(request: Request, env: Env): Promise<Response> {
  if (!checkBasic(request, env)) return unauthorized();
  const { current, previous, retentionDays: days } = await weeklyBundle(env);
  return new Response(dashboardHtml(current, previous, days), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function purgeOld(env: Env): Promise<void> {
  const cutoff = Date.now() - retentionDays(env) * 24 * 60 * 60 * 1000;
  await env.DB.prepare("DELETE FROM page_views WHERE ts < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM visits WHERE ts < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM clicks WHERE ts < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM leads WHERE ts < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE day < ?")
    .bind(dayKey(Date.now() - RATE_LIMIT_RETENTION_DAYS * 24 * 60 * 60 * 1000))
    .run();
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
