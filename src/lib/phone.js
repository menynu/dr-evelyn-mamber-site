/**
 * Israeli phone numbers for a callback: geographic, mobile, and VoIP.
 * Accepts local 0… and international 972 / +972 / 00972, with spaces,
 * hyphens, dots, and parentheses. Rejects letters and non-Israeli numbers.
 */

// Parentheses inside character classes are escaped so the HTML pattern
// attribute stays valid under Chrome's `v` flag (unicodeSets).
const phonePattern =
  "\\s*(?:\\(\\s*)?(?:(?:\\+|00)?972[\\s\\-.\\(\\)]*|0)(?:[23489]|5[0-58]|7[2-46-9])\\s*\\)?(?:[\\s\\-.\\(\\)]*\\d){7}\\s*";

export { phonePattern };

export function isIsraeliPhone(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return false;
  if (/[^\d\s()+.\-]/.test(raw)) return false;
  if (!new RegExp(`^(?:${phonePattern})$`).test(raw)) return false;

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00972")) digits = digits.slice(2);
  if (digits.startsWith("972")) digits = `0${digits.slice(3)}`;

  return /^(?:0[23489]\d{7}|05[0-58]\d{7}|07[2-46-9]\d{7})$/.test(digits);
}
