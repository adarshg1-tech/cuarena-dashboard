# CU Arena Dashboard

A read-only, real-time-ish dashboard for the **CU Arena** platform
([cua-arena.turing.com](https://cua-arena.turing.com/)) — the OpenClaw
Worker Webapp where workers complete computer-use tasks, reviewers score
them, and admins keep an eye on everything across **4 squads / 11 pods**.

Inspired by the Puffin openclaw dashboard. Three pages:

1. **Dashboard** — overview metric tiles + 30-day Daily Activity area chart +
   Total Tasks Delivered banner.
2. **Pods** — squad-level health cards + sortable leaderboard of all 11 pods
   (tasks, LLM pass %, reviewer approval %, broken count, healthy/attention).
3. **Annotator KPIs** — 4 headline cards + sortable / searchable table of
   annotators (or reviewers) with an Export-to-Excel button.

The whole thing renders from a single JSON payload, served either from
built-in mock data (default) or your Google Apps Script endpoint that reads
the per-pod sheets.

> **Connecting your real Google Sheets:** read
> [INGESTION_GUIDE.md](INGESTION_GUIDE.md) — it's the ELI5 explainer the
> team can follow, including a copy-pasteable Apps Script tailored to the
> CU Arena multi-pod sheet structure.

---

## Quick start (local)

Requirements: **Node 18+** (you're on Node 22 — perfect) and npm.

```bash
cd cuarena-dashboard
npm install
npm run dev
```

That opens `http://localhost:5173` with realistic mock data so you can see the
whole UI immediately.

To build for production:

```bash
npm run build
npm run preview       # serves the production build locally
```

---

## Wiring live data (Google Sheets via Apps Script)

> **📖 Full walkthrough:** [INGESTION_GUIDE.md](INGESTION_GUIDE.md) — includes the full production Apps Script that handles
> all 11 pod sheets and tags rows with squad / pod automatically.

The dashboard fetches **one JSON payload** from a single URL. The easiest way
to serve that is the Apps Script web app pattern you already started:

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. Paste a function like the one below into `Code.gs`. Adjust the sheet/range
   names to match your sheets:

   ```javascript
   function doGet() {
     const ss = SpreadsheetApp.getActive();

     const overview = readKeyValueSheet_(ss.getSheetByName('Overview'));
     const daily    = readDailySheet_(ss.getSheetByName('Daily'));
     const annot    = readPeopleSheet_(ss.getSheetByName('Annotators'));
     const reviewers= readPeopleSheet_(ss.getSheetByName('Reviewers'));

     const payload = {
       generatedAt: new Date().toISOString(),
       cached: false,
       overview: {
         totalTasksCreated:    overview.totalTasksCreated,
         llmApprovedTasks:     overview.llmApprovedTasks,
         llmFailedTasks:       overview.llmFailedTasks,
         healthyPods:          { healthy: overview.healthyPods, total: overview.totalPods },
         llmPassRate:          overview.llmPassRate,
         reviewerApprovalRate: overview.reviewerApprovalRate,
         avgReviewScore:       overview.avgReviewScore,
         avgLLMScore:          overview.avgLLMScore,
         avgReviewSampleSize:  overview.avgReviewSampleSize,
         avgLLMSampleSize:     overview.avgLLMSampleSize,
       },
       daily,                                  // [{ date, created, passed, failed }, ...]
       totalDelivered: overview.totalDelivered,
       annotatorKpis: {
         topAnnotatorsCount:    annot.length,
         reviewersTrackedCount: reviewers.length,
         totalTasks:            annot.reduce((s, r) => s + r.tasks, 0),
         avgTasksPerAnnotator:  Math.round(
           (annot.reduce((s, r) => s + r.tasks, 0) / annot.length) * 10
         ) / 10,
       },
       annotators: annot,
       reviewers:  reviewers,
     };

     return ContentService
       .createTextOutput(JSON.stringify(payload))
       .setMimeType(ContentService.MimeType.JSON);
   }

   // helpers: read sheets into the expected shape — adapt to your column names
   function readKeyValueSheet_(sheet) { /* return {key: value} */ }
   function readDailySheet_(sheet)    { /* return [{date,created,passed,failed}] */ }
   function readPeopleSheet_(sheet)   { /* return [{name,tasks,llmPassPct,...}] */ }
   ```

3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with Google account" if internal-only).
   - Copy the `/exec` URL it gives you.

4. In `cuarena-dashboard/`, copy `.env.example` to `.env` and paste the URL:

   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

5. Restart `npm run dev`. The amber "Demo mode" banner disappears and the UI
   now pulls live data on load and on every **Force re-scan** click.

> If you see CORS errors in the browser console, make sure the Apps Script
> deployment is set to **"Anyone"** access. Apps Script web apps return the
> required `Access-Control-Allow-Origin: *` automatically when deployed that way.

### What columns should be in the sheets?

Mirror the keys in [`src/lib/mockData.js`](src/lib/mockData.js). Suggested layout:

- **Overview** sheet (key/value):
  `totalTasksCreated`, `llmApprovedTasks`, `llmFailedTasks`,
  `healthyPods`, `totalPods`, `llmPassRate`, `reviewerApprovalRate`,
  `avgReviewScore`, `avgLLMScore`, `avgReviewSampleSize`, `avgLLMSampleSize`,
  `totalDelivered`.
- **Daily** sheet: columns `date`, `created`, `passed`, `failed` (one row per day).
- **Annotators** / **Reviewers** sheets: columns `name`, `tasks`, `llmPassPct`,
  `approvalPct`, `avgReview`, `avgLLM`, `avgTimeSec`, `golden`.

---

## Push to GitHub

From inside `cuarena-dashboard/`:

```bash
git init
git add .
git commit -m "Initial commit: CU Arena dashboard"

# Then on github.com create a new empty repo (e.g. cuarena-dashboard)
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/cuarena-dashboard.git
git push -u origin main
```

---


---

## Project layout

```
cuarena-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx                       # top-level layout + tab routing
    ├── index.css                     # Tailwind + small component classes
    ├── lib/
    │   ├── dataSource.js             # fetchDashboardData() — mock or live
    │   ├── mockData.js               # built-in demo payload
    │   └── format.js                 # number / date / time helpers
    └── components/
        ├── Header.jsx                # title, status pill, refresh buttons
        ├── Tabs.jsx                  # Dashboard / Annotator KPIs
        ├── MetricCard.jsx            # reusable big-number card
        ├── OverviewCards.jsx         # ── TOP component (8 metric tiles)
        ├── DailyActivity.jsx         # ── BOTTOM component (chart + banner)
        ├── PodsView.jsx              # Pods tab (squad cards + pod leaderboard)
        ├── AnnotatorKPIs.jsx         # Annotator KPIs tab
        └── AnnotatorTable.jsx        # sortable / searchable table + export
```

The two components you specifically asked for are **`OverviewCards.jsx`**
(top section, all the headline numbers) and **`DailyActivity.jsx`** (bottom
section, the chart + the Total Tasks Delivered banner).
