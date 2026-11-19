# פריסת מונה המדידה (Cloudflare Worker + D1) — אפשרות C

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

3. משתנים ב־`wrangler.toml`:
   - `ALLOWED_ORIGINS`
   - `MAX_EVENTS_PER_DAY` (ברירת מחדל 60)
   - `WRITE_SPIKE_LIMIT` (ברירת מחדל 400)
   - `RETENTION_DAYS` = **90**

4. סודות:
   ```bash
   npx wrangler secret put V_PEPPER
   npx wrangler secret put IP_SALT_SECRET
   npx wrangler secret put DASH_USER
   npx wrangler secret put DASH_PASS
   npx wrangler secret put WEEKLY_TOKEN
   ```

5. פריסה (רק אחרי אישור מפורש): `npx wrangler deploy`

6. באתר: `collectorUrl` ב־`site.analytics.mjs` (או `COLLECTOR_URL`) ואז `npm run build`.

## סכמה (אפשרות C)
- `page_views(ts, day, path, n)` — ספירות מצטברות לפי עמוד, **בלי** `v_hash`
- `visits(ts, day, v_hash, f, l, s)` — ביקור לפי מזהה מגובב, **בלי** path
- `clicks(ts, day, event, v_hash, f, s)` — לחיצה, **בלי** path (`v_hash` יכול להיות NULL)
- `leads(ts, day, n)` — callback_form_success בלבד
- אף שורה לא מחזיקה גם path וגם `v_hash`
- גיבוב IP רק ב־`rate_limits`, נמחק אחרי **N = 2 ימים**
- מחיקת `page_views` / `visits` / `clicks` / `leads` אחרי **90 ימים**
