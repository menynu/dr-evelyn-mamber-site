import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { classifyLink } from "../public/link-classify.js";
import { track } from "../public/analytics.js";
import {
  collectorEnabled,
  buildContentSecurityPolicy,
  resolveAnalytics,
} from "../src/lib/analytics.mjs";
import analytics from "../site.analytics.mjs";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);

assert.equal(classifyLink("tel:+97225611949"), "tel");
assert.equal(classifyLink("https://wa.me/97225611949"), "whatsapp");
assert.equal(classifyLink("https://api.whatsapp.com/send?phone=97225611949"), "whatsapp");
assert.equal(classifyLink("https://waze.com/ul?ll=31.76,35.21&navigate=yes"), "waze");
assert.equal(classifyLink("https://www.google.com/maps/dir/?api=1&destination=Jerusalem"), "google_maps");
assert.equal(
  classifyLink("https://search.google.com/local/writereview?placeid=ChIJXbLbayXXAhURe7YL--N1iNA"),
  "google_review",
);
assert.equal(classifyLink("https://example.com/"), null);

assert.equal(analytics.collectorUrl, "");
assert.equal(analytics.gscVerification, "");
assert.equal("cfBeaconToken" in analytics, false);
assert.equal(collectorEnabled({}), false);
assert.equal(collectorEnabled({ COLLECTOR_URL: "https://mmb.example.workers.dev/" }), true);
assert.deepEqual(resolveAnalytics({ COLLECTOR_URL: " https://mmb.example.workers.dev/ ", GSC_VERIFICATION: " ver " }), {
  collectorUrl: "https://mmb.example.workers.dev",
  gscVerification: "ver",
});

const cspOff = buildContentSecurityPolicy({});
assert.equal(cspOff.includes("cloudflareinsights"), false);
assert.equal(cspOff.includes("connect-src"), false);
const cspOn = buildContentSecurityPolicy({ COLLECTOR_URL: "https://mmb.example.workers.dev" });
assert.match(cspOn, /connect-src 'self' https:\/\/mmb\.example\.workers\.dev/);
assert.equal(cspOn.includes("static.cloudflareinsights.com"), false);

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
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
};
track("tel");
track("callback_submit");
assert.deepEqual(fakeWindow.__mamberEvents, [
  { event: "tel", path: "/contact/" },
  { event: "callback_submit", path: "/contact/" },
]);


const emptyHtml = await readFile(path.join(root, "dist/index.html"), "utf8").catch(() => "");
if (emptyHtml) {
  assert.equal(emptyHtml.includes("cloudflareinsights"), false);
  assert.equal(emptyHtml.includes("mmb-cfg"), false);
  assert.equal(emptyHtml.includes("google-site-verification"), false);
}

// Client size budget: esbuild-minified analytics.js ≤ 2KiB
const src = await readFile(path.join(root, "public/analytics.js"), "utf8");
let minified;
try {
  const esbuild = require("esbuild");
  minified = (await esbuild.transform(src, { loader: "js", minify: true, format: "esm" })).code;
} catch {
  const r = spawnSync("npx", ["esbuild", path.join(root, "public/analytics.js"), "--minify", "--format=esm"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  minified = r.stdout;
}
const bytes = Buffer.byteLength(minified, "utf8");
assert.ok(bytes <= 2048, `analytics client minified size ${bytes} > 2048`);
console.log(`analytics client minified size: ${bytes} bytes`);

// Worker unit tests
const workerDir = path.join(root, "analytics-worker");
let vitest = spawnSync("npx", ["vitest", "run"], { cwd: workerDir, encoding: "utf8" });
if (vitest.status !== 0) {
  spawnSync("npm", ["install"], { cwd: workerDir, encoding: "utf8", stdio: "inherit" });
  vitest = spawnSync("npx", ["vitest", "run"], { cwd: workerDir, encoding: "utf8" });
}
assert.equal(vitest.status, 0, vitest.stdout + vitest.stderr);

console.log("analytics tests passed");
