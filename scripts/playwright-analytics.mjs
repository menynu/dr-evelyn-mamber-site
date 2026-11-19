/**
 * Playwright checks for the cookieless counter (mocked collector).
 * Run after: COLLECTOR_URL=https://mmb-test.example.workers.dev npm run build
 * and a static server on PORT (default 4392).
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
    const req = route.request();
    let body = "";
    try {
      body = req.postData() || "";
    } catch {}
    beacons.push({ url: req.url(), method: req.method(), body });
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto(`http://127.0.0.1:${PORT}${pathName}`, { waitUntil: "networkidle" });
  await fn(page, beacons, errors);
  await context.close();
  return { beacons, errors };
}

function parseBodies(beacons) {
  return beacons.map((b) => {
    try {
      return JSON.parse(b.body);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function assertCleanPayload(obj) {
  const s = JSON.stringify(obj);
  assert.equal(/href|tel:\+|wa\.me|phone/i.test(s) && "phone" in obj, false);
  assert.equal("href" in obj, false);
  assert.equal("phone" in obj, false);
  for (const v of Object.values(obj)) {
    if (typeof v === "string") {
      assert.equal(v.includes("tel:"), false);
      assert.equal(v.includes("wa.me"), false);
      assert.equal(v.includes("?"), false);
      assert.equal(v.includes("#"), false);
    }
  }
}

const srv = server(dist);
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  args: ["--no-sandbox"],
});

try {
  // HE home: pageview with s=1 and visitor id
  await withPage(browser, "/", async (page, beacons) => {
    await page.waitForTimeout(200);
    const bodies = parseBodies(beacons);
    assert.ok(bodies.some((b) => b.e === "pageview" && b.s === 1 && b.v && b.f && b.l && b.p === "/"));
    bodies.forEach(assertCleanPayload);
  });

  // EN contact: click tel without href/phone in payload
  await withPage(browser, "/en/contact/", async (page, beacons) => {
    await page.waitForTimeout(100);
    const before = beacons.length;
    await page.locator('a[href^="tel:"]').first().click({ modifiers: ["Alt"] }).catch(async () => {
      await page.evaluate(() => {
        const a = document.querySelector('a[href^="tel:"]');
        a?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    });
    await page.waitForTimeout(150);
    const bodies = parseBodies(beacons.slice(before));
    const tel = bodies.find((b) => b.e === "tel");
    assert.ok(tel, "expected tel event");
    assert.equal(tel.p, "/en/contact/");
    assertCleanPayload(tel);
  });

  // Thanks page: callback_form_success once, without v
  await withPage(browser, "/contact/thanks/", async (page, beacons) => {
    await page.waitForTimeout(200);
    const bodies = parseBodies(beacons);
    const thanks = bodies.filter((b) => b.e === "callback_form_success");
    assert.equal(thanks.length, 1);
    assert.equal("v" in thanks[0], false);
    assert.ok(thanks[0].n === "new" || thanks[0].n === "ret");
    assert.equal(thanks[0].p, "/contact/thanks/");
    assertCleanPayload(thanks[0]);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const after = parseBodies(beacons).filter((b) => b.e === "callback_form_success");
    assert.equal(after.length, 1, "thanks conversion once per session");
  });

  await withPage(browser, "/en/contact/thanks/", async (page, beacons) => {
    await page.waitForTimeout(200);
    const thanks = parseBodies(beacons).filter((b) => b.e === "callback_form_success");
    assert.equal(thanks.length, 1);
    assert.equal("v" in thanks[0], false);
    assert.equal(thanks[0].p, "/en/contact/thanks/");
  });

  // Empty collector: no beacon requests when mmb-cfg is absent
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    const hits = [];
    await page.route(`${COLLECTOR}/**`, async (route) => {
      hits.push(route.request().url());
      await route.fulfill({ status: 204 });
    });
    await page.setContent(`<!doctype html><html><body>
      <script type="module">
        import { setupAnalytics, track } from "http://127.0.0.1:${PORT}/analytics.js";
        setupAnalytics();
        track("tel");
      </script>
    </body></html>`);
    await page.waitForTimeout(300);
    assert.equal(hits.length, 0, "no collector requests without mmb-cfg");
    await context.close();
  }

  // GPC: no id created
  await withPage(
    browser,
    "/",
    async (page, beacons) => {
      await page.waitForTimeout(200);
      const id = await page.evaluate(() => localStorage.getItem("mmb"));
      assert.equal(id, null);
      const bodies = parseBodies(beacons);
      assert.ok(bodies.some((b) => b.e === "pageview" && !("v" in b)));
    },
    async (ctx) => {
      await ctx.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true });
      });
    },
  );

  // Opt-out toggle: creates no id after opting out
  await withPage(browser, "/privacy/", async (page, beacons) => {
    const btn = page.locator("[data-mmb-optout]");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click();
    assert.equal(await btn.getAttribute("aria-pressed"), "true");
    const flag = await page.evaluate(() => localStorage.getItem("mmb_optout"));
    assert.equal(flag, "1");
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const id = await page.evaluate(() => localStorage.getItem("mmb"));
    assert.equal(id, null);
    const bodies = parseBodies(beacons);
    assert.ok(bodies.some((b) => b.e === "pageview" && !("v" in b)));
  });

  // Empty collector: rebuild check is separate; here assert no beacon when cfg missing on a synthetic page
  // Covered by unit/build tests when collectorUrl empty.

  async function axeAndLayout(page, label, errors) {
    await page.setViewportSize({ width: 320, height: 720 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return Math.max(doc.scrollWidth, document.body.scrollWidth) > 320 + 1;
    });
    assert.equal(overflow, false, `320px overflow on ${label}`);
    const axePath = path.join(root, "node_modules/axe-core/axe.min.js");
    try {
      await page.addScriptTag({ path: axePath });
      const results = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ["violations"] }));
      assert.equal(results.violations.length, 0, `${label}: ${JSON.stringify(results.violations, null, 2)}`);
      console.log(`axe 0 on ${label}`);
    } catch (e) {
      if (String(e).includes("ENOENT")) console.warn(`axe-core missing; skipped on ${label}`);
      else throw e;
    }
    assert.deepEqual(errors, [], `${label} console errors: ${errors.join(" | ")}`);
  }

  for (const pathName of ["/privacy/", "/en/privacy/", "/contact/thanks/", "/en/contact/thanks/"]) {
    await withPage(browser, pathName, async (page, _b, errors) => {
      await axeAndLayout(page, pathName, errors);
      if (pathName.includes("privacy")) {
        const pressed = await page.locator("[data-mmb-optout]").getAttribute("aria-pressed");
        assert.ok(pressed === "true" || pressed === "false");
      }
      if (pathName === "/en/contact/thanks/") {
        const text = await page.locator(".lede").innerText();
        assert.match(text, /If you sent the WhatsApp message/);
        assert.match(await page.locator(".urgent").innerText(), /Urgent/);
      }
    });
  }

  console.log("playwright analytics checks passed");
} finally {
  await browser.close();
  srv.close();
}
