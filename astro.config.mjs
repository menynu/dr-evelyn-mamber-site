import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import clinic from "./clinic.config.mjs";

const pagesBase = process.env.GITHUB_PAGES_BASE?.trim();

export default defineConfig({
  site: clinic.siteUrl,
  ...(pagesBase ? { base: pagesBase } : {}),
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  i18n: {
    defaultLocale: "he",
    locales: ["he", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "he",
        locales: {
          he: "he-IL",
          en: "en",
        },
      },
      filter: (page) => !page.includes("/404") && !page.includes("/contact/thanks"),
      lastmod: new Date(`${clinic.updatedAt}T00:00:00.000Z`),
      serialize(item) {
        const links = item.links?.map((link) => ({ ...link }));
        if (links && !links.some((link) => link.lang === "x-default")) {
          const hebrew = links.find((link) => link.lang === "he-IL");
          if (hebrew) links.push({ lang: "x-default", url: hebrew.url });
        }
        return links ? { ...item, links } : item;
      },
    }),
  ],
});
