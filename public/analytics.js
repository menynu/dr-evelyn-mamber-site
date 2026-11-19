/**
 * Self-hosted cookieless counter (≤2KB minified).
 * Sends {e,p,v?,f?,l?,s?,n?} via sendBeacon when #mmb-cfg has u.
 * Click / opt-out wiring lives in site.js. Never throws from track().
 */
const O = "mmb_optout";
const E = {
  pageview: 1,
  tel: 1,
  whatsapp: 1,
  waze: 1,
  google_maps: 1,
  google_review: 1,
  callback_form_success: 1,
};

export function pagePath() {
  try {
    let p = location.pathname.split(/[?#]/)[0] || "/";
    let b;
    try {
      b = JSON.parse(document.getElementById("mmb-cfg").textContent).b;
    } catch {}
    if ((b = b || "/") !== "/") {
      if (b.endsWith("/")) b = b.slice(0, -1);
      if (p === b || p.startsWith(b + "/")) p = p.slice(b.length) || "/";
    }
    return p;
  } catch {
    return "/";
  }
}

function day() {
  return new Date().toISOString().slice(0, 10);
}

function priv() {
  try {
    return localStorage[O] == 1 || navigator.globalPrivacyControl || navigator.doNotTrack == 1;
  } catch {}
}

function store() {
  try {
    const o = JSON.parse(localStorage.mmb || 0);
    return o.id && o.f && o;
  } catch {}
}

function vid() {
  if (priv()) {
    try {
      localStorage.removeItem("mmb");
    } catch {}
    return;
  }
  const t = day();
  let o = store();
  if (o && o.id.length == 32) o.l = t;
  else {
    o = {
      id: [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, 0)).join(""),
      f: t,
      l: t,
    };
  }
  try {
    localStorage.mmb = JSON.stringify(o);
  } catch {}
  return o;
}

function post(b) {
  try {
    navigator.sendBeacon(
      JSON.parse(document.getElementById("mmb-cfg").textContent).u.replace(/\/$/, "") + "/e",
      new Blob([JSON.stringify(b)], { type: "text/plain" }),
    );
  } catch {}
}

function send(e, x) {
  if (!E[e]) return;
  const p = pagePath();
  // callback_form_success is the only allowed event longer than 14 chars
  if (e.length > 14) {
    const o = priv() ? 0 : store();
    return post({ e, p, n: !o || o.f == day() ? "new" : "ret" });
  }
  const b = { e, p, ...(x || {}) };
  const v = vid();
  if (v) {
    b.v = v.id;
    b.f = v.f;
    b.l = v.l;
  }
  post(b);
}

export function track(n, x) {
  try {
    const e = ("" + n).trim();
    if (!e) return;
    const d = { event: e, path: pagePath() };
    (window.__mamberEvents = window.__mamberEvents || []).push(d);
    if (e != "callback_submit" && E[e]) send(e, x);
  } catch {}
}

export function setAnalyticsOptOut(on) {
  try {
    if (on) {
      localStorage[O] = 1;
      localStorage.removeItem("mmb");
    } else localStorage.removeItem(O);
  } catch {}
}

export function isAnalyticsOptOut() {
  try {
    return localStorage[O] == 1;
  } catch {
    return false;
  }
}

export function setupAnalytics() {
  window.__mamberTrack = track;
  window.__mamberOptOut = setAnalyticsOptOut;
  window.__mamberIsOptOut = isAnalyticsOptOut;
  let s = 0;
  try {
    if (!sessionStorage.mmb_s) {
      sessionStorage.mmb_s = 1;
      s = 1;
    }
  } catch {}
  track("pageview", s ? { s: 1 } : 0);
  try {
    if (/thanks\/?$/.test(pagePath()) && sessionStorage.mmb_thanks != 1) {
      sessionStorage.mmb_thanks = 1;
      track("callback_form_success");
    }
  } catch {}
}
