import { clinic } from "./config";
import { absoluteUrl, localePath } from "./paths";
import { mapsHref } from "./public";
import { roleTitle, type Locale } from "./role";

export type Crumb = { name: string; path: string };

type SchemaInput = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  kind: "home" | "contact" | "faq" | "article" | "page";
  breadcrumbs?: Crumb[];
  faq?: { q: string; a: string }[];
  article?: { title: string; description: string };
};

function languageTag(locale: Locale): string {
  return locale === "he" ? "he-IL" : "en";
}

export function buildSchema(input: SchemaInput) {
  const pageUrl = absoluteUrl(localePath(input.locale, input.path));
  const homeUrl = absoluteUrl("/");
  const clinicId = `${homeUrl}#clinic`;
  const websiteId = `${homeUrl}#website`;
  const spoken = clinic.spokenLanguages.map((code) => (code === "he" ? "he" : code));

  const doctorId = `${homeUrl}#doctor`;
  const roleHe = roleTitle("he");
  const roleEn = roleTitle("en");
  const clinicNode: Record<string, unknown> = {
    "@type": ["Dentist", "MedicalBusiness", "MedicalClinic"],
    "@id": clinicId,
    name: `${clinic.doctorNameHe} — ${clinic.clinicNameHe}`,
    alternateName: `${clinic.doctorNameEn} ${clinic.clinicNameEn}`,
    description:
      input.locale === "he"
        ? `${clinic.doctorNameHe}, ${roleHe} ב${clinic.cityHe}.`
        : `${clinic.doctorNameEn}, ${roleEn} in ${clinic.cityEn}.`,
    url: homeUrl,
    telephone: clinic.phoneSchema,
    medicalSpecialty: clinic.isRegisteredSpecialist
      ? ["https://schema.org/Pediatric", "https://schema.org/Dentistry"]
      : "https://schema.org/Dentistry",
    employee: { "@id": doctorId },
    image: absoluteUrl("/og.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.streetHe,
      addressLocality: clinic.cityHe,
      addressCountry: "IL",
      ...(clinic.postalCode ? { postalCode: clinic.postalCode } : {}),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinic.lat,
      longitude: clinic.lng,
    },
    areaServed: {
      "@type": "City",
      name: clinic.cityHe,
    },
    hasMap: mapsHref(),
    currenciesAccepted: "ILS",
    knowsLanguage: spoken,
  };

  if (clinic.email) clinicNode.email = clinic.email;
  if (clinic.hoursConfirmed) {
    clinicNode.openingHoursSpecification = clinic.hours
      .filter((row) => !row.closed && row.open && row.close)
      .map((row) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: englishDay(row.daysEn),
        opens: row.open,
        closes: row.close,
      }));
  }

  const sameAs = [clinic.social.facebook, clinic.social.instagram, clinic.social.googleBusiness].filter(Boolean);
  if (sameAs.length) clinicNode.sameAs = sameAs;

  const personNode: Record<string, unknown> = {
    "@type": "Person",
    "@id": doctorId,
    name: clinic.doctorNameHe,
    alternateName: clinic.doctorNameEn,
    jobTitle: [roleHe, roleEn],
    url: absoluteUrl(localePath("he", "/about/")),
    worksFor: { "@id": clinicId },
    knowsLanguage: spoken,
    telephone: clinic.phoneSchema,
    hasOccupation: {
      "@type": "Occupation",
      name: roleHe,
      alternateName: roleEn,
    },
  };
  if (clinic.isRegisteredSpecialist) {
    personNode.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "professional registration",
      name: roleHe,
      alternateName: roleEn,
      recognizedBy: {
        "@type": "GovernmentOrganization",
        name: "משרד הבריאות",
        alternateName: "Ministry of Health",
      },
    };
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: homeUrl,
      name: clinic.doctorNameHe,
      inLanguage: ["he-IL", "en"],
      publisher: { "@id": clinicId },
    },
    clinicNode,
    personNode,
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: input.title,
      description: input.description,
      inLanguage: languageTag(input.locale),
      isPartOf: { "@id": websiteId },
      about: { "@id": clinicId },
    },
  ];

  if (input.breadcrumbs && input.breadcrumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: input.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(localePath(input.locale, crumb.path)),
      })),
    });
  }

  if (input.kind === "faq" && input.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: input.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  if (input.kind === "article" && input.article) {
    graph.push({
      "@type": "Article",
      headline: input.article.title,
      description: input.article.description,
      inLanguage: languageTag(input.locale),
      datePublished: clinic.updatedAt,
      dateModified: clinic.updatedAt,
      mainEntityOfPage: pageUrl,
      author: { "@id": doctorId },
      publisher: { "@id": clinicId },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function englishDay(day: string): string {
  const map: Record<string, string> = {
    Sunday: "https://schema.org/Sunday",
    Monday: "https://schema.org/Monday",
    Tuesday: "https://schema.org/Tuesday",
    Wednesday: "https://schema.org/Wednesday",
    Thursday: "https://schema.org/Thursday",
    Friday: "https://schema.org/Friday",
    Saturday: "https://schema.org/Saturday",
  };
  return map[day] ?? day;
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
