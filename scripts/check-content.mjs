import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import analytics from "../site.analytics.mjs";
import clinic from "../clinic.config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const banned = [
  "מומחית",
  "מומחה",
  /\bspecialist\b/i,
  "הטובה ביותר",
  "הטוב ביותר",
  "מובטח",
  "ללא כאב",
  "לפני ואחרי",
  /before\s*\/\s*after/i,
  /before and after/i,
  /guaranteed/i,
  /painless/i,
];

const sourceSkip = new Set([
  path.normalize("src/lib/role.ts"),
  path.normalize("README.md"),
]);

async function filesIn(dir, acc = []) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".astro") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await filesIn(full, acc);
    else if (/\.(html|js|mjs|css|txt|xml|json|md|ts|astro|svg)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const allowedPhrases = clinic.isRegisteredSpecialist
  ? ["מומחית לרפואת שיניים לילדים", "Specialist in Pediatric Dentistry"]
  : [];

function stripAllowed(text) {
  let out = text;
  for (const phrase of allowedPhrases) out = out.split(phrase).join("");
  return out;
}

function hits(text, rule) {
  const source = stripAllowed(text);
  if (rule instanceof RegExp) return rule.test(source);
  return source.includes(rule);
}

const failures = [];

async function scan(dir, { allowSkip }) {
  const files = await filesIn(dir);
  for (const file of files) {
    const rel = path.relative(root, file);
    if (allowSkip && sourceSkip.has(path.normalize(rel))) continue;
    const text = await readFile(file, "utf8");
    for (const rule of banned) {
      if (hits(text, rule)) failures.push(`${rel} contains ${rule}`);
    }
    if (dir.endsWith("dist") && text.includes("{{")) {
      if (rel.endsWith(".html") || rel.endsWith(".js")) failures.push(`${rel} has an unfilled token`);
    }
  }
}

await scan(path.join(root, "src"), { allowSkip: true });
await scan(path.join(root, "public"), { allowSkip: true });
await scan(path.join(root, "marketing"), { allowSkip: true });
await scan(path.join(root, "clinic.config.mjs"), { allowSkip: true });
await scan(path.join(root, "dist"), { allowSkip: false });

const he = await readFile(path.join(root, "dist/index.html"), "utf8");
const en = await readFile(path.join(root, "dist/en/index.html"), "utf8");
if (!he.includes('lang="he"') || !he.includes('dir="rtl"')) failures.push("Hebrew home is not rtl");
if (!en.includes('lang="en"') || !en.includes('dir="ltr"')) failures.push("English home is not ltr");
if (!he.includes("Dentist") || !he.includes("MedicalClinic") || !he.includes("MedicalBusiness")) {
  failures.push("home is missing clinic schema");
}
if (!he.includes('"@type":"Person"') && !he.includes('"@type": "Person"')) {
  failures.push("home is missing the doctor Person schema");
}
if (!he.includes("חזקיהו המלך 36")) failures.push("home is missing the confirmed street");
if (!he.includes("רופאת שיניים לילדים בירושלים")) {
  failures.push("Hebrew home title or heading is missing the search phrase");
}
if (!/<h1[^>]*>רופאת שיניים לילדים בירושלים<\/h1>/.test(he)) {
  failures.push("Hebrew home H1 is not the search phrase");
}
if (!en.includes("Pediatric dentist in Jerusalem")) failures.push("English home is missing the search phrase");
if (!en.includes("Hezkiyahu HaMelech")) failures.push("English home is missing the confirmed street");
if (he.includes("עמק רפאים") || he.includes("Emek Refaim") || en.includes("Emek Refaim") || he.includes("Hizkiyahu")) {
  failures.push("a home page still mentions a rejected address");
}
if (!analytics.gscVerification && (he.includes("google-site-verification") || en.includes("google-site-verification"))) {
  failures.push("verification meta is present while site.analytics.mjs gscVerification is empty");
}
if (he.includes("cloudflareinsights") || en.includes("cloudflareinsights")) {
  failures.push("Cloudflare Web Analytics beacon must not be rendered");
}
if (!analytics.collectorUrl && (he.includes("mmb-cfg") || en.includes("mmb-cfg"))) {
  failures.push("mmb-cfg appears in HTML while site.analytics.mjs collectorUrl is empty");
}
const robots = await readFile(path.join(root, "dist/robots.txt"), "utf8");
if (!/^Sitemap:\s*https:\/\/\S+sitemap-index\.xml\s*$/m.test(robots)) {
  failures.push("robots.txt is missing a Sitemap line with an absolute sitemap-index.xml URL");
}
const sitemapIndex = await readFile(path.join(root, "dist/sitemap-index.xml"), "utf8").catch(() => "");
if (!sitemapIndex.includes("<sitemapindex") || !sitemapIndex.includes("https://")) {
  failures.push("sitemap-index.xml is missing or has no absolute https URLs");
}
if (clinic.isRegisteredSpecialist) {
  if (!he.includes("מומחית לרפואת שיניים לילדים")) failures.push("Hebrew home is missing the registered title");
  if (!en.includes("Specialist in Pediatric Dentistry")) failures.push("English home is missing the registered title");
}
if (clinic.addressConfirmed && (he.includes("לאשר את הכתובת") || en.includes("confirm the address"))) {
  failures.push("home still asks visitors to confirm the address");
}

const contact = await readFile(path.join(root, "dist/contact/index.html"), "utf8");
const contactEn = await readFile(path.join(root, "dist/en/contact/index.html"), "utf8");
if (!contact.includes("waze.com/ul?ll=")) failures.push("Hebrew contact is missing the Waze link");
if (!contact.includes("ניווט ב-Waze")) failures.push("Hebrew contact is missing the Waze label");
if (!contact.includes("ניווט ב-Google Maps")) failures.push("Hebrew contact is missing the Google Maps label");
if (!contact.includes("שליחת ניווט Waze לטלפון")) failures.push("Hebrew contact is missing the desktop Waze label");
if (!contact.includes("search.google.com/local/writereview?placeid=")) failures.push("Hebrew contact is missing the review link");
if (!contact.includes('id="waze-share-dialog"')) failures.push("Hebrew contact is missing the share dialog");
if (!contact.includes("המספר נשאר במכשיר הזה")) failures.push("Hebrew contact is missing the privacy note");
if (!contactEn.includes("Navigate with Waze")) failures.push("English contact is missing the Waze label");
if (!contactEn.includes("Send Waze to my phone")) failures.push("English contact is missing the desktop Waze label");
if (!contactEn.includes("Navigate with Google Maps")) failures.push("English contact is missing the Google Maps label");
if (contactEn.includes("formsubmit.co")) failures.push("English contact should keep the on-device form");
if (!contact.includes("https://formsubmit.co/meny205@gmail.com")) failures.push("Hebrew contact is missing the FormSubmit action");
if (!contact.includes("בקשה לשיחה חוזרת – אתר ממבר")) failures.push("Hebrew contact is missing the callback subject");
if (!contact.includes('name="_captcha" value="true"')) failures.push("Hebrew contact is missing the captcha field");
if (!contact.includes('name="_template" value="table"')) failures.push("Hebrew contact is missing the table template");
if (!contact.includes('name="_honey"')) failures.push("Hebrew contact is missing the honeypot");
if (!contact.includes("/contact/thanks/")) failures.push("Hebrew contact is missing the thank-you redirect");
if (!contact.includes("שם הורה")) failures.push("Hebrew contact is missing the parent label");
if (!contact.includes("גיל הילד/ה")) failures.push("Hebrew contact is missing the age label");
if (!contact.includes("זמן נוח לשיחה")) failures.push("Hebrew contact is missing the time label");
if (!contact.includes("אחה״צ")) failures.push("Hebrew contact is missing the afternoon option");
if (!contact.includes("אין צורך לפרט כאן מידע רפואי. נדבר על הכול בטלפון.")) failures.push("Hebrew contact is missing the medical note");
if (!contact.includes("אני מסכים/ה שהפרטים ישמשו רק לחזרה אליי לתיאום תור")) failures.push("Hebrew contact is missing the consent line");
if (!contact.includes("מקרה דחוף (חבלה בשיניים, דימום, נפיחות, קושי בנשימה או בבליעה)?")) failures.push("Hebrew contact is missing the urgent notice");
if (!contact.includes("tel:+97225611949") || !contact.includes("tel:101")) failures.push("Hebrew contact is missing the urgent phone links");
if (!contact.includes("חדר מיון")) failures.push("Hebrew contact urgent notice is missing the emergency room referral");
if (!contactEn.includes("Urgent (dental injury, bleeding, swelling, trouble breathing or swallowing)?")) failures.push("English contact is missing the urgent notice");
if (!contactEn.includes("tel:+97225611949") || !contactEn.includes("tel:101")) failures.push("English contact is missing the urgent phone links");
if (!contactEn.includes("emergency room")) failures.push("English contact urgent notice is missing the emergency room referral");
{
  const urgentBeforeHero = (html) => {
    const urgent = html.indexOf('class="urgent"');
    const heroArt = html.indexOf('class="hero-art"');
    return urgent !== -1 && heroArt !== -1 && urgent < heroArt;
  };
  if (!urgentBeforeHero(he)) failures.push("Hebrew home is missing an urgent notice before the hero art");
  if (!urgentBeforeHero(en)) failures.push("English home is missing an urgent notice before the hero art");
}
if (contact.includes("<textarea")) failures.push("Hebrew contact has a free-text field");
const thanks = await readFile(path.join(root, "dist/contact/thanks/index.html"), "utf8");
if (!thanks.includes('dir="rtl"')) failures.push("Thank-you page is not rtl");
if (!thanks.includes("noindex")) failures.push("Thank-you page should be noindex");
if (!thanks.includes("תודה, קיבלנו את הפנייה ונחזור אליכם בהקדם")) failures.push("Thank-you page is missing the confirmation");
const privacy = await readFile(path.join(root, "dist/privacy/index.html"), "utf8");
const privacyEn = await readFile(path.join(root, "dist/en/privacy/index.html"), "utf8");
if (!privacy.includes("FormSubmit")) failures.push("Hebrew privacy page does not describe the callback form");
if (!privacy.includes("Cloudflare") || !privacyEn.includes("Cloudflare")) {
  failures.push("privacy pages are missing the self-hosted measurement section");
}
if (!privacy.includes("2 ימים") || !privacyEn.includes("2 days")) {
  failures.push("privacy pages are missing the 2-day IP-hash retention note");
}
if (!privacy.includes("90 ימים") || !privacyEn.includes("90 days")) {
  failures.push("privacy pages are missing the 90-day retention note");
}
if (!privacy.includes("מזהה אקראי") || !privacyEn.includes("random identifier")) {
  failures.push("privacy pages must describe the rotating random identifier");
}
if (!privacy.includes("בשרת המונה") || !privacyEn.includes("The counter stores")) {
  failures.push("privacy pages must attribute storage to the counter, not 'we'");
}
if (!privacy.includes("בעלת מסד הנתונים") || !privacyEn.includes("database owner")) {
  failures.push("privacy measurement section must name the clinic as database owner");
}
if (!privacy.includes("באיחוד האירופי") || !privacyEn.includes("outside Israel (in the EU)")) {
  failures.push("privacy measurement section must note EU / abroad storage");
}
if (privacy.includes("אצלנו") || privacyEn.includes("We store")) {
  failures.push("privacy pages must not say 'אצלנו' / 'We store'");
}
if (!privacy.includes('data-mmb-optout') || !privacyEn.includes("data-mmb-optout")) {
  failures.push("privacy pages are missing the measurement opt-out toggle");
}
if (!he.includes("כתיבת ביקורת בגוגל")) failures.push("Hebrew home is missing the review call to action");
if (!en.includes("Write a Google review")) failures.push("English home is missing the review call to action");
if (he.includes("/dr-evelyn-mamber-site") && !process.env.GITHUB_PAGES_BASE) {
  failures.push("local build should not bake in the GitHub Pages base path");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("content checks passed");
