/**
 * Playwright: option C cookieless counter (mocked collector).
 * COLLECTOR_URL=https://mmb-test.example.workers.dev npm run build
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const PORT = Number(process.env.PORT || 4393);
const COLLECTOR = "https://mmb-test.example.workers.dev";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".png": "image/png",
};

function server(rootDir) {
  return createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const file = path.join(rootDir, urlPath);
      if (!file.startsWith(rootDir)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
}

async function withPage(browser, pathName, fn, init) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: pathName.includes("/en/") ? "en-US" : "he-IL",
  });
  if (init) await init(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  const beacons = [];
  await page.route(`${COLLECTOR}/**`, async (route) => {
    beacons.push({ body: route.request().postData() || "" });
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto(`http://127.0.0.1:${PORT}${pathName}`, { waitUntil: "networkidle" });
  await fn(page, beacons, errors);
  await context.close();
}

function bodies(beacons) {
  return beacons
    .map((b) => {
      try {
        return JSON.parse(b.body);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function assertClean(obj) {
  assert.equal("href" in obj, false);
  assert.equal("phone" in obj, false);
  for (const v of Object.values(obj)) {
    if (typeof v === "string") {
      assert.equal(v.includes("tel:"), false);
      assert.equal(v.includes("?"), false);
    }
  }
}

const srv = server(dist);
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch({ args: ["--no-sandbox"] });

try {
  await withPage(browser, "/", async (page, beacons) => {
    await page.waitForTimeout(200);
    const pv = bodies(beacons).find((b) => b.e === "pageview");
    assert.ok(pv && pv.s === 1 && pv.p === "/" && pv.v && pv.f && pv.l && pv.n);
    assertClean(pv);
    const mmb = JSON.parse(await page.evaluate(() => localStorage.getItem("mmb")));
    assert.equal(mmb.id.length, 32);
    assert.ok(mmb.c);
  });

  await withPage(browser, "/en/contact/", async (page, beacons) => {
    await page.waitForTimeout(100);
    const before = beacons.length;
    await page.evaluate(() =>
      document.querySelector('a[href^="tel:"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    await page.waitForTimeout(150);
    const tel = bodies(beacons.slice(before)).find((b) => b.e === "tel");
    assert.ok(tel);
    assert.equal("p" in tel, false, "clicks must not send path");
    assert.ok(tel.v);
    assertClean(tel);
  });

  await withPage(browser, "/contact/thanks/", async (page, beacons) => {
    await page.waitForTimeout(200);
    const thanks = bodies(beacons).filter((b) => b.e === "callback_form_success");
    assert.equal(thanks.length, 1);
    assert.equal("v" in thanks[0], false);
    assert.equal("p" in thanks[0], false);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    assert.equal(bodies(beacons).filter((b) => b.e === "callback_form_success").length, 1);
  });

  // Id rotation after 90 days resets id, c, f, and l (no first-visit linkage)
  await withPage(
    browser,
    "/",
    async (page, beacons) => {
      await page.waitForTimeout(200);
      const today = new Date().toISOString().slice(0, 10);
      const mmb = JSON.parse(await page.evaluate(() => localStorage.getItem("mmb")));
      const pv = bodies(beacons).find((b) => b.e === "pageview");
      assert.notEqual(mmb.id, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
      assert.equal(mmb.f, today);
      assert.equal(mmb.l, today);
      assert.equal(mmb.c, today);
      assert.equal(pv.v, mmb.id);
      assert.equal(pv.f, today);
      assert.equal(pv.n, "new");
    },
    async (ctx) => {
      await ctx.addInitScript(() => {
        localStorage.setItem(
          "mmb",
          JSON.stringify({ id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", f: "2026-01-01", l: "2026-01-01", c: "2026-01-01" }),
        );
      });
    },
  );

  await withPage(
    browser,
    "/",
    async (page, beacons) => {
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => localStorage.getItem("mmb")), null);
      const pv = bodies(beacons).find((b) => b.e === "pageview");
      assert.equal("v" in pv, false);
      assert.equal(pv.n, "new");
    },
    async (ctx) => {
      await ctx.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true });
      });
    },
  );

  await withPage(browser, "/privacy/", async (page, beacons) => {
    await page.locator("[data-mmb-optout]").click();
    assert.equal(await page.locator("[data-mmb-optout]").getAttribute("aria-pressed"), "true");
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => localStorage.getItem("mmb")), null);
    assert.ok(bodies(beacons).some((b) => b.e === "pageview" && !("v" in b)));
  });

  {
    const context = await browser.newContext();
    const page = await context.newPage();
    const hits = [];
    await page.route(`${COLLECTOR}/**`, async (route) => {
      hits.push(1);
      await route.fulfill({ status: 204 });
    });
    await page.setContent(`<!doctype html><html><body><script type="module">
      import { setupAnalytics, track } from "http://127.0.0.1:${PORT}/analytics.js";
      setupAnalytics(); track("tel");
    </script></body></html>`);
    await page.waitForTimeout(300);
    assert.equal(hits.length, 0);
    await context.close();
  }

  async function axeAndLayout(page, label, errors) {
    await page.setViewportSize({ width: 320, height: 720 });
    assert.equal(
      await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > 321),
      false,
      label,
    );
    try {
      await page.addScriptTag({ path: path.join(root, "node_modules/axe-core/axe.min.js") });
      const results = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ["violations"] }));
      assert.equal(results.violations.length, 0, JSON.stringify(results.violations));
      console.log(`axe 0 on ${label}`);
    } catch (e) {
      if (!String(e).includes("ENOENT")) throw e;
    }
    assert.deepEqual(errors, [], errors.join("|"));
  }

  for (const p of ["/privacy/", "/en/privacy/", "/contact/thanks/", "/en/contact/thanks/"]) {
    await withPage(browser, p, (page, _b, errors) => axeAndLayout(page, p, errors));
  }

  console.log("playwright analytics checks passed");
} finally {
  await browser.close();
  srv.close();
}
