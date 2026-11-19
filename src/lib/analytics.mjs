import analytics from "../../site.analytics.mjs";

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function resolveAnalytics(env = process.env) {
  const collectorUrl = String(env.COLLECTOR_URL ?? analytics.collectorUrl ?? "").trim().replace(/\/$/, "");
  const gscVerification = String(env.GSC_VERIFICATION ?? analytics.gscVerification ?? "").trim();
  return { collectorUrl, gscVerification };
}

export function collectorEnabled(env = process.env) {
  return Boolean(resolveAnalytics(env).collectorUrl);
}

/** CSP connect-src extras when a collector URL is configured. */
export function collectorCspExtras(env = process.env) {
  const { collectorUrl } = resolveAnalytics(env);
  if (!collectorUrl) return { connectSrc: [] };
  try {
    const origin = new URL(collectorUrl).origin;
    return { connectSrc: [origin] };
  } catch {
    return { connectSrc: [] };
  }
}

/**
 * Build the site Content-Security-Policy string.
 * Collector origin is included only when collectorUrl is non-empty.
 */
export function buildContentSecurityPolicy(env = process.env) {
  const extras = collectorCspExtras(env);
  const connectParts = extras.connectSrc.length
    ? ` connect-src 'self' ${extras.connectSrc.join(" ")};`
    : "";
  return (
    `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self';` +
    ` frame-src https://www.google.com https://maps.google.com; object-src 'none';` +
    ` base-uri 'self'; form-action 'self' https://formsubmit.co;${connectParts}`
  )
    .replace(/\s+/g, " ")
    .trim();
}
