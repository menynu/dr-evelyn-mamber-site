/**
 * Cookieless conversion hooks.
 * Cloudflare Web Analytics does not support custom events (docs FAQ: "Not yet").
 * track() records { event, path } on window.__mamberEvents and dispatches
 * CustomEvent('mamber:track') so a cookieless backend (e.g. Zaraz without cookies,
 * or a small worker) can be plugged in later. No cookies, no localStorage IDs,
 * no href/phone/form values. Never throws; never blocks navigation.
 */

/**
 * @param {string} href
 * @returns {string | null}
 */
export function classifyLink(href) {
  if (!href) return null;
  const raw = String(href).trim();
  if (!raw || raw.startsWith("#")) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith("tel:")) return "tel";

  let url;
  try {
    url = new URL(raw, typeof location !== "undefined" ? location.href : "https://example.invalid/");
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host === "wa.me" || host === "api.whatsapp.com") return "whatsapp";
  if (host === "waze.com" || host.endsWith(".waze.com")) return "waze";

  if (
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    (host === "google.com" && path.startsWith("/maps")) ||
    (host === "goo.gl" && path.startsWith("/maps"))
  ) {
    return "google_maps";
  }

  if (
    (host === "search.google.com" && path.includes("writereview")) ||
    host === "g.page" ||
    host.endsWith(".g.page") ||
    (host === "google.com" && /\/maps\/.*reviews?/i.test(path + url.search))
  ) {
    return "google_review";
  }

  return null;
}

export function pagePath() {
  try {
    const path = typeof location !== "undefined" ? location.pathname || "/" : "/";
    return path.split("?")[0].split("#")[0] || "/";
  } catch {
    return "/";
  }
}

/**
 * @param {string} name
 */
export function track(name) {
  try {
    const event = String(name || "")
      .trim()
      .slice(0, 64);
    if (!event) return;
    const path = pagePath();
    const payload = { event, path };
    const w = typeof window !== "undefined" ? window : undefined;
    if (!w) return;
    if (!Array.isArray(w.__mamberEvents)) w.__mamberEvents = [];
    w.__mamberEvents.push(payload);
    w.dispatchEvent(new CustomEvent("mamber:track", { detail: payload }));
  } catch {
    // never throw
  }
}

/**
 * Wire delegated click + successful callback form submit listeners.
 * Safe to call once from site.js.
 */
export function setupAnalytics() {
  try {
    if (typeof window !== "undefined") window.__mamberTrack = track;
  } catch {
    // never throw
  }

  document.addEventListener(
    "click",
    (event) => {
      try {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest("a[href]");
        if (!(anchor instanceof HTMLAnchorElement)) return;
        const kind = classifyLink(anchor.href);
        if (kind) track(kind);
      } catch {
        // never throw
      }
    },
    true,
  );

  document.addEventListener(
    "submit",
    (event) => {
      try {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (!form.matches("[data-callback-form]")) return;
        // CallbackForm validates first (registered earlier). If it called
        // preventDefault, this is a validation failure — do not count.
        if (event.defaultPrevented) return;
        track("callback_submit");
      } catch {
        // never throw
      }
    },
    false,
  );
}
