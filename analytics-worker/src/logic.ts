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
  p: string;
  v?: string;
  f?: string;
  l?: string;
  s?: number;
  n?: "new" | "ret";
};

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|wget|curl|python-requests|headless|phantom|selenium/i;

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

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
  const p = normalizePath(String(json.p || ""));
  if (!isAllowedPath(p)) return { ok: false, error: "bad_path" };

  const out: ParsedEvent = { e, p };

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
    const s = Number(json.s);
    if (s !== 1) return { ok: false, error: "bad_s" };
    out.s = 1;
  }
  if (json.n != null && json.n !== "") {
    const n = String(json.n);
    if (n !== "new" && n !== "ret") return { ok: false, error: "bad_n" };
    out.n = n;
  }

  if (e === "callback_form_success") {
    if (out.v) return { ok: false, error: "thanks_no_v" };
    if (!out.n) return { ok: false, error: "thanks_needs_n" };
  }

  return { ok: true, event: out };
}

export function originAllowed(origin: string | null, allowlist: string): boolean {
  if (!origin) return false;
  const allowed = allowlist
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

export function weekBounds(now = Date.now()): { start: number; end: number; prevStart: number; prevEnd: number } {
  const end = now;
  const start = end - 7 * 24 * 60 * 60 * 1000;
  const prevEnd = start;
  const prevStart = prevEnd - 7 * 24 * 60 * 60 * 1000;
  return { start, end, prevStart, prevEnd };
}

export type EventRow = {
  ts: number;
  day: string;
  event: string;
  path: string;
  v_hash: string | null;
  f: string | null;
  l: string | null;
  s: number | null;
  n: string | null;
};

const CLICKS = new Set(["tel", "whatsapp", "waze", "google_maps", "google_review"]);
const LEADS = new Set(["tel", "whatsapp", "callback_form_success"]);

export function computeWeekly(rows: EventRow[], periodStart: number, periodEnd: number) {
  const inPeriod = rows.filter((r) => r.ts >= periodStart && r.ts < periodEnd);
  const visitors = new Set(inPeriod.filter((r) => r.v_hash).map((r) => r.v_hash as string));
  const visits = inPeriod.filter((r) => r.event === "pageview" && r.s === 1).length;

  const startDay = dayKey(periodStart);
  const endDay = dayKey(periodEnd - 1);
  const newVisitors = new Set(
    inPeriod.filter((r) => r.v_hash && r.f && r.f >= startDay && r.f <= endDay).map((r) => r.v_hash as string),
  );
  const returning = new Set([...visitors].filter((v) => !newVisitors.has(v)));

  const clicks: Record<
    string,
    { total: number; distinct: number; new: number; returning: number }
  > = {};
  for (const ch of CLICKS) {
    const list = inPeriod.filter((r) => r.event === ch);
    const distinct = new Set(list.map((r) => r.v_hash).filter(Boolean) as string[]);
    const newC = [...distinct].filter((v) => newVisitors.has(v)).length;
    clicks[ch] = {
      total: list.length,
      distinct: distinct.size,
      new: newC,
      returning: distinct.size - newC,
    };
  }

  const leadRows = inPeriod.filter((r) => LEADS.has(r.event));
  const leadVisitors = new Set(leadRows.map((r) => r.v_hash).filter(Boolean) as string[]);
  const leadNew = [...leadVisitors].filter((v) => newVisitors.has(v)).length;
  const leadRet = leadVisitors.size - leadNew;
  const conversion =
    visitors.size === 0 ? 0 : Math.round((leadVisitors.size / visitors.size) * 1000) / 1000;
  const conversionNew = newVisitors.size === 0 ? 0 : Math.round((leadNew / newVisitors.size) * 1000) / 1000;
  const conversionRet = returning.size === 0 ? 0 : Math.round((leadRet / returning.size) * 1000) / 1000;

  const byVisitorDays = new Map<string, Set<string>>();
  for (const r of inPeriod) {
    if (!r.v_hash || !CLICKS.has(r.event)) continue;
    if (!byVisitorDays.has(r.v_hash)) byVisitorDays.set(r.v_hash, new Set());
    byVisitorDays.get(r.v_hash)!.add(r.day);
  }
  const multiDayClickers = [...byVisitorDays.values()].filter((d) => d.size >= 2).length;

  const pageVisitors = new Map<string, Set<string>>();
  const pageLeads = new Map<string, number>();
  for (const r of inPeriod) {
    if (r.event === "pageview" && r.v_hash) {
      if (!pageVisitors.has(r.path)) pageVisitors.set(r.path, new Set());
      pageVisitors.get(r.path)!.add(r.v_hash);
    }
    if (LEADS.has(r.event)) {
      pageLeads.set(r.path, (pageLeads.get(r.path) || 0) + 1);
    }
  }
  const topPagesByVisitors = [...pageVisitors.entries()]
    .map(([path, set]) => ({ path, visitors: set.size }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 3);
  const topPagesByLeads = [...pageLeads.entries()]
    .map(([path, leads]) => ({ path, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 3);

  return {
    uniqueVisitors: visitors.size,
    visits,
    newVisitors: newVisitors.size,
    returningVisitors: returning.size,
    clicks,
    leads: {
      total: leadRows.length,
      distinct: leadVisitors.size,
      new: leadNew,
      returning: leadRet,
      conversionRate: conversion,
      conversionRateNew: conversionNew,
      conversionRateReturning: conversionRet,
    },
    multiDayClickers,
    topPagesByVisitors,
    topPagesByLeads,
  };
}

export function weekOverWeekChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
