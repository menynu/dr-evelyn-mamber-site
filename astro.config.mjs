import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import clinic from "./clinic.config.mjs";

export default defineConfig({
  site: clinic.siteUrl,
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
      filter: (page) => !page.includes("/404"),
    }),
  ],
});
