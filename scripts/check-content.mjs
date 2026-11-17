import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

function hits(text, rule) {
  if (rule instanceof RegExp) return rule.test(text);
  return text.includes(rule);
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
if (!he.includes("Dentist") || !he.includes("MedicalClinic")) failures.push("home is missing clinic schema");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("content checks passed");
