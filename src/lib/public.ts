import { clinic } from "./config";
import type { Locale } from "./role";
import { roleTitle } from "./role";

export function addressLine(locale: Locale): string {
  return locale === "he"
    ? `${clinic.streetHe}, ${clinic.cityHe}`
    : `${clinic.streetEn}, ${clinic.cityEn}`;
}

export function hoursText(locale: Locale): string {
  if (!clinic.hoursConfirmed) {
    return locale === "he" ? clinic.hoursNoteHe : clinic.hoursNoteEn;
  }
  return clinic.hours
    .map((row) => {
      const days = locale === "he" ? row.daysHe : row.daysEn;
      if (row.closed) return locale === "he" ? `${days}: סגור` : `${days}: closed`;
      return `${days}: ${row.open}–${row.close}`;
    })
    .join(" · ");
}

export function fundsText(locale: Locale): string {
  if (clinic.healthFunds.length === 0) {
    return locale === "he"
      ? "רשימת קופות החולים לא פורסמה באתר, כדי לא למסור מידע שלא אושר. את ההסדר בודקים בטלפון לפני הביקור."
      : "Health-fund arrangements are not listed here until they are confirmed. Please check by phone before the visit.";
  }
  const list = clinic.healthFunds.join(", ");
  return locale === "he"
    ? `לפי הפרטים שנמסרו לאתר, יש הסדר מול: ${list}. כדאי לאשר בטלפון לפני הביקור, כי ההסדרים משתנים.`
    : `The details given to this site list arrangements with: ${list}. Please confirm by phone before the visit, because arrangements change.`;
}

export function accessText(locale: Locale): string {
  const custom = locale === "he" ? clinic.physicalAccessHe : clinic.physicalAccessEn;
  if (custom.trim()) return custom;
  return locale === "he"
    ? "פרטי חניה, מעלית וגישה עם עגלה או כיסא גלגלים עדיין לא פורסמו כאן. שאלו בטלפון כשאתם קובעים תור."
    : "Parking, elevator, and step-free access are not published here yet. Ask when you call to schedule.";
}

export function getVars(locale: Locale): Record<string, string> {
  return {
    doctor: locale === "he" ? clinic.doctorNameHe : clinic.doctorNameEn,
    doctorShort: locale === "he" ? clinic.doctorShortHe : clinic.doctorShortEn,
    role: roleTitle(locale),
    clinic: locale === "he" ? clinic.clinicNameHe : clinic.clinicNameEn,
    phone: clinic.phoneDisplay,
    address: addressLine(locale),
    city: locale === "he" ? clinic.cityHe : clinic.cityEn,
    hours: hoursText(locale),
    funds: fundsText(locale),
    access: accessText(locale),
    email: clinic.email,
  };
}

export function whatsappNumber(): string {
  if (!clinic.whatsappReady) return "";
  return clinic.whatsappNumber.replace(/\D/g, "");
}

export function whatsappHref(text = ""): string {
  const number = whatsappNumber();
  if (!number) return "";
  const base = `https://wa.me/${number}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function hasCoordinates(): boolean {
  return Number.isFinite(clinic.lat) && Number.isFinite(clinic.lng);
}

export function reviewHref(): string {
  const primary = clinic.googleReviewUrl.trim();
  if (primary) return primary;
  return clinic.social.googleReview.trim();
}

export function googlePlaceId(): string {
  const source = reviewHref();
  if (!source) return "";
  try {
    const url = new URL(source);
    return url.searchParams.get("placeid") || url.searchParams.get("place_id") || "";
  } catch {
    return "";
  }
}

/** Waze deep link. Coordinates when we have them; otherwise the street address. */
export function wazeHref(): string {
  if (hasCoordinates()) {
    return `https://waze.com/ul?ll=${clinic.lat},${clinic.lng}&navigate=yes`;
  }
  const query = `${clinic.streetHe}, ${clinic.cityHe}`;
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}

/**
 * Google Maps directions.
 * With a Place ID, the destination is the street address and the id locks the listing.
 * Without one, coordinates are used, then the street address.
 */
export function mapsDirectionsHref(): string {
  const address = `${clinic.streetEn}, ${clinic.cityEn}`;
  const placeId = googlePlaceId();
  const params = new URLSearchParams({ api: "1", destination: address });
  if (placeId) {
    params.set("destination_place_id", placeId);
  } else if (hasCoordinates()) {
    params.set("destination", `${clinic.lat},${clinic.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function mapsHref(): string {
  const address = `${clinic.streetEn}, ${clinic.cityEn}`;
  const params = new URLSearchParams({ api: "1", query: address });
  const placeId = googlePlaceId();
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function mapsEmbedSrc(): string {
  const query = hasCoordinates() ? `${clinic.lat},${clinic.lng}` : `${addressLine("he")}, ישראל`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=he&z=17&output=embed`;
}

export function mailtoHref(subject: string, body: string): string {
  if (!clinic.email) return "";
  return `mailto:${clinic.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
