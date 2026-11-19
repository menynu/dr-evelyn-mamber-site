import { describe, expect, it } from "vitest";
import {
  DEFAULT_RETENTION_DAYS,
  RATE_LIMIT_RETENTION_DAYS,
  computeWeekly,
  isBot,
  originAllowed,
  parseBody,
  rowHasPathAndVHash,
  shouldRotateId,
  visitorHashForEvent,
  weekOverWeekChange,
  type ClickRow,
  type LeadRow,
  type PageViewRow,
  type VisitRow,
} from "../src/logic";
import { isAllowedPath, normalizePath } from "../src/paths";

describe("parseBody", () => {
  it("accepts pageview with path+n and optional v", () => {
    const ok = parseBody(
      JSON.stringify({ e: "pageview", p: "/contact/", n: "new", v: "a".repeat(32), f: "2026-11-19", l: "2026-11-19", s: 1 }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.event.p).toBe("/contact/");
      expect(ok.event.v).toHaveLength(32);
    }
  });

  it("rejects path on clicks/leads; forbids v on callback", () => {
    expect(parseBody(JSON.stringify({ e: "tel", v: "a".repeat(32), f: "2026-11-19" })).ok).toBe(true);
    expect(parseBody(JSON.stringify({ e: "whatsapp", p: "/contact/", n: "new" })).ok).toBe(false);
    expect(parseBody(JSON.stringify({ e: "google_review", n: "ret" })).ok).toBe(true);
    expect(parseBody(JSON.stringify({ e: "callback_form_success", n: "new" })).ok).toBe(true);
    expect(parseBody(JSON.stringify({ e: "callback_form_success", n: "new", v: "a".repeat(32) })).ok).toBe(false);
    expect(parseBody(JSON.stringify({ e: "callback_form_success", n: "new", p: "/contact/thanks/" })).ok).toBe(false);
  });

  it("rejects oversized / unknown", () => {
    expect(parseBody("x".repeat(513)).ok).toBe(false);
    expect(parseBody(JSON.stringify({ e: "hack", p: "/", n: "new" })).ok).toBe(false);
  });
});

describe("option C invariants", () => {
  it("never mixes path and v_hash on logical rows", () => {
    expect(rowHasPathAndVHash({ path: "/", v_hash: "abc" })).toBe(true);
    expect(rowHasPathAndVHash({ path: "/", n: "new" })).toBe(false);
    expect(rowHasPathAndVHash({ v_hash: "abc", f: "2026-01-01" })).toBe(false);
  });

  it("hashes ids and returns null for no-id", async () => {
    expect(await visitorHashForEvent(undefined, "p")).toBeNull();
    expect(await visitorHashForEvent("a".repeat(32), "p")).toHaveLength(64);
  });

  it("rotates id after 90 days and keeps retention constants", () => {
    expect(DEFAULT_RETENTION_DAYS).toBe(90);
    expect(RATE_LIMIT_RETENTION_DAYS).toBe(2);
    expect(shouldRotateId("2026-01-01", "2026-01-01", 90)).toBe(false);
    expect(shouldRotateId("2026-01-01", "2026-04-01", 90)).toBe(true);
    expect(shouldRotateId(undefined, "2026-04-01", 90)).toBe(true);
    const now = Date.UTC(2026, 10, 19);
    const cutoff = now - DEFAULT_RETENTION_DAYS * 864e5;
    expect(new Date(cutoff).toISOString().slice(0, 10)).toBe("2026-08-21");
  });

  it("computes weekly from split tables", () => {
    const now = Date.now();
    const pageViews: PageViewRow[] = [
      { ts: now - 1000, day: "2026-11-19", path: "/", n: "new" },
      { ts: now - 900, day: "2026-11-19", path: "/contact/", n: "ret" },
    ];
    const visits: VisitRow[] = [
      { ts: now - 1000, day: "2026-11-19", v_hash: "v1", f: "2026-11-19", l: "2026-11-19", s: 1 },
      { ts: now - 900, day: "2026-11-19", v_hash: "v2", f: "2026-10-01", l: "2026-11-19", s: 1 },
    ];
    const clicks: ClickRow[] = [
      { ts: now - 800, day: "2026-11-19", event: "tel", v_hash: "v1", f: "2026-11-19", s: null },
      { ts: now - 700, day: "2026-11-19", event: "whatsapp", v_hash: "v2", f: "2026-10-01", s: null },
      { ts: now - 600, day: "2026-11-19", event: "google_review", v_hash: "v2", f: "2026-10-01", s: null },
    ];
    const leads: LeadRow[] = [{ ts: now - 500, day: "2026-11-19", n: "new" }];
    const stats = computeWeekly(pageViews, visits, clicks, leads, now - 7 * 864e5, now + 1, 90);
    expect(stats.uniqueVisitors).toBe(2);
    expect(stats.visits).toBe(2);
    expect(stats.clicks.tel.distinct).toBe(1);
    expect(stats.clicks.google_review.total).toBe(1);
    expect(stats.topPagesByViews[0].path).toBe("/");
    expect(stats.retentionDays).toBe(90);
    expect(weekOverWeekChange(10, 5)).toBe(100);
  });

  it("helpers", () => {
    expect(normalizePath("faq")).toBe("/faq/");
    expect(isAllowedPath("/en/tips/first-visit")).toBe(true);
    expect(isBot("Googlebot")).toBe(true);
    expect(originAllowed("https://menynu.github.io", "https://menynu.github.io")).toBe(true);
  });
});
