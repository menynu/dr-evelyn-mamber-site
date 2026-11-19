/** Paths the clinic site may report (with and without trailing slash normalized). */
export const ALLOWED_PATHS = new Set([
  "/",
  "/about/",
  "/accessibility/",
  "/contact/",
  "/contact/thanks/",
  "/faq/",
  "/privacy/",
  "/services/",
  "/tips/",
  "/tips/first-visit/",
  "/tips/brushing-by-age/",
  "/tips/knocked-out-tooth/",
  "/en/",
  "/en/about/",
  "/en/accessibility/",
  "/en/contact/",
  "/en/contact/thanks/",
  "/en/faq/",
  "/en/privacy/",
  "/en/services/",
  "/en/tips/",
  "/en/tips/first-visit/",
  "/en/tips/brushing-by-age/",
  "/en/tips/knocked-out-tooth/",
]);

export const ALLOWED_EVENTS = new Set([
  "pageview",
  "tel",
  "whatsapp",
  "waze",
  "google_maps",
  "google_review",
  "callback_form_success",
]);

export function normalizePath(path: string): string {
  let p = String(path || "/").split("?")[0].split("#")[0] || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && !p.endsWith("/")) p = `${p}/`;
  return p;
}

export function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.has(normalizePath(path));
}
