/**
 * הגדרות מדידה ואימות חיפוש — נפרד מ־clinic.config.mjs.
 * ריק = כבוי (אין סקריפט Cloudflare ואין תגית Search Console).
 *
 * איך להפעיל (אחרי אישור מני):
 * 1. cfBeaconToken — מ־Cloudflare Dashboard → Web Analytics → Manage site → JS snippet token.
 * 2. gscVerification — מ־Google Search Console → הוספת נכס → תגית HTML → רק ערך content.
 * אפשר גם דרך משתני סביבה בבנייה: CF_BEACON_TOKEN, GSC_VERIFICATION (לדריסה זמנית בבדיקות).
 *
 * Cloudflare Web Analytics אינו תומך באירועים מותאמים (custom events) נכון ל־2026;
 * אירועי ההמרה באתר נשלחים ל־window.__mamberEvents + CustomEvent('mamber:track') בלבד.
 */

const analytics = {
  cfBeaconToken: "",
  gscVerification: "",
};

export default analytics;
