import { copyEn } from "./en";
import { copyHe } from "./he";
import faqJson from "../data/faq.json";
import { fillDeep } from "../lib/fill";
import { getVars } from "../lib/public";
import type { Locale } from "../lib/role";

export type Copy = typeof copyHe;

export type FaqEntry = {
  id: string;
  topic: string;
  keywords: string[];
  q: string;
  a: string;
  href?: string;
};

export type FaqPack = {
  ui: Record<string, string>;
  quickReplies: { id: string; label: string }[];
  emergencyKeywords: string[];
  entries: FaqEntry[];
};

const faq = faqJson as { he: FaqPack; en: FaqPack };

export function getCopy(locale: Locale): Copy {
  const source = locale === "en" ? copyEn : copyHe;
  return fillDeep(source, getVars(locale));
}

export function getFaq(locale: Locale): FaqPack {
  return fillDeep(faq[locale], getVars(locale));
}

export function articleSlugs(): string[] {
  return copyHe.articles.map((article) => article.slug);
}
