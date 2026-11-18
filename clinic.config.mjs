/**
 * ============================================================
 *  הקובץ היחיד לעריכת פרטי המרפאה
 *  עורכים רק את הערכים. לא מוחקים פסיקים, סוגריים או גרשיים.
 *  אחרי שמירה צריך לבנות מחדש את האתר (ראו README).
 *
 *  מה כבר אושר, ומה עדיין פתוח:
 *  1. כתובת: אושרה — חזקיהו המלך 36, ירושלים. addressConfirmed הוא true.
 *  2. שעות: hoursConfirmed נשאר false עד שיש לוח שאושר.
 *     השעות למטה הן מציין מקום בלבד ולא מוצגות באתר.
 *  3. וואטסאפ: 02-5611949 הוא מספר קווי. לא בטוח שהוא מחובר לוואטסאפ.
 *  4. דוא״ל, קופות חולים, חניה ונגישות פיזית — ריקים בכוונה.
 *  5. הזיקה לאוניברסיטה העברית–הדסה: לאשר ניסוח מדויק.
 *  6. isRegisteredSpecialist הוא true. התואר המוצג הוא רק
 *     «מומחית לרפואת שיניים לילדים». בלי «הכי» ובלי הבטחות.
 *  7. כתובת האתר siteUrl.
 *  8. המלצות: להשאיר מערך ריק. לא ממציאים ציטוטים.
 *  9. googleSiteVerification נשאר ריק עד שמדביקים קוד מ-Search Console.
 * ============================================================
 */

const clinic = {
  // דומיין GitHub Pages, כולל https, בלי סלאש ובלי שם המאגר.
  // הכתובת המלאה היא https://menynu.github.io/dr-evelyn-mamber-site/
  // בדומיין פרטי מחליפים לכתובת החדשה ומוחקים את GITHUB_PAGES_BASE מה-workflow.
  siteUrl: "https://menynu.github.io",

  // true רק עם רישום מומחיות בתוקף במשרד הבריאות.
  // האתר מציג אז רק «מומחית לרפואת שיניים לילדים».
  isRegisteredSpecialist: true,

  updatedAt: "2026-11-18",

  // קוד content של תגית Google Search Console. ריק = אין תגית meta.
  // מדביקים רק את הערך, בלי <meta> ובלי מרכאות.
  googleSiteVerification: "",

  doctorNameHe: "ד״ר אוולין ממבר",
  doctorNameEn: "Dr. Evelyn Mamber",
  doctorShortHe: "ד״ר ממבר",
  doctorShortEn: "Dr. Mamber",
  clinicNameHe: "מרפאת שיניים לילדים",
  clinicNameEn: "Pediatric Dental Clinic",

  phoneDisplay: "02-5611949",
  phoneTel: "+97225611949",
  phoneSchema: "+972-2-561-1949",

  // TODO: מספר נייד שמחובר לוואטסאפ, ספרות בלבד, בלי + ובלי מקפים.
  // לדוגמה: 972501234567
  // הערך הנוכחי הוא המספר הקווי בפורמט בינלאומי, וייתכן שאינו מקבל וואטסאפ.
  whatsappNumber: "97225611949",
  whatsappReady: true,

  // TODO: כתובת דוא״ל אמיתית. ריק = אין כפתור דוא״ל.
  email: "",

  // אושר על ידי מני: חזקיהו המלך 36, ירושלים.
  addressConfirmed: true,
  streetHe: "חזקיהו המלך 36",
  streetEn: "36 Hezkiyahu HaMelech Street",
  cityHe: "ירושלים",
  cityEn: "Jerusalem",
  // TODO: מיקוד. ריק = לא מוצג.
  postalCode: "",

  // נעץ הבניין חזקיהו המלך 36 לפי OpenStreetMap (צומת הבית).
  // הנעץ של אותו כרטיס במפות גוגל יושב כמה מטרים משם (כ־31.76167, 35.21011).
  // אם הכניסה למרפאה במקום אחר, מעדכנים את שני המספרים.
  lat: 31.7616196,
  lng: 35.2101335,

  // קישור לכתיבת ביקורת בגוגל. האתר משתמש בשדה הזה בכפתורים.
  // הערך הנוכחי הוא Place ID של כרטיס המרפאה במפות גוגל בכתובת הזו.
  // אם יש קישור קצר רשמי מפרופיל העסק, מחליפים את כל הכתובת:
  // בגוגל ביזנס: שתפו ← בקשו ביקורות ← מעתיקים את הקישור שמסתיים ב־/review
  // (בדרך כלל g.page/r/.../review). לא לבקש רק ביקורת חיובית, ולא להציע הטבה.
  googleReviewUrl:
    "https://search.google.com/local/writereview?placeid=ChIJXbLbayXXAhURe7YL--N1iNA",

  // איך מחשב שולח קישור Waze לטלפון.
  // "client" פותח וואטסאפ או SMS במכשיר. המספר לא נשמר ולא נשלח לשרת של האתר.
  // "api" שולח POST אל navShareEndpoint (פונקציית שרת עתידית, למשל serverless).
  // במצב api הגוף הוא { "to": "9725XXXXXXXX", "channel": "whatsapp"|"sms", "text": "..." }.
  // השרת צריך לאפשר קריאה מהדומיין של האתר (CORS). לא להחליף ל־api בלי כתובת https אמיתית.
  navShareMode: "client",
  navShareEndpoint: "",

  // TODO: לאשר לוח שעות, ואז להחליף hoursConfirmed ל-true.
  hoursConfirmed: false,
  hours: [
    { daysHe: "יום ראשון", daysEn: "Sunday", open: "09:00", close: "17:00" },
    { daysHe: "יום שני", daysEn: "Monday", open: "09:00", close: "17:00" },
    { daysHe: "יום שלישי", daysEn: "Tuesday", open: "09:00", close: "17:00" },
    { daysHe: "יום רביעי", daysEn: "Wednesday", open: "09:00", close: "17:00" },
    { daysHe: "יום חמישי", daysEn: "Thursday", open: "09:00", close: "17:00" },
    { daysHe: "יום שישי", daysEn: "Friday", open: "09:00", close: "13:00" },
    { daysHe: "שבת", daysEn: "Saturday", closed: true },
  ],
  hoursNoteHe:
    "שעות הפעילות עדיין לא פורסמו באתר. לקביעת תור מתקשרים למרפאה ומתאמים שעה.",
  hoursNoteEn:
    "Opening hours are not published on this site yet. Call the clinic to arrange a time.",

  // TODO: לאשר אילו קופות חולים בהסדר. לא להוסיף קופה שלא אושרה.
  // דוגמה אחרי אישור: ["כללית", "מכבי"]
  healthFunds: [],

  // TODO: שפות שבהן מתקיים הביקור עצמו. לא להוסיף שפה שלא אושרה.
  // האתר עצמו זמין בעברית ובאנגלית גם אם הרשימה כאן היא עברית בלבד.
  spokenLanguages: ["he"],

  // TODO: לאשר מול הרופאה את עצם הפרסום ואת הניסוח המדויק של המינוי.
  showAffiliation: true,
  affiliationHe:
    "לצד המרפאה, ד״ר ממבר מתנדבת בהוראה כמרצה בכירה נלווית במחלקה לרפואת שיניים לילדים, בבית הספר לרפואת שיניים של האוניברסיטה העברית–הדסה.",
  affiliationEn:
    "Alongside the clinic, Dr. Mamber volunteers as an adjunct senior lecturer in the Department of Pediatric Dentistry at the Hebrew University–Hadassah School of Dental Medicine.",

  // TODO: חניה, מעלית, מדרגות, עגלה, כיסא גלגלים. ריק = האתר מבקש לברר בטלפון.
  physicalAccessHe: "",
  physicalAccessEn: "",

  // TODO: שם רכז או רכזת נגישות, אם מונה. ריק = פונים לטלפון המרפאה בלי שם.
  accessibilityCoordinator: "",

  // TODO: מספר רישיון משרד הבריאות. ריק = לא מוצג.
  licenseNumber: "",

  social: {
    // TODO: כתובות פרופילים רשמיים. ריק = לא מוצג קישור.
    facebook: "",
    instagram: "",
    googleBusiness: "",
    // לא בשימוש בכפתורי האתר. את קישור הביקורת שמים ב־googleReviewUrl.
    googleReview: "",
  },

  // TODO: רק המלצות אמיתיות, עם אישור מההורה לפרסם. לא ממציאים ציטוטים.
  // דוגמה (לא להפעיל בלי אישור):
  // {
  //   quoteHe: "טקסט שההורה כתב",
  //   quoteEn: "The parent's own words",
  //   name: "שם פרטי",
  //   detailHe: "הורה לילד בן 5",
  //   detailEn: "Parent of a 5-year-old",
  // }
  testimonials: [],
};

export default clinic;
