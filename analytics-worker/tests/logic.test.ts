import { describe, expect, it } from "vitest";
import {
  computeWeekly,
  isBot,
  originAllowed,
  parseBody,
  RATE_LIMIT_RETENTION_DAYS,
  sha256Hex,
  visitorHashForEvent,
  weekOverWeekChange,
  type EventRow,
} from "../src/logic";
import { isAllowedPath, normalizePath } from "../src/paths";

describe("parseBody", () => {
  it("accepts a pageview with visitor id", () => {
    const raw = JSON.stringify({
      e: "pageview",
      p: "/contact/",
      v: "a".repeat(32),
      f: "2026-11-19",
      l: "2026-11-19",
      s: 1,
    });
    const r = parseBody(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.e).toBe("pageview");
      expect(r.event.p).toBe("/contact/");
      expect(r.event.s).toBe(1);
    }
  });

  it("rejects oversized bodies and unknown events", () => {
    expect(parseBody("x".repeat(513)).ok).toBe(false);
    expect(parseBody(JSON.stringify({ e: "hack", p: "/" })).ok).toBe(false);
  });

  it("requires n and forbids v for callback_form_success", () => {
    expect(parseBody(JSON.stringify({ e: "callback_form_success", p: "/contact/thanks/", n: "new" })).ok).toBe(
      true,
    );
    expect(
      parseBody(JSON.stringify({ e: "callback_form_success", p: "/contact/thanks/", v: "a".repeat(32), n: "new" }))
        .ok,
    ).toBe(false);
  });

  it("rejects disallowed paths", () => {
    expect(parseBody(JSON.stringify({ e: "pageview", p: "/admin/" })).ok).toBe(false);
  });
});

describe("helpers", () => {
  it("normalizes and allowlists paths", () => {
    expect(normalizePath("faq")).toBe("/faq/");
    expect(isAllowedPath("/en/tips/first-visit")).toBe(true);
    expect(isAllowedPath("/secret")).toBe(false);
  });

  it("detects bots and origins", () => {
    expect(isBot("Mozilla/5.0")).toBe(false);
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(originAllowed("https://menynu.github.io", "https://menynu.github.io,http://127.0.0.1:4392")).toBe(true);
    expect(originAllowed("https://evil.test", "https://menynu.github.io")).toBe(false);
  });

  it("computes weekly metrics and wow", () => {
    const now = Date.now();
    const rows: EventRow[] = [
      { ts: now - 1000, day: "2026-11-19", event: "pageview", path: "/", v_hash: "v1", f: "2026-11-19", l: "2026-11-19", s: 1, n: null },
      { ts: now - 900, day: "2026-11-19", event: "tel", path: "/", v_hash: "v1", f: "2026-11-19", l: "2026-11-19", s: null, n: null },
      { ts: now - 800, day: "2026-11-19", event: "pageview", path: "/contact/", v_hash: "v2", f: "2026-10-01", l: "2026-11-19", s: 1, n: null },
      { ts: now - 700, day: "2026-11-19", event: "whatsapp", path: "/contact/", v_hash: "v2", f: "2026-10-01", l: "2026-11-19", s: null, n: null },
      // no-id events (v_hash NULL) must not invent an IP-derived identity in metrics
      { ts: now - 600, day: "2026-11-19", event: "pageview", path: "/privacy/", v_hash: null, f: null, l: null, s: 1, n: null },
      { ts: now - 500, day: "2026-11-19", event: "callback_form_success", path: "/contact/thanks/", v_hash: null, f: null, l: null, s: null, n: "new" },
    ];
    const start = now - 7 * 24 * 60 * 60 * 1000;
    const stats = computeWeekly(rows, start, now + 1);
    expect(stats.uniqueVisitors).toBe(2);
    expect(stats.visits).toBe(3);
    expect(stats.clicks.tel.total).toBe(1);
    expect(stats.leads.distinct).toBe(2);
    expect(stats.leads.total).toBe(3);
    expect(weekOverWeekChange(10, 5)).toBe(100);
  });

  it("stores NULL v_hash for no-id events and never hashes IP into events", async () => {
    expect(RATE_LIMIT_RETENTION_DAYS).toBe(2);
    expect(await visitorHashForEvent(undefined, "pepper")).toBeNull();
    expect(await visitorHashForEvent("", "pepper")).toBeNull();
    const id = "a".repeat(32);
    const hashed = await visitorHashForEvent(id, "pepper");
    expect(hashed).toBe(await sha256Hex(`pepper|${id}`));
    expect(hashed).not.toMatch(/noid|ip/i);
  });
});
