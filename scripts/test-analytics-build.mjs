/**
 * Builds a throwaway dist with CF_BEACON_TOKEN set and asserts the beacon
 * appears; then asserts the default empty-token dist does not.
 * Run after a normal `npm run build` (empty token) has produced dist/.
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
assert.equal(emptyHtml.includes('data-cf-beacon'), false);
assert.equal(emptyHtml.includes("google-site-verification"), false);

const tmp = await mkdtemp(path.join(os.tmpdir(), "mamber-analytics-"));
const distBackup = path.join(tmp, "dist-empty");
await cp(path.join(root, "dist"), distBackup, { recursive: true });

try {
  await run("npm", ["run", "build"], {
    CF_BEACON_TOKEN: "test-beacon-token-abcdef",
    GSC_VERIFICATION: "test-gsc-token-abcdef12",
  });
  const withToken = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.match(withToken, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  assert.match(withToken, /data-cf-beacon/);
  assert.match(withToken, /test-beacon-token-abcdef/);
  assert.match(withToken, /name="google-site-verification"/);
  assert.match(withToken, /content="test-gsc-token-abcdef12"/);

  const headers = await readFile(path.join(root, "public/_headers"), "utf8");
  assert.match(headers, /static\.cloudflareinsights\.com/);
  assert.match(headers, /connect-src[^\\n]*cloudflareinsights\.com/);
} finally {
  // Restore empty-token dist and headers for subsequent verify steps.
  await rm(path.join(root, "dist"), { recursive: true, force: true });
  await cp(distBackup, path.join(root, "dist"), { recursive: true });
  await run("node", ["scripts/write-security-headers.mjs"], {
    CF_BEACON_TOKEN: "",
    GSC_VERIFICATION: "",
  });
  await rm(tmp, { recursive: true, force: true });
}

console.log("analytics build tests passed");
