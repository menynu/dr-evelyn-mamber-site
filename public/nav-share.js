/**
 * Sending a Waze link from a desktop browser to an Israeli mobile.
 *
 * mode "client" (default): the number never leaves this browser except inside
 * the wa.me or sms: link the visitor chooses to open. Nothing is stored.
 *
 * mode "api": POST { to, channel, text } to navShareEndpoint. Plug in a
 * serverless SMS/WhatsApp provider later by setting navShareMode to "api"
 * and navShareEndpoint to that function. Pass a custom transport.post in tests.
 */

const MOBILE_PREFIXES = new Set(["50", "51", "52", "53", "54", "55", "58"]);

export function normalizeIsraeliMobile(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, code: "empty" };
  if (/[^\d\s()+.-]/.test(raw)) return { ok: false, code: "invalid" };

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00972")) digits = digits.slice(2);
  if (digits.startsWith("972")) {
    // already international
  } else if (digits.startsWith("0")) {
    digits = `972${digits.slice(1)}`;
  } else if (/^5\d{8}$/.test(digits)) {
    digits = `972${digits}`;
  } else {
    return { ok: false, code: "invalid" };
  }

  if (!/^9725\d{8}$/.test(digits)) return { ok: false, code: "invalid" };
  const prefix = digits.slice(3, 5);
  if (!MOBILE_PREFIXES.has(prefix)) return { ok: false, code: "invalid" };
  return { ok: true, e164: digits };
}

export function shareText(template, address, wazeUrl) {
  return String(template || "")
    .replaceAll("[[address]]", address)
    .replaceAll("[[wazeUrl]]", wazeUrl);
}

export function whatsappShareUrl(e164, text) {
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}

export function smsShareUrl(e164, text, { ios = false } = {}) {
  const separator = ios ? "&" : "?";
  return `sms:+${e164}${separator}body=${encodeURIComponent(text)}`;
}

/**
 * Desktop when the primary pointer can hover, or when the user agent is a
 * desktop OS and the pointer is not a coarse touch screen.
 * Keep the inline copy in Base.astro in sync with this function.
 */
export function isDesktopNavigation() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return true;
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)) return false;
  return /Windows NT|Macintosh|Linux|CrOS|X11/i.test(ua);
}

export async function sendNavigationLink({
  number,
  channel,
  text,
  mode = "client",
  endpoint = "",
  ios = false,
  transport,
}) {
  const normalized = normalizeIsraeliMobile(number);
  if (!normalized.ok) return normalized;

  const safeChannel = channel === "sms" ? "sms" : "whatsapp";
  if (mode === "api") {
    if (!endpoint) return { ok: false, code: "no-endpoint" };
    const payload = { to: normalized.e164, channel: safeChannel, text };
    try {
      if (transport?.post) {
        await transport.post(endpoint, payload);
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) return { ok: false, code: "api" };
      }
    } catch {
      return { ok: false, code: "api" };
    }
    return { ok: true, via: "api", channel: safeChannel };
  }

  const url =
    safeChannel === "sms"
      ? smsShareUrl(normalized.e164, text, { ios })
      : whatsappShareUrl(normalized.e164, text);
  return { ok: true, via: "client", channel: safeChannel, url };
}
