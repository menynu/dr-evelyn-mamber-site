import assert from "node:assert/strict";
import faq from "../src/data/faq.json" with { type: "json" };
import { answerById, answerQuestion } from "../public/bot-core.js";

const cases = [
  ["he", "מתי אתם פתוחים?", "hours"],
  ["he", "מה הכתובת של המרפאה", "address"],
  ["he", "אפשר לקבוע תור בוואטסאפ", "booking"],
  ["he", "מתי מגיעים לביקור הראשון?", "first-visit"],
  ["he", "הילד נחבל בשיניים ויש דם", "emergency"],
  ["he", "כאב חזק אחרי מכה", "emergency"],
  ["he", "כואב לו קצת כשמצחצחים", "pain"],
  ["he", "כמה זה עולה", "payment"],
  ["he", "יש חניה לעגלה?", "access"],
  ["he", "ניווט בוייז", "address"],
  ["he", "אפשר לכתוב ביקורת בגוגל", "review"],
  ["he", "שלום, מה נשמע היום", "fallback"],
  ["en", "what are your opening hours", "hours"],
  ["en", "where are you located", "address"],
  ["en", "I want to book a visit", "booking"],
  ["en", "my child is scared of the dentist", "fearful"],
  ["en", "a permanent tooth was knocked out", "emergency"],
  ["en", "how much does a visit cost", "payment"],
  ["en", "can I get directions in waze", "address"],
  ["en", "how do I write a google review", "review"],
  ["en", "hello there", "fallback"],
];

for (const [locale, message, expected] of cases) {
  const result = answerQuestion(message, faq[locale]);
  assert.equal(result.id, expected, `${locale}: "${message}" → ${result.id}, expected ${expected}`);
}

assert.equal(answerById("emergency", faq.he).id, "emergency");
assert.equal(answerById("hours", faq.en).emergency, false);
assert.match(answerById("emergency", faq.he).text, /אינו|לא ייעוץ|לא ייעוץ רפואי|אינו ייעוץ|לא ייעוץ/);
assert.match(answerQuestion("", faq.he).text, /אינו ייעוץ|אינו ייעוץ רפואי|אינו/);

const quick = faq.he.quickReplies.map((item) => item.label);
assert.deepEqual(quick, ["שעות פעילות", "כתובת / ניווט", "קביעת תור", "ביקור ראשון", "מקרה חירום", "ביקורת בגוגל"]);

console.log(`bot tests passed (${cases.length} questions)`);
