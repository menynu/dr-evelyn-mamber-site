/**
 * Builds with COLLECTOR_URL + GSC set and asserts config/CSP appear;
 * restores empty-token dist afterwards.
 */
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      err += d;
    });
    child.on("exit", (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} ${args.join(" ")} failed (${code}):\n${err || out}`));
    });
  });
}

const emptyHtml = await readFile(path.join(root, "dist/index.html"), "utf8");
assert.equal(emptyHtml.includes("cloudflareinsights"), false);
assert.equal(emptyHtml.includes("mmb-cfg"), false);
assert.equal(emptyHtml.includes("google-site-verification"), false);

const tmp = await mkdtemp(path.join(os.tmpdir(), "mamber-analytics-"));
const distBackup = path.join(tmp, "dist-empty");
await cp(path.join(root, "dist"), distBackup, { recursive: true });

try {
  await run("npm", ["run", "build"], {
    COLLECTOR_URL: "https://mmb-test.example.workers.dev",
    GSC_VERIFICATION: "test-gsc-token-abcdef12",
  });
  const withToken = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.equal(withToken.includes("cloudflareinsights"), false);
  assert.match(withToken, /id="mmb-cfg"/);
  assert.match(withToken, /mmb-test\.example\.workers\.dev/);
  assert.match(withToken, /name="google-site-verification"/);
  assert.match(withToken, /content="test-gsc-token-abcdef12"/);

  const headers = await readFile(path.join(root, "public/_headers"), "utf8");
  assert.match(headers, /connect-src 'self' https:\/\/mmb-test\.example\.workers\.dev/);
  assert.equal(headers.includes("cloudflareinsights"), false);
} finally {
  await rm(path.join(root, "dist"), { recursive: true, force: true });
  await cp(distBackup, path.join(root, "dist"), { recursive: true });
  await run("node", ["scripts/write-security-headers.mjs"], {
    COLLECTOR_URL: "",
    GSC_VERIFICATION: "",
  });
  await rm(tmp, { recursive: true, force: true });
}

console.log("analytics build tests passed");
