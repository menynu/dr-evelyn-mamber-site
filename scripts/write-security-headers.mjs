/**
 * Regenerates public/_headers and the CSP line in vercel.json from
 * site.analytics.mjs. Cloudflare hosts appear in CSP only when the beacon
 * token is non-empty (so an empty token never allows those origins).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildContentSecurityPolicy } from "../src/lib/analytics.mjs";

const root = path.resolve(import.meta.dirname, "..");
const csp = buildContentSecurityPolicy();

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: ${csp}
`;

writeFileSync(path.join(root, "public/_headers"), headers, "utf8");

const vercelPath = path.join(root, "vercel.json");
const vercel = JSON.parse(readFileSync(vercelPath, "utf8"));
const cspHeader = vercel.headers?.[0]?.headers?.find((h) => h.key === "Content-Security-Policy");
if (cspHeader) {
  cspHeader.value = csp;
  writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, "utf8");
}

console.log(`security headers written (beacon CSP ${csp.includes("cloudflareinsights") ? "on" : "off"})`);
