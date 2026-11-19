import { weekOverWeekChange } from "./logic";

type Weekly = ReturnType<typeof import("./logic").computeWeekly>;

export function dashboardHtml(current: Weekly, previous: Weekly, retentionDays: number): string {
  const wowVisitors = weekOverWeekChange(current.uniqueVisitors, previous.uniqueVisitors);
  const wowVisits = weekOverWeekChange(current.visits, previous.visits);
  const wowLeads = weekOverWeekChange(current.leads.distinct, previous.leads.distinct);
  const clicks = Object.entries(current.clicks)
    .map(
      ([k, v]) =>
        `<tr><td>${k}</td><td>${v.total}</td><td>${v.distinct}</td><td>${v.new}</td><td>${v.returning}</td></tr>`,
    )
    .join("");
  const top = current.topPagesByViews
    .map((p) => `<li>${p.path} — ${p.views} (חדש ${p.new} / חוזר ${p.returning})</li>`)
    .join("");
  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>מדידה שבועית</title>
<style>
body{font-family:system-ui,sans-serif;margin:1.5rem;background:#f6f1e7;color:#1a2624}
h1,h2{color:#1c4f48} table{border-collapse:collapse;width:100%;max-width:42rem;background:#fff}
td,th{border:1px solid #e4d8c8;padding:.4rem .6rem;text-align:start}
.cards{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));margin:1rem 0}
.card{background:#fff;border:1px solid #e4d8c8;border-radius:.8rem;padding:.8rem}
.note{font-size:.9rem;opacity:.85;margin:.5rem 0 1rem;max-width:42rem}
</style></head><body>
<h1>סיכום 7 ימים</h1>
<p class="note">חלון שמירה: ${retentionDays} ימים. צפיות לפי עמוד הן ספירות מצטברות בלבד (בלי מזהה). ביקורים ולחיצות מקושרים למזהה מגובב בלי עמוד. Safari / דפדפנים באפליקציות עלולים לנקות localStorage.</p>
<div class="cards">
<div class="card"><strong>צפיות</strong><div>${current.pageViews}</div></div>
<div class="card"><strong>מבקרים ייחודיים</strong><div>${current.uniqueVisitors}</div><small>WoW ${wowVisitors ?? "—"}%</small></div>
<div class="card"><strong>ביקורים (s=1)</strong><div>${current.visits}</div><small>WoW ${wowVisits ?? "—"}%</small></div>
<div class="card"><strong>חדשים / חוזרים</strong><div>${current.newVisitors} / ${current.returningVisitors}</div></div>
<div class="card"><strong>לידים</strong><div>${current.leads.distinct}</div><small>WoW ${wowLeads ?? "—"}% · המרה ${(current.leads.conversionRate * 100).toFixed(1)}%</small></div>
<div class="card"><strong>לוחצים רב־יומיים</strong><div>${current.multiDayClickers}</div></div>
</div>
<h2>לחיצות לפי ערוץ</h2>
<table><thead><tr><th>ערוץ</th><th>סה״כ</th><th>ייחודיים</th><th>חדש</th><th>חוזר</th></tr></thead><tbody>${clicks}</tbody></table>
<h2>עמודים מובילים לפי צפיות (מצטבר)</h2><ol>${top || "<li>—</li>"}</ol>
</body></html>`;
}
