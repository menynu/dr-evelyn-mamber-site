const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

export function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[״"'`׳]/g, "")
    .replace(/[ךםןףץ]/g, (char) => FINALS[char] || char)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hits(text, term) {
  if (!term) return false;
  if (/[a-z]/i.test(term) && !term.includes(" ")) {
    return new RegExp(`(?:^|\\s)${term}(?:\\s|$)`).test(text);
  }
  return text.includes(term);
}

export function answerById(id, pack) {
  const entry = pack.entries.find((item) => item.id === id);
  if (!entry) return { id: "fallback", text: pack.ui.fallback, emergency: false };
  return {
    id: entry.id,
    text: entry.a,
    href: entry.href || "",
    emergency: entry.id === "emergency",
  };
}

export function answerQuestion(message, pack) {
  const text = normalize(message);
  if (!text) return { id: "empty", text: pack.ui.fallback, emergency: false, href: "" };

  const urgent = (pack.emergencyKeywords || []).some((keyword) => hits(text, normalize(keyword)));
  if (urgent) return answerById("emergency", pack);

  let best = null;
  let bestScore = 0;
  for (const entry of pack.entries) {
    if (entry.id === "emergency") continue;
    let score = 0;
    for (const keyword of entry.keywords) {
      const normalized = normalize(keyword);
      if (hits(text, normalized)) score += normalized.length;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < 3) {
    return { id: "fallback", text: pack.ui.fallback, emergency: false, href: "" };
  }
  return { id: best.id, text: best.a, href: best.href || "", emergency: false };
}
