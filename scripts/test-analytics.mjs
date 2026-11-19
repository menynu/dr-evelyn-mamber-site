import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classifyLink, track, pagePath } from "../public/analytics.js";
import {
  beaconEnabled,
  buildContentSecurityPolicy,
  resolveAnalytics,
} from "../src/lib/analytics.mjs";
import analytics from "../site.analytics.mjs";

const root = path.resolve(import.meta.dirname, "..");

assert.equal(classifyLink("tel:+97225611949"), "tel");
assert.equal(classifyLink("https://wa.me/97225611949"), "whatsapp");
assert.equal(classifyLink("https://api.whatsapp.com/send?phone=97225611949"), "whatsapp");
assert.equal(classifyLink("https://waze.com/ul?ll=31.76,35.21&navigate=yes"), "waze");
assert.equal(classifyLink("https://www.waze.com/ul?ll=1,2"), "waze");
assert.equal(classifyLink("https://www.google.com/maps/dir/?api=1&destination=Jerusalem"), "google_maps");
assert.equal(classifyLink("https://maps.google.com/?q=Jerusalem"), "google_maps");
assert.equal(classifyLink("https://maps.app.goo.gl/abc"), "google_maps");
assert.equal(
  classifyLink("https://search.google.com/local/writereview?placeid=ChIJXbLbayXXAhURe7YL--N1iNA"),
  "google_review",
);
assert.equal(classifyLink("https://g.page/r/abc/review"), "google_review");
assert.equal(classifyLink("https://example.com/"), null);
assert.equal(classifyLink("#main"), null);

assert.equal(analytics.cfBeaconToken, "");
assert.equal(analytics.gscVerification, "");
assert.equal(beaconEnabled({}), false);
assert.equal(beaconEnabled({ CF_BEACON_TOKEN: "tok_test_123" }), true);
assert.deepEqual(resolveAnalytics({ CF_BEACON_TOKEN: "  abc  ", GSC_VERIFICATION: " ver " }), {
  cfBeaconToken: "abc",
  gscVerification: "ver",
});

const cspOff = buildContentSecurityPolicy({});
assert.equal(cspOff.includes("cloudflareinsights"), false);
const cspOn = buildContentSecurityPolicy({ CF_BEACON_TOKEN: "tok" });
assert.match(cspOn, /script-src[^;]*static\.cloudflareinsights\.com/);
assert.match(cspOn, /connect-src[^;]*cloudflareinsights\.com/);

if (typeof globalThis.CustomEvent !== "function") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.detail = init.detail;
    }
  };
}

const fakeWindow = new EventTarget();
fakeWindow.__mamberEvents = [];
globalThis.window = fakeWindow;
globalThis.location = { pathname: "/contact/", href: "https://example.test/contact/" };
const seen = [];
fakeWindow.addEventListener("mamber:track", (ev) => seen.push(ev.detail));
track("tel");
track("");
assert.deepEqual(fakeWindow.__mamberEvents, [{ event: "tel", path: "/contact/" }]);
assert.deepEqual(seen, [{ event: "tel", path: "/contact/" }]);
assert.equal(pagePath(), "/contact/");

const emptyHtml = await readFile(path.join(root, "dist/index.html"), "utf8").catch(() => "");
if (emptyHtml) {
  assert.equal(emptyHtml.includes("cloudflareinsights"), false, "empty token must not emit Cloudflare beacon");
  assert.equal(emptyHtml.includes("google-site-verification"), false, "empty GSC must not emit meta");
}

assert.equal(beaconEnabled({ CF_BEACON_TOKEN: "unit-token" }), true);

console.log("analytics tests passed");
