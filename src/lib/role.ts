import { clinic } from "./config";

export type Locale = "he" | "en";

/**
 * The registered-specialist title is rendered only when the config flag is on.
 * Keep the wording in this file so the public site stays free of it by default.
 */
export function roleTitle(locale: Locale): string {
  if (clinic.isRegisteredSpecialist) {
    return locale === "he"
      ? "מומחית לרפואת שיניים לילדים"
      : "Specialist in Pediatric Dentistry";
  }
  return locale === "he" ? "רופאת שיניים לילדים" : "pediatric dentist";
}
