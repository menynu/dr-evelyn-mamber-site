import { clinic } from "./config";
import type { Locale } from "./role";
import { roleTitle } from "./role";

export function addressLine(locale: Locale): string {
  return locale === "he"
    ? `${clinic.streetHe}, ${clinic.cityHe}`
    : `${clinic.streetEn}, ${clinic.cityEn}`;
}

/** Empty once the street is confirmed. Shown only while addressConfirmed is false. */
export function addressStatus(locale: Locale): string {
  if (clinic.addressConfirmed) return "";
  return locale === "he"
    ? "הכתובת באתר עדיין ממתינה לאישור. לפני הביקור כדאי לאשר אותה בטלפון. "
    : "The address on this site is still waiting for confirmation. Please confirm it by phone before the visit. ";
}

export function bookHow(locale: Locale): string {
  const phone = clinic.phoneDisplay;
  if (locale === "he") {
    return `אפשר להתקשר ל־${phone}, או להשאיר בעמוד «צור קשר» בקשה לשיחה חוזרת: שם הורה, טלפון, גיל הילד או הילדה, וזמן נוח לשיחה. אין צורך לכתוב פרטים רפואיים.`;
  }
  if (clinic.whatsappReady) {
    return `Call ${phone} or send a WhatsApp message. A name, phone number, the child's age, and a preferred time are enough. Please don't include medical details.`;
  }
  return `WhatsApp is not available on this site yet, because there is no mobile number. Call ${phone}. A parent's name, the child's age, and a preferred time are enough. Please don't include medical details.`;
}

function formChannel(locale: Locale): string {
  const wa = clinic.whatsappReady && clinic.whatsappNumber;
  const email = clinic.email.trim();
  if (locale === "he") {
    return "אני מסכים/ה שהפרטים ישמשו רק לחזרה אליי לתיאום תור";
  }
  if (wa && email) {
    return "The message will include only the name, phone number, child's age, and preferred time. Sending opens WhatsApp or email on my device, and the website does not store the details.";
  }
  if (wa) {
    return "The message will include only the name, phone number, child's age, and preferred time. Sending opens WhatsApp on my device, and the website does not store the details.";
  }
  if (email) {
    return "The message will include only the name, phone number, child's age, and preferred time. Sending opens email on my device, and the website does not store the details.";
  }
  return "The button calls the clinic. The website does not store what was typed, and it does not send it.";
}

function formPrivacy(locale: Locale): string {
  const wa = clinic.whatsappReady && clinic.whatsappNumber;
  const email = clinic.email.trim();
  if (locale === "he") {
    return "השליחה מעבירה את הפרטים לשירות FormSubmit, והוא שולח אותם בדוא״ל למפעיל האתר, שמעביר אותם למרפאה. האתר אינו שומר עותק. אחרי השליחה נפתח עמוד אימות של FormSubmit, ואחר כך עמוד תודה באתר. האתר אינו מוסיף עוגיות שיווק.";
  }
  if (wa && email) {
    return "Send opens WhatsApp or email on your device. From that moment the conversation is with that provider, under their policy, and it is not stored on this site.";
  }
  if (wa) {
    return "Send opens WhatsApp on your device. From that moment the conversation is with WhatsApp, under their policy, and it is not stored on this site.";
  }
  if (email) {
    return "Send opens email on your device. From that moment the conversation is with that provider, under their policy, and it is not stored on this site.";
  }
  return "The button calls the clinic. The website does not store what was typed and does not send it.";
}

export function contactTitle(locale: Locale): string {
  const canSend = (clinic.whatsappReady && clinic.whatsappNumber) || clinic.email.trim();
  if (locale === "he") return "מתקשרים, או מבקשים שיחה חוזרת";
  return canSend ? "Call, or send booking details" : "Call to book a visit";
}

export function contactLede(locale: Locale): string {
  const canSend = (clinic.whatsappReady && clinic.whatsappNumber) || clinic.email.trim();
  if (locale === "he") {
    return "בטופס יש רק שם הורה, טלפון, גיל הילד או הילדה, וזמן נוח לשיחה. אין שדה למידע רפואי. הפרטים נשלחים בדוא״ל למפעיל האתר, שמעביר אותם למרפאה, והאתר לא שומר עותק.";
  }
  if (canSend) {
    return "The form asks only for a parent's name, a phone number, the child's age, and a preferred time. There is no medical field, and the site does not store what you type.";
  }
  return "Call the clinic to arrange a time. The form asks only for a parent's name, a phone number, the child's age, and a preferred time. The button places a call, and the site does not send or store what you type.";
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
    addressStatus: addressStatus(locale),
    bookHow: bookHow(locale),
    formChannel: formChannel(locale),
    formPrivacy: formPrivacy(locale),
    contactTitle: contactTitle(locale),
    contactLede: contactLede(locale),
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
