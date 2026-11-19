import { ALLOWED_EVENTS, isAllowedPath, normalizePath } from "./paths";

export type IncomingEvent = {
  e?: unknown;
  p?: unknown;
  v?: unknown;
  f?: unknown;
  l?: unknown;
  s?: unknown;
  n?: unknown;
};

export type ParsedEvent = {
  e: string;
  p?: string;
  v?: string;
  f?: string;
  l?: string;
  s?: number;
  n?: "new" | "ret";
};

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|wget|curl|python-requests|headless|phantom|selenium/i;

export const CLICK_EVENTS = new Set(["tel", "whatsapp", "waze", "google_maps", "google_review"]);

export function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_UA.test(ua);
}

export function dayKey(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function minuteKey(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 16);
}

/** Inclusive day bounds for a half-open [periodStart, periodEnd) ms window. */
export function dayRange(periodStart: number, periodEnd: number): { startDay: string; endDay: string } {
  return {
    startDay: dayKey(periodStart),
    endDay: dayKey(Math.max(periodStart, periodEnd - 1)),
  };
}

export function retentionCutoffDay(retentionDays: number, now = Date.now()): string {
  return dayKey(now - retentionDays * 24 * 60 * 60 * 1000);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const RATE_LIMIT_RETENTION_DAYS = 2;
export const DEFAULT_RETENTION_DAYS = 90;

/** Identified → sha256(pepper|v). No-id → null (never IP-derived). */
export async function visitorHashForEvent(v: string | undefined, pepper: string): Promise<string | null> {
  if (!v) return null;
  return sha256Hex(`${pepper}|${v}`);
}

export function parseBody(raw: string): { ok: true; event: ParsedEvent } | { ok: false; error: string } {
  if (raw.length > 512) return { ok: false, error: "too_large" };
  let json: IncomingEvent;
  try {
    json = JSON.parse(raw) as IncomingEvent;
  } catch {
    return { ok: false, error: "bad_json" };
  }
  const e = String(json.e || "").trim();
  if (!ALLOWED_EVENTS.has(e)) return { ok: false, error: "bad_event" };

  const out: ParsedEvent = { e };

  if (json.v != null && json.v !== "") {
    const v = String(json.v);
    if (!/^[0-9a-f]{32}$/.test(v)) return { ok: false, error: "bad_v" };
    out.v = v;
  }
  if (json.f != null && json.f !== "") {
    const f = String(json.f);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return { ok: false, error: "bad_f" };
    out.f = f;
  }
  if (json.l != null && json.l !== "") {
    const l = String(json.l);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l)) return { ok: false, error: "bad_l" };
    out.l = l;
  }
  if (json.s != null && json.s !== "") {
    if (Number(json.s) !== 1) return { ok: false, error: "bad_s" };
    out.s = 1;
  }
  if (json.n != null && json.n !== "") {
    const n = String(json.n);
    if (n !== "new" && n !== "ret") return { ok: false, error: "bad_n" };
    out.n = n;
  }

  if (e === "pageview") {
    const p = normalizePath(String(json.p || ""));
    if (!isAllowedPath(p)) return { ok: false, error: "bad_path" };
    out.p = p;
    if (!out.n) return { ok: false, error: "pageview_needs_n" };
  } else if (e === "callback_form_success") {
    if (out.v) return { ok: false, error: "thanks_no_v" };
    if (!out.n) return { ok: false, error: "thanks_needs_n" };
    if (json.p != null && json.p !== "") return { ok: false, error: "lead_no_path" };
  } else if (CLICK_EVENTS.has(e)) {
    if (json.p != null && json.p !== "") return { ok: false, error: "click_no_path" };
  }

  return { ok: true, event: out };
}

export function originAllowed(origin: string | null, allowlist: string): boolean {
  if (!origin) return false;
  return allowlist
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(origin);
}

export function weekBounds(now = Date.now()) {
  const end = now;
  const start = end - 7 * 24 * 60 * 60 * 1000;
  return { start, end, prevStart: start - 7 * 24 * 60 * 60 * 1000, prevEnd: start };
}

export type PageViewRow = { day: string; path: string; n: string; count: number };
export type VisitRow = { day: string; v_hash: string; f: string | null; l: string | null; s: number | null };
export type ClickRow = { day: string; event: string; v_hash: string | null; f: string | null; s: number | null };
export type LeadRow = { ts: number; day: string; n: string };

export function rowHasPathAndVHash(row: Record<string, unknown>): boolean {
  return Boolean(row.path != null && row.path !== "" && row.v_hash != null && row.v_hash !== "");
}

export function shouldRotateId(created: string | undefined, today: string, retentionDays = DEFAULT_RETENTION_DAYS): boolean {
  if (!created || !/^\d{4}-\d{2}-\d{2}$/.test(created)) return true;
  const c = Date.parse(created + "T00:00:00Z");
  const t = Date.parse(today + "T00:00:00Z");
  if (Number.isNaN(c) || Number.isNaN(t)) return true;
  return t - c >= retentionDays * 24 * 60 * 60 * 1000;
}

function inDayRange(day: string, startDay: string, endDay: string): boolean {
  return day >= startDay && day <= endDay;
}

export function computeWeekly(
  pageViews: PageViewRow[],
  visits: VisitRow[],
  clicks: ClickRow[],
  leads: LeadRow[],
  periodStart: number,
  periodEnd: number,
  retentionDays: number,
) {
  const { startDay, endDay } = dayRange(periodStart, periodEnd);
  const pv = pageViews.filter((r) => inDayRange(r.day, startDay, endDay));
  const vs = visits.filter((r) => inDayRange(r.day, startDay, endDay));
  const ck = clicks.filter((r) => inDayRange(r.day, startDay, endDay));
  const ld = leads.filter((r) => r.ts >= periodStart && r.ts < periodEnd);

  const visitors = new Set(vs.map((r) => r.v_hash));
  const visitStarts = vs.filter((r) => r.s === 1).length;
  const newVisitors = new Set(vs.filter((r) => r.f && r.f >= startDay && r.f <= endDay).map((r) => r.v_hash));
  const returning = new Set([...visitors].filter((v) => !newVisitors.has(v)));

  const clickStats: Record<string, { total: number; distinct: number; new: number; returning: number }> = {};
  for (const ch of CLICK_EVENTS) {
    const list = ck.filter((r) => r.event === ch);
    const distinct = new Set(list.map((r) => r.v_hash).filter(Boolean) as string[]);
    const newC = [...distinct].filter((v) => newVisitors.has(v)).length;
    clickStats[ch] = { total: list.length, distinct: distinct.size, new: newC, returning: distinct.size - newC };
  }

  const telWa = ck.filter((r) => r.event === "tel" || r.event === "whatsapp");
  const leadClickers = new Set(telWa.map((r) => r.v_hash).filter(Boolean) as string[]);
  const leadClickNew = [...leadClickers].filter((v) => newVisitors.has(v)).length;
  const callbackNew = ld.filter((r) => r.n === "new").length;
  const callbackRet = ld.filter((r) => r.n === "ret").length;
  const leadsTotal = telWa.length + ld.length;
  const leadsDistinct = leadClickers.size + ld.length;
  const leadNew = leadClickNew + callbackNew;
  const leadRet = leadClickers.size - leadClickNew + callbackRet;
  const conversion = visitors.size === 0 ? 0 : Math.round((leadsDistinct / visitors.size) * 1000) / 1000;
  const conversionNew = newVisitors.size === 0 ? 0 : Math.round((leadNew / newVisitors.size) * 1000) / 1000;
  const conversionRet = returning.size === 0 ? 0 : Math.round((leadRet / returning.size) * 1000) / 1000;

  const byVisitorDays = new Map<string, Set<string>>();
  for (const r of ck) {
    if (!r.v_hash) continue;
    if (!byVisitorDays.has(r.v_hash)) byVisitorDays.set(r.v_hash, new Set());
    byVisitorDays.get(r.v_hash)!.add(r.day);
  }
  const multiDayClickers = [...byVisitorDays.values()].filter((d) => d.size >= 2).length;

  const pageAgg = new Map<string, { views: number; new: number; returning: number }>();
  let pageViewTotal = 0;
  for (const r of pv) {
    const c = Number(r.count) || 0;
    pageViewTotal += c;
    const cur = pageAgg.get(r.path) || { views: 0, new: 0, returning: 0 };
    cur.views += c;
    if (r.n === "new") cur.new += c;
    else cur.returning += c;
    pageAgg.set(r.path, cur);
  }
  const topPagesByViews = [...pageAgg.entries()]
    .map(([path, a]) => ({ path, views: a.views, new: a.new, returning: a.returning }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  return {
    retentionDays,
    limitations:
      "Safari and some in-app browsers may clear or block localStorage, which can over-count first-day visits as new after storage is wiped.",
    pageViews: pageViewTotal,
    uniqueVisitors: visitors.size,
    visits: visitStarts,
    newVisitors: newVisitors.size,
    returningVisitors: returning.size,
    clicks: clickStats,
    leads: {
      total: leadsTotal,
      distinct: leadsDistinct,
      new: leadNew,
      returning: leadRet,
      conversionRate: conversion,
      conversionRateNew: conversionNew,
      conversionRateReturning: conversionRet,
      callbackFormSuccess: ld.length,
    },
    multiDayClickers,
    topPagesByViews,
  };
}

export function weekOverWeekChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
