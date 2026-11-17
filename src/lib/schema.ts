import { clinic } from "./config";
import { absoluteUrl, localePath } from "./paths";
import { mapsHref } from "./public";
import type { Locale } from "./role";

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

  const clinicNode: Record<string, unknown> = {
    "@type": ["Dentist", "MedicalClinic"],
    "@id": clinicId,
    name: `${clinic.doctorNameHe} — ${clinic.clinicNameHe}`,
    alternateName: `${clinic.doctorNameEn} ${clinic.clinicNameEn}`,
    description:
      input.locale === "he"
        ? `${clinic.doctorNameHe}, רופאת שיניים לילדים ב${clinic.cityHe}.`
        : `${clinic.doctorNameEn}, pediatric dentist in ${clinic.cityEn}.`,
    url: homeUrl,
    telephone: clinic.phoneSchema,
    medicalSpecialty: "http://schema.org/Dentistry",
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
      author: {
        "@type": "Organization",
        name: clinic.doctorNameHe,
        url: homeUrl,
      },
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
