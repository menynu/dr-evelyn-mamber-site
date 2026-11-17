import raw from "../../clinic.config.mjs";

export type HourRow = {
  daysHe: string;
  daysEn: string;
  open?: string;
  close?: string;
  closed?: boolean;
};

export type Testimonial = {
  quoteHe: string;
  quoteEn: string;
  name: string;
  detailHe: string;
  detailEn: string;
};

export type ClinicConfig = {
  siteUrl: string;
  isRegisteredSpecialist: boolean;
  updatedAt: string;
  doctorNameHe: string;
  doctorNameEn: string;
  doctorShortHe: string;
  doctorShortEn: string;
  clinicNameHe: string;
  clinicNameEn: string;
  phoneDisplay: string;
  phoneTel: string;
  phoneSchema: string;
  whatsappNumber: string;
  whatsappReady: boolean;
  email: string;
  streetHe: string;
  streetEn: string;
  cityHe: string;
  cityEn: string;
  postalCode: string;
  hoursConfirmed: boolean;
  hours: HourRow[];
  hoursNoteHe: string;
  hoursNoteEn: string;
  healthFunds: string[];
  spokenLanguages: string[];
  showAffiliation: boolean;
  affiliationHe: string;
  affiliationEn: string;
  physicalAccessHe: string;
  physicalAccessEn: string;
  accessibilityCoordinator: string;
  licenseNumber: string;
  social: {
    facebook: string;
    instagram: string;
    googleBusiness: string;
    googleReview: string;
  };
  testimonials: Testimonial[];
};

function fail(message: string): never {
  throw new Error(`clinic.config.mjs: ${message}`);
}

function assertString(value: unknown, field: string) {
  if (typeof value !== "string") fail(`${field} צריך להיות טקסט`);
}

export function loadClinic(input: ClinicConfig): ClinicConfig {
  assertString(input.siteUrl, "siteUrl");
  if (!/^https:\/\/[^/\s]+$/.test(input.siteUrl)) {
    fail("siteUrl צריך להתחיל ב-https:// ובלי סלאש בסוף");
  }
  if (typeof input.isRegisteredSpecialist !== "boolean") {
    fail("isRegisteredSpecialist צריך להיות true או false");
  }
  if (typeof input.whatsappReady !== "boolean") fail("whatsappReady צריך להיות true או false");
  if (typeof input.hoursConfirmed !== "boolean") fail("hoursConfirmed צריך להיות true או false");
  if (typeof input.showAffiliation !== "boolean") fail("showAffiliation צריך להיות true או false");
  for (const field of [
    "doctorNameHe",
    "doctorNameEn",
    "phoneDisplay",
    "phoneTel",
    "streetHe",
    "streetEn",
    "cityHe",
    "cityEn",
    "hoursNoteHe",
    "hoursNoteEn",
  ] as const) {
    assertString(input[field], field);
    if (!input[field].trim()) fail(`${field} לא יכול להיות ריק`);
  }
  if (!Array.isArray(input.hours) || input.hours.length === 0) {
    fail("hours צריך להיות רשימה עם לפחות שורה אחת");
  }
  if (!Array.isArray(input.healthFunds)) fail("healthFunds צריך להיות רשימה");
  if (!Array.isArray(input.testimonials)) fail("testimonials צריך להיות רשימה");
  if (!/^\+?[0-9]+$/.test(input.phoneTel)) fail("phoneTel צריך להכיל ספרות וסימן + בלבד");
  if (input.whatsappNumber && !/^[0-9]+$/.test(input.whatsappNumber)) {
    fail("whatsappNumber צריך להיות ספרות בלבד, בלי + ובלי מקפים");
  }
  for (const item of input.testimonials) {
    for (const field of ["quoteHe", "quoteEn", "name", "detailHe", "detailEn"] as const) {
      if (typeof item[field] !== "string" || !item[field].trim()) {
        fail(`לכל המלצה צריך ${field}`);
      }
    }
  }
  return input;
}

export const clinic = loadClinic(raw as unknown as ClinicConfig);
