import analytics from "../../site.analytics.mjs";

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function resolveAnalytics(env = process.env) {
  const cfBeaconToken = String(env.CF_BEACON_TOKEN ?? analytics.cfBeaconToken ?? "").trim();
  const gscVerification = String(env.GSC_VERIFICATION ?? analytics.gscVerification ?? "").trim();
  return { cfBeaconToken, gscVerification };
}

export function beaconEnabled(env = process.env) {
  return Boolean(resolveAnalytics(env).cfBeaconToken);
}

/** CSP fragment additions when the Cloudflare beacon is enabled. */
export function cloudflareCspExtras(env = process.env) {
  if (!beaconEnabled(env)) return { scriptSrc: [], connectSrc: [] };
  return {
    scriptSrc: ["https://static.cloudflareinsights.com"],
    connectSrc: ["https://cloudflareinsights.com", "https://static.cloudflareinsights.com"],
  };
}

/**
 * Build the site Content-Security-Policy string.
 * Cloudflare hosts are included only when cfBeaconToken is non-empty.
 */
export function buildContentSecurityPolicy(env = process.env) {
  const extras = cloudflareCspExtras(env);
  const scriptSrc = ["'self'", ...extras.scriptSrc].join(" ");
  const connectParts = extras.connectSrc.length
    ? ` connect-src 'self' ${extras.connectSrc.join(" ")};`
    : "";
  return (
    `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src ${scriptSrc};` +
    ` frame-src https://www.google.com https://maps.google.com; object-src 'none';` +
    ` base-uri 'self'; form-action 'self' https://formsubmit.co;${connectParts}`
  ).replace(/\s+/g, " ").trim();
}
