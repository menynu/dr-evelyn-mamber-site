# פריסת מונה המדידה (Cloudflare Worker + D1)

מסמך זה לפריסה ידנית אחרי אישור מני, סקירת ציות ובדיקת עו״ד. **אין להריץ `wrangler deploy` מהסוכן.**

## מה צריך מראש
1. חשבון Cloudflare.
2. התקנה מקומית: `cd analytics-worker && npm install` ו־`npx wrangler login`.

## שלבים
1. יצירת מסד D1:
   ```bash
   npx wrangler d1 create mamber-analytics
   ```
   להעתיק את ה־`database_id` ל־`wrangler.toml`.

2. הרצת הסכמה:
   ```bash
   npx wrangler d1 execute mamber-analytics --file=./schema.sql
   ```

3. הגדרת משתנים ב־`wrangler.toml`:
   - `ALLOWED_ORIGINS` — למשל `https://menynu.github.io` (ואם צריך גם כתובת תצוגה מקדימה).
   - `MAX_EVENTS_PER_DAY` (ברירת מחדל 60).
   - `WRITE_SPIKE_LIMIT` (ברירת מחדל 400).

4. סודות:
   ```bash
   npx wrangler secret put V_PEPPER
   npx wrangler secret put IP_SALT_SECRET
   npx wrangler secret put DASH_USER
   npx wrangler secret put DASH_PASS
   npx wrangler secret put WEEKLY_TOKEN
   ```

5. פריסה (רק אחרי אישור מפורש):
   ```bash
   npx wrangler deploy
   ```
   לשמור את כתובת ה־Worker (בלי סלאש בסוף).

6. באתר: ב־`site.analytics.mjs` להגדיר:
   ```js
   collectorUrl: "https://YOUR-WORKER.workers.dev"
   ```
   ולבנות מחדש (`npm run build`). ה־CSP יקבל את ה־origin אוטומטית.

7. בדיקות אחרי פריסה:
   - `GET /dashboard` עם Basic Auth.
   - `GET /api/weekly?token=WEEKLY_TOKEN`.
   - בדפדפן: Network → POST `/e` רק כש־`collectorUrl` מלא.

## שמירה על פרטיות
- אין עוגיות, אין פיקסלי פרסום, אין שמירת IP גולמי.
- בטבלת `events` אין ערך הנגזר מ־IP: באירועים ללא מזהה (`v` חסר) נשמר `v_hash = NULL`.
- גיבוב IP יומי משמש **רק** בטבלת `rate_limits` להגבלת שימוש לרעה (כולל אירועי no-id).
- מחיקת שורות `rate_limits` ישנות: **N = 2 ימים** (cron יומי).
- GPC / DNT / `mmb_optout` מונעים יצירת מזהה בדפדפן.
- מחיקת ספירות ב־`events` אחרי ~13 חודשים (cron יומי).
