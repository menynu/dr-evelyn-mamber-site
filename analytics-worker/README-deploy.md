# פריסת מונה המדידה (Cloudflare Worker + D1) — אפשרות C

מסמך זה לפריסה ידנית אחרי אישור מני, סקירת ציות ובדיקת עו״ד. **אין להריץ `wrangler deploy` מהסוכן.**

## Legal requirements before go-live

Before creating resources or deploying:

1. **D1 in the EU (cannot be changed later).** Create the database with EU jurisdiction only:
   ```bash
   npx wrangler d1 create mmb-analytics --jurisdiction eu
   ```
   Jurisdiction is set at creation time and **cannot be added or changed afterward**. Copy the returned `database_id` into `wrangler.toml`.

2. **No Cloudflare request logging of IP / User-Agent.** Keep Workers Logs off and do not configure Logpush. `wrangler.toml` must include:
   ```toml
   logpush = false

   [observability]
   enabled = false
   ```
   In code, `CF-Connecting-IP` / `X-Forwarded-For` are used only to build a salted hash for `rate_limits` (purged after 2 days). The raw IP is never written to any table. User-Agent is read only for bot filtering and is never stored. There are no `console.log` calls that print IP or UA.

3. **Privacy page (clinic as database owner).** The measurement section must name the clinic of Dr. Evelyn Mamber as database owner (with phone/address from `clinic.config.mjs`), Cloudflare as the provider, and that storage may be outside Israel (in the EU).

## מה צריך מראש
1. חשבון Cloudflare.
2. התקנה מקומית: `cd analytics-worker && npm install` ו־`npx wrangler login`.

## שלבים
1. יצירת מסד D1 **בסמכות שיפוט EU** (לא ניתן לשנות אחר כך):
   ```bash
   npx wrangler d1 create mmb-analytics --jurisdiction eu
   ```
   להעתיק את ה־`database_id` ל־`wrangler.toml`.

2. הרצת הסכמה:
   ```bash
   npx wrangler d1 execute mmb-analytics --file=./schema.sql
   ```

3. משתנים ב־`wrangler.toml`:
   - `ALLOWED_ORIGINS`
   - `MAX_EVENTS_PER_DAY` (ברירת מחדל 60)
   - `WRITE_SPIKE_LIMIT` (ברירת מחדל 400)
   - `RETENTION_DAYS` = **90**
   - `logpush = false` ו־`[observability] enabled = false` (כבר בקובץ; לא להפעיל Logs/Logpush)

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
- `page_views(day, path, n, count)` — מונה מצטבר אמיתי (`PRIMARY KEY(day,path,n)` + `ON CONFLICT … count+1`), **בלי** `ts` / `v_hash`
- `visits(id TEXT PK, day, v_hash, f, l, s)` — ביקור לפי מזהה מגובב, **בלי** path / `ts` (מפתח אקראי, `WITHOUT ROWID`)
- `clicks(id TEXT PK, day, event, v_hash, f, s)` — לחיצה, **בלי** path / `ts` (`v_hash` יכול להיות NULL)
- `leads(ts, day, n)` — callback_form_success בלבד
- אף שורה לא מחזיקה גם path וגם `v_hash`; אין קישור זמן בין צפיות למזהים
- גיבוב IP רק ב־`rate_limits`, נמחק אחרי **N = 2 ימים**
- מחיקת `page_views` / `visits` / `clicks` / `leads` לפי `day` אחרי **90 ימים**
