import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
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
if (he.includes("wa.me/97225611949") || en.includes("wa.me/97225611949")) {
  failures.push("a home page links WhatsApp to the landline");
}
if (!clinic.googleSiteVerification && (he.includes("google-site-verification") || en.includes("google-site-verification"))) {
  failures.push("verification meta is present while the config token is empty");
}
if (clinic.isRegisteredSpecialist) {
  if (!he.includes("מומחית לרפואת שיניים לילדים")) failures.push("Hebrew home is missing the registered title");
  if (!en.includes("Specialist in Pediatric Dentistry")) failures.push("English home is missing the registered title");
}
if (clinic.addressConfirmed && (he.includes("לאשר את הכתובת") || en.includes("confirm the address"))) {
  failures.push("home still asks visitors to confirm the address");
}
if (clinic.whatsappReady === false && he.includes("https://wa.me/97225611949")) {
  failures.push("Hebrew home still publishes the landline as WhatsApp");
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
