/**
 * הגדרות מדידה ואימות חיפוש — נפרד מ־clinic.config.mjs.
 * ריק = כבוי (אין שליחה למונה, אין תגית Search Console).
 *
 * איך להפעיל (אחרי אישור מני + ציות + עו״ד):
 * 1. collectorUrl — כתובת ה־Worker המלאה בלי סלאש בסוף, למשל https://mmb-analytics.example.workers.dev
 * 2. gscVerification — מ־Google Search Console → תגית HTML → רק ערך content.
 * משתני סביבה בבנייה: COLLECTOR_URL, GSC_VERIFICATION.
 */

const analytics = {
  collectorUrl: "",
  gscVerification: "",
};

export default analytics;
