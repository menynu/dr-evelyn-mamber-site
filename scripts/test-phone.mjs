import assert from "node:assert/strict";
import { isIsraeliPhone, phonePattern } from "../src/lib/phone.js";

const valid = [
  "02-5611949",
  "025611949",
  "03-1234567",
  "04-1234567",
  "08-1234567",
  "09-1234567",
  "02 561 1949",
  "(02) 5611949",
  "(02) 561-1949",
  "+972-2-5611949",
  "+972 2 5611949",
  "+97225611949",
  "972-2-5611949",
  "00972-2-5611949",
  "+972 (2) 561-1949",
  "050-1234567",
  "0501234567",
  "050 123 4567",
  "(050) 123-4567",
  "+972501234567",
  "+972-50-123-4567",
  "972501234567",
  "00972501234567",
  "  050-1234567  ",
  "051-2345678",
  "052-1234567",
  "053-1234567",
  "054-1234567",
  "055-1234567",
  "058-1234567",
  "072-1234567",
  "073-1234567",
  "074-1234567",
  "076-1234567",
  "077-1234567",
  "078-1234567",
  "079-1234567",
  "+972-72-1234567",
];

const invalid = [
  "",
  "   ",
  "123",
  "02-561194",
  "02-56119490",
  "050-123456",
  "050-12345678",
  "056-1234567",
  "057-1234567",
  "059-1234567",
  "070-1234567",
  "071-1234567",
  "075-1234567",
  "abc",
  "050-1234567 שלום",
  "+1 202-555-0123",
  "101",
  "*1234",
  "1-800-123-456",
];

const pattern = new RegExp(`^(?:${phonePattern})$`);
const patternV = new RegExp(`^(?:${phonePattern})$`, "v");

for (const input of valid) {
  assert.equal(isIsraeliPhone(input), true, input);
  assert.equal(pattern.test(input), true, `pattern ${input}`);
  assert.equal(patternV.test(input), true, `pattern v ${input}`);
}

for (const input of invalid) {
  assert.equal(isIsraeliPhone(input), false, input);
  assert.equal(pattern.test(input), false, `pattern ${input}`);
  assert.equal(patternV.test(input), false, `pattern v ${input}`);
}

console.log("phone checks passed");
