import assert from "node:assert/strict";
import {
  normalizeIsraeliMobile,
  sendNavigationLink,
  shareText,
  smsShareUrl,
  whatsappShareUrl,
} from "../public/nav-share.js";

const valid = [
  ["050-1234567", "972501234567"],
  ["0501234567", "972501234567"],
  ["050 123 4567", "972501234567"],
  ["(050) 123-4567", "972501234567"],
  ["+972501234567", "972501234567"],
  ["972501234567", "972501234567"],
  ["972-50-123-4567", "972501234567"],
  ["00972501234567", "972501234567"],
  ["0512345678", "972512345678"],
  ["052-1234567", "972521234567"],
  ["053-1234567", "972531234567"],
  ["054-1234567", "972541234567"],
  ["055-1234567", "972551234567"],
  ["058-1234567", "972581234567"],
];

for (const [input, expected] of valid) {
  const result = normalizeIsraeliMobile(input);
  assert.equal(result.ok, true, input);
  assert.equal(result.e164, expected, input);
}

for (const input of ["", "   ", "02-5611949", "03-1234567", "050-123456", "050-12345678", "057-1234567", "059-1234567", "abc", "050-123-4567 שלום", "+1 202-555-0123"]) {
  const result = normalizeIsraeliMobile(input);
  assert.equal(result.ok, false, input);
  assert.equal(result.code, input.trim() ? "invalid" : "empty", input);
}

assert.equal(whatsappShareUrl("972501234567", "שלום"), "https://wa.me/972501234567?text=%D7%A9%D7%9C%D7%95%D7%9D");
assert.equal(smsShareUrl("972501234567", "a b"), "sms:+972501234567?body=a%20b");
assert.equal(smsShareUrl("972501234567", "a b", { ios: true }), "sms:+972501234567&body=a%20b");
assert.equal(
  shareText("ניווט ([[address]]): [[wazeUrl]]", "חזקיהו המלך 36, ירושלים", "https://waze.com/ul?ll=1,2&navigate=yes"),
  "ניווט (חזקיהו המלך 36, ירושלים): https://waze.com/ul?ll=1,2&navigate=yes",
);

const client = await sendNavigationLink({
  number: "050-1234567",
  channel: "whatsapp",
  text: "ניווט https://waze.com/ul?ll=1,2&navigate=yes",
  mode: "client",
  transport: { post: () => Promise.reject(new Error("client mode must not call the server")) },
});
assert.equal(client.ok, true);
assert.equal(client.via, "client");
assert.match(client.url, /^https:\/\/wa\.me\/972501234567\?text=/);
assert.equal(client.url.includes("972501234567"), true);

const sms = await sendNavigationLink({
  number: "+972 52-1234567",
  channel: "sms",
  text: "hello",
  mode: "client",
});
assert.equal(sms.url, "sms:+972521234567?body=hello");

let posted = null;
const api = await sendNavigationLink({
  number: "058-1234567",
  channel: "sms",
  text: "link",
  mode: "api",
  endpoint: "https://example.com/send",
  transport: {
    post: async (endpoint, payload) => {
      posted = { endpoint, payload };
    },
  },
});
assert.equal(api.ok, true);
assert.equal(api.via, "api");
assert.equal(api.url, undefined);
assert.deepEqual(posted, {
  endpoint: "https://example.com/send",
  payload: { to: "972581234567", channel: "sms", text: "link" },
});

const missing = await sendNavigationLink({
  number: "050-1234567",
  channel: "whatsapp",
  text: "link",
  mode: "api",
  endpoint: "",
});
assert.equal(missing.ok, false);
assert.equal(missing.code, "no-endpoint");

const bad = await sendNavigationLink({ number: "02-5611949", channel: "whatsapp", text: "x", mode: "client" });
assert.equal(bad.ok, false);
assert.equal(bad.code, "invalid");

console.log("nav share tests passed");
