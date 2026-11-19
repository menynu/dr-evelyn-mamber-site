/** Click channel classifier (tel / WhatsApp / Waze / Maps / review). */
export function classifyLink(href) {
  if (!href) return null;
  const r = String(href).trim().toLowerCase();
  if (!r || r[0] === "#") return null;
  if (r.startsWith("tel:")) return "tel";
  if (/wa\.me\/|api\.whatsapp\.com/.test(r)) return "whatsapp";
  if (/waze\.com/.test(r)) return "waze";
  if (/maps\.(google|app\.goo)|google\.com\/maps|goo\.gl\/maps/.test(r)) return "google_maps";
  if (/writereview|\.g\.page|\/\/g\.page/.test(r)) return "google_review";
  return null;
}
