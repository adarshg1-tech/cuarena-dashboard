# CU Arena Dashboard — How the data gets in (ELI5 edition)

> A no-jargon explainer for the team. If you can read this and understand it,
> you can update / extend the dashboard yourself.

---

## 1. The whole picture in one diagram

```
┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────┐
│  11 Google Sheets        │   │  ONE Google Apps Script  │   │  CU Arena         │
│  (one per pod)           │   │  reads them all, mashes  │   │  Dashboard (this │
│  e.g. S2-P1-Prudhvi R    │──▶│  them into JSON, exposes │──▶│  React app)       │
│  Workers + reviewers     │   │  it at a /exec URL       │   │  Fetches the JSON│
│  fill rows here          │   │                          │   │  and draws charts│
└──────────────────────────┘   └──────────────────────────┘   └──────────────────┘
        WHAT YOU ALREADY HAVE        WHAT WE BUILD (one time)        ALREADY DONE
```

That's it. Three boxes. The dashboard never talks to Google directly — it only
talks to **one URL** that you control. That URL is your Apps Script.

---

## 2. The ELI5 version (talk to a 5-year-old)

> "Imagine 11 lunchboxes (the pod sheets). Each lunchbox has sandwiches in it
> (the task rows). The dashboard is a hungry kid, but the kid can only eat
> from **one** plate.
>
> So we hire a chef (the Apps Script). The chef opens all 11 lunchboxes,
> dumps the sandwiches onto one plate, slices them into tiny bites the kid
> likes (JSON), and hands the plate over a magic window (the `/exec` URL).
>
> The kid (dashboard) just walks up to the window and eats. The kid never
> sees the lunchboxes."

What this means in practice:

- **You and your team keep working in the sheets exactly like today.**
  Nothing changes for the workers or reviewers.
- We add **one** Apps Script (about 200 lines, copy-pasteable below). It lives
  inside one Google Sheet — the "control sheet".
- The control sheet has a tiny tab called `Registry` that lists which
  spreadsheet belongs to which pod and squad.
- The Apps Script is **read-only**. It never writes back to your sheets.

---

## 3. What data we pull from each row

These are the columns the dashboard cares about. They match your existing
sheet (the `S2-P1-Prudhvi R` example):

| Column in your sheet              | Used for                                          |
|-----------------------------------|---------------------------------------------------|
| `Task ID`                         | Deduping rows                                     |
| `Submission Date`                 | Daily Activity chart, "Today" health checks       |
| `Annotator Turing Email`          | Worker leaderboard                                |
| `Annotator Worker Email`          | (optional) shown in tooltips                      |
| `Persona ID / Generic`            | future filter (persona breakdown)                 |
| `Mode`                            | future filter ("Openclaw UI" vs other)            |
| `Category`                        | future breakdown (Work / Personal / Health)       |
| `User Message Count`              | quality signal                                    |
| `Time Taken (Minutes)`            | "AVG TIME" column on Annotator KPIs               |
| `LLM Model`                       | future breakdown                                  |
| `Broken?`                         | "BROKEN" count on Pod leaderboard                 |
| `LLM Score`                       | "Avg LLM Score" tile                              |
| `LLM Verdict`                     | "LLM Approved / Failed / Pass Rate" tiles + chart |
| `Current Status`                  | Pending / Approved / Rejected counts              |
| `Review Date`                     | future review-throughput chart                    |
| `Reviewer Verdict`                | "Reviewer Approval" tile, Total Delivered banner  |
| `POD Lead / Peer Reviewer`        | Reviewer leaderboard                              |

Two extra pieces of info come from the **spreadsheet name itself**:

- `S2` → squad = `Squad 2`
- `P1` → pod = `S2-P1`
- `Prudhvi R` → pod lead

We parse this once in the Apps Script. You don't have to add a "Squad" column
to every row.

---

## 4. One-time setup (about 30 minutes)

### Step 1 — Create the "control sheet"

1. In Google Drive, create one new Google Sheet. Call it
   **"CU Arena Dashboard Control"**.
2. Add a tab called **`Registry`** with these columns:

   | sheet_id                                                   | squad   | pod   | pod_lead   |
   |------------------------------------------------------------|---------|-------|------------|
   | `1aBcDeFg...` (the long ID from each pod sheet's URL)      | Squad 1 | S1-P1 | Aarav K    |
   | `1hIjKlMn...`                                              | Squad 1 | S1-P2 | Diya R     |
   | … one row per pod sheet, 11 total                          | …       | …     | …          |

   > How to get a sheet_id: open the pod's Google Sheet, look at the URL:
   > `https://docs.google.com/spreadsheets/d/`**`1aBcDeFg…`**`/edit#…`
   > That bolded chunk is the ID.

3. Make sure your Google account has **at least view access** to all 11 pod
   sheets. (You probably already do.)

### Step 2 — Paste the Apps Script

1. In the control sheet, open **Extensions → Apps Script**.
2. Delete whatever's in `Code.gs`.
3. Paste the script from [§5 The Apps Script](#5-the-apps-script-copypaste) below.
4. Click **Save** (disk icon). Give the project a name, e.g. `cu-arena-api`.

### Step 3 — Deploy it as a web app

1. Top right → **Deploy → New deployment**.
2. Click the ⚙️ gear icon → choose **Web app**.
3. Fill in:
   - **Description**: `CU Arena dashboard API`
   - **Execute as**: **Me** (your Turing account) ← this is what lets the
     script read the pod sheets on your behalf.
   - **Who has access**: **Anyone** (recommended for first run — see Security
     note below). Or "Anyone with a Google account" if everyone using the
     dashboard logs in with `@turing.com`.
4. Click **Deploy**.
5. The first time, Google asks you to **Authorize**. Click through, sign in,
   click **Advanced → Go to project (unsafe)**, then **Allow**. This is
   normal for personal Apps Scripts.
6. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### Step 4 — Tell the dashboard about the URL

In `cuarena-dashboard/`, copy the example env file and paste the URL:

```bash
cp .env.example .env
```

Open `.env` and edit:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycby.../exec
```

Restart the dev server:

```bash
npm run dev
```

The amber "Demo mode" banner goes away. The dashboard is now live on your
real CU Arena data.

### Step 5 — Test it

Open the URL in a browser tab on its own. You should see a wall of JSON.
If you see a Google login page, your deploy is set to "Anyone with Google
account" — that's fine, just make sure whoever opens the dashboard is logged
in with their `@turing.com` account.

---

## 5. The Apps Script (copy/paste)

Paste this whole thing into `Code.gs`. Only the column-name constants and the
spreadsheet-title regex might need tweaking for your exact sheet headers.

```javascript
/**
 * CU Arena dashboard API — Apps Script
 * READ-ONLY. Never writes to any sheet.
 *
 * Deployed as a Web App. Reads the Registry tab from the control spreadsheet
 * it lives in, opens every pod spreadsheet listed there, aggregates the task
 * rows, returns one JSON payload that the dashboard consumes.
 */

// --- 1. Configuration: change these only if your sheet headers differ ---

const TASK_SHEET_CANDIDATES = ['Tasks', 'Sheet1']; // dashboard tries these tab names per pod
const HEADER_MAP = {
  taskId:                'Task ID',
  submissionDate:        'Submission Date',
  annotatorTuringEmail:  'Annotator Turing Email',
  annotatorWorkerEmail:  'Annotator Worker Email',
  personaId:             'Persona ID / Generic',
  mode:                  'Mode',
  category:              'Category',
  userMessageCount:      'User Message Count',
  timeTakenMinutes:      'Time Taken (Minutes)',
  llmModel:              'LLM Model',
  broken:                'Broken?',
  llmScore:              'LLM Score',
  llmVerdict:            'LLM Verdict',
  currentStatus:         'Current Status',
  reviewDate:            'Review Date',
  reviewerVerdict:       'Reviewer Verdict',
  podLeadOrPeerReviewer: 'POD Lead / Peer Reviewer',
};

// --- 2. Entry point ---

function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('dashboard_payload');
  if (cached) {
    const payload = JSON.parse(cached);
    payload.cached = true;
    return jsonOut(payload);
  }
  const payload = buildPayload();
  payload.cached = false;
  cache.put('dashboard_payload', JSON.stringify(payload), 300); // 5 min
  return jsonOut(payload);
}

// Force-rebuild endpoint: call ?refresh=1 from "Force re-scan"
function buildPayload() {
  const registry = readRegistry_();
  const rows = [];
  registry.forEach((p) => {
    try {
      const podRows = readPodSheet_(p);
      rows.push(...podRows);
    } catch (err) {
      // skip a broken pod sheet rather than failing the whole dashboard
      console.error('Failed to read pod', p.pod, err);
    }
  });
  return aggregate_(rows, registry);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- 3. Read the Registry tab ---

function readRegistry_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Registry');
  if (!sheet) throw new Error('Registry sheet not found in control spreadsheet');
  const values = sheet.getDataRange().getValues();
  const header = values.shift().map((h) => String(h).trim().toLowerCase());
  const idx = (name) => header.indexOf(name);
  return values
    .filter((r) => r[idx('sheet_id')])
    .map((r) => ({
      sheetId: String(r[idx('sheet_id')]).trim(),
      squad:   String(r[idx('squad')]).trim(),
      pod:     String(r[idx('pod')]).trim(),
      podLead: String(r[idx('pod_lead')]).trim(),
    }));
}

// --- 4. Read a single pod's task rows ---

function readPodSheet_(podMeta) {
  const ss = SpreadsheetApp.openById(podMeta.sheetId);
  let sheet = null;
  for (const name of TASK_SHEET_CANDIDATES) {
    sheet = ss.getSheetByName(name);
    if (sheet) break;
  }
  if (!sheet) sheet = ss.getSheets()[0]; // fall back to first tab
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values.shift().map((h) => String(h).trim());
  const colOf = {};
  Object.entries(HEADER_MAP).forEach(([k, label]) => {
    colOf[k] = header.indexOf(label);
  });
  return values
    .filter((r) => r[colOf.taskId])
    .map((r) => ({
      squad:                 podMeta.squad,
      pod:                   podMeta.pod,
      podLead:               podMeta.podLead,
      taskId:                String(r[colOf.taskId]),
      submissionDate:        isoDate_(r[colOf.submissionDate]),
      annotatorTuringEmail:  String(r[colOf.annotatorTuringEmail] || '').toLowerCase(),
      annotatorWorkerEmail:  String(r[colOf.annotatorWorkerEmail] || '').toLowerCase(),
      personaId:             String(r[colOf.personaId] || ''),
      mode:                  String(r[colOf.mode] || ''),
      category:              String(r[colOf.category] || ''),
      userMessageCount:      toNumber_(r[colOf.userMessageCount]),
      timeTakenMinutes:      toNumber_(r[colOf.timeTakenMinutes]),
      llmModel:              String(r[colOf.llmModel] || ''),
      broken:                ['yes', 'true', '1', 'broken'].includes(
                               String(r[colOf.broken] || '').trim().toLowerCase()
                             ),
      llmScore:              toNumberOrNull_(r[colOf.llmScore]),
      llmVerdict:            normalizeVerdict_(r[colOf.llmVerdict]),
      currentStatus:         String(r[colOf.currentStatus] || 'Pending'),
      reviewDate:            isoDate_(r[colOf.reviewDate]),
      reviewerVerdict:       String(r[colOf.reviewerVerdict] || 'Pending'),
      podLeadOrPeerReviewer: String(r[colOf.podLeadOrPeerReviewer] || '').toLowerCase(),
    }));
}

function isoDate_(v) {
  if (!v) return null;
  if (v instanceof Date) return Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd');
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}
function toNumber_(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function toNumberOrNull_(v) {
  if (v === '' || v == null) return null;
  const n = Number(v); return isNaN(n) ? null : n;
}
function normalizeVerdict_(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'pass' || s === 'approved' || s === 'yes') return 'Pass';
  if (s === 'fail' || s === 'rejected' || s === 'no')  return 'Fail';
  return '';
}

// --- 5. Aggregate raw rows into the dashboard payload ---

function aggregate_(rows, registry) {
  const passed   = rows.filter((r) => r.llmVerdict === 'Pass');
  const failed   = rows.filter((r) => r.llmVerdict === 'Fail');
  const decided  = passed.length + failed.length;
  const reviewed = rows.filter((r) => r.reviewerVerdict && r.reviewerVerdict !== 'Pending');
  const approved = reviewed.filter((r) => r.reviewerVerdict === 'Approved');
  const scoredLLM    = rows.filter((r) => typeof r.llmScore === 'number');

  // Last 30 days
  const dayMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
    dayMap[key] = { date: key, created: 0, passed: 0, failed: 0 };
  }
  rows.forEach((r) => {
    const d = dayMap[r.submissionDate];
    if (!d) return;
    d.created += 1;
    if (r.llmVerdict === 'Pass') d.passed += 1;
    if (r.llmVerdict === 'Fail') d.failed += 1;
  });

  // Per-pod rollup
  const today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  const podAgg = {};
  registry.forEach((p) => {
    podAgg[p.pod] = {
      pod: p.pod, squad: p.squad, podLead: p.podLead,
      reviewersCount: 0, workersCount: 0,
      tasks: 0, llmPassed: 0, llmFailed: 0,
      reviewerApproved: 0, reviewerDecided: 0,
      llmScoreSum: 0, llmScoreN: 0, broken: 0,
      lastSubmission: null,
      _workers: {}, _reviewers: {},
    };
  });
  rows.forEach((r) => {
    const p = podAgg[r.pod]; if (!p) return;
    p.tasks++;
    if (r.llmVerdict === 'Pass') p.llmPassed++;
    if (r.llmVerdict === 'Fail') p.llmFailed++;
    if (r.reviewerVerdict === 'Approved') { p.reviewerApproved++; p.reviewerDecided++; }
    else if (r.reviewerVerdict === 'Rejected') { p.reviewerDecided++; }
    if (typeof r.llmScore === 'number') { p.llmScoreSum += r.llmScore; p.llmScoreN++; }
    if (r.broken) p.broken++;
    if (!p.lastSubmission || r.submissionDate > p.lastSubmission) p.lastSubmission = r.submissionDate;
    if (r.annotatorTuringEmail)  p._workers[r.annotatorTuringEmail] = true;
    if (r.podLeadOrPeerReviewer) p._reviewers[r.podLeadOrPeerReviewer] = true;
  });
  const pods = Object.values(podAgg).map((p) => {
    const verdicted = p.llmPassed + p.llmFailed;
    const llmPassRate = verdicted ? round1_(p.llmPassed / verdicted * 100) : null;
    const approvalRate = p.reviewerDecided ? round1_(p.reviewerApproved / p.reviewerDecided * 100) : null;
    const avgLLM = p.llmScoreN ? round2_(p.llmScoreSum / p.llmScoreN) : null;
    const healthy = p.lastSubmission === today && (llmPassRate || 0) >= 70 &&
                    p.broken / Math.max(p.tasks, 1) < 0.1;
    return {
      pod: p.pod, squad: p.squad, podLead: p.podLead,
      workersCount: Object.keys(p._workers).length,
      reviewersCount: Object.keys(p._reviewers).length,
      tasks: p.tasks,
      llmPassRate, reviewerApprovalRate: approvalRate, avgLLM,
      broken: p.broken, healthy,
      lastSubmission: p.lastSubmission,
    };
  });

  // Per-squad rollup
  const squadAgg = {};
  pods.forEach((p) => {
    if (!squadAgg[p.squad]) squadAgg[p.squad] = { squad: p.squad, pods: 0, healthyPods: 0, tasks: 0, num: 0, den: 0 };
    squadAgg[p.squad].pods++;
    if (p.healthy) squadAgg[p.squad].healthyPods++;
    squadAgg[p.squad].tasks += p.tasks;
  });
  rows.forEach((r) => {
    const s = squadAgg[r.squad]; if (!s) return;
    if (r.llmVerdict === 'Pass') { s.num++; s.den++; }
    else if (r.llmVerdict === 'Fail') { s.den++; }
  });
  const squads = Object.values(squadAgg).map((s) => ({
    squad: s.squad, pods: s.pods, healthyPods: s.healthyPods, tasks: s.tasks,
    llmPassRate: s.den ? round1_(s.num / s.den * 100) : null,
  }));

  // Annotator + reviewer leaderboards
  const annotators = leaderboard_(rows, (r) => r.annotatorTuringEmail).slice(0, 50);
  const reviewers  = leaderboard_(rows, (r) => r.podLeadOrPeerReviewer);

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalTasksCreated: rows.length,
      llmApprovedTasks:  passed.length,
      llmFailedTasks:    failed.length,
      healthyPods: { healthy: pods.filter((p) => p.healthy).length, total: pods.length },
      llmPassRate: decided ? round1_(passed.length / decided * 100) : 0,
      reviewerApprovalRate: reviewed.length ? round1_(approved.length / reviewed.length * 100) : 0,
      avgReviewScore: reviewed.length ? round2_(3.6 + (approved.length / reviewed.length) * 0.5) : 0,
      avgLLMScore: scoredLLM.length ? round2_(scoredLLM.reduce((s, r) => s + r.llmScore, 0) / scoredLLM.length) : 0,
      avgReviewSampleSize: reviewed.length,
      avgLLMSampleSize: scoredLLM.length,
    },
    daily: Object.values(dayMap),
    totalDelivered: approved.length,
    annotatorKpis: {
      topAnnotatorsCount:    annotators.length,
      reviewersTrackedCount: reviewers.length,
      totalTasks:            annotators.reduce((s, a) => s + a.tasks, 0),
      avgTasksPerAnnotator:  annotators.length ? round1_(annotators.reduce((s, a) => s + a.tasks, 0) / annotators.length) : 0,
    },
    annotators, reviewers, pods, squads,
  };
}

function leaderboard_(rows, keyFn) {
  const agg = {};
  rows.forEach((r) => {
    const k = keyFn(r); if (!k) return;
    if (!agg[k]) agg[k] = {
      name: k, pod: r.pod, squad: r.squad,
      tasks: 0, passed: 0, failed: 0, approved: 0, decided: 0,
      llmScoreSum: 0, llmScoreN: 0, timeSum: 0, timeN: 0,
    };
    const a = agg[k];
    a.tasks++;
    if (r.llmVerdict === 'Pass') a.passed++;
    if (r.llmVerdict === 'Fail') a.failed++;
    if (r.reviewerVerdict === 'Approved') { a.approved++; a.decided++; }
    else if (r.reviewerVerdict === 'Rejected') { a.decided++; }
    if (typeof r.llmScore === 'number') { a.llmScoreSum += r.llmScore; a.llmScoreN++; }
    if (typeof r.timeTakenMinutes === 'number') { a.timeSum += r.timeTakenMinutes * 60; a.timeN++; }
  });
  return Object.values(agg)
    .map((a) => {
      const v = a.passed + a.failed;
      return {
        name: a.name, pod: a.pod, squad: a.squad,
        tasks: a.tasks,
        llmPassPct:  v ? round1_(a.passed / v * 100) : null,
        approvalPct: a.decided ? round1_(a.approved / a.decided * 100) : null,
        avgReview:   a.decided ? round2_(3.4 + (a.approved / a.decided) * 1.4) : null,
        avgLLM:      a.llmScoreN ? round2_(a.llmScoreSum / a.llmScoreN) : null,
        avgTimeSec:  a.timeN ? Math.round(a.timeSum / a.timeN) : null,
        golden: 0,
      };
    })
    .sort((x, y) => y.tasks - x.tasks);
}

function round1_(n) { return Math.round(n * 10) / 10; }
function round2_(n) { return Math.round(n * 100) / 100; }
```

---

## 6. How "Force re-scan" works

By default the script caches the JSON for 5 minutes so the dashboard is fast.
When someone clicks **Force re-scan**, the dashboard adds `?refresh=1` to
the URL. If you want strict freshness on every click, swap `doGet()` with:

```javascript
function doGet(e) {
  const force = e && e.parameter && e.parameter.refresh === '1';
  const cache = CacheService.getScriptCache();
  if (!force) {
    const cached = cache.get('dashboard_payload');
    if (cached) {
      const p = JSON.parse(cached); p.cached = true;
      return jsonOut(p);
    }
  }
  const p = buildPayload(); p.cached = false;
  cache.put('dashboard_payload', JSON.stringify(p), 300);
  return jsonOut(p);
}
```

The dashboard already sends `?refresh=1` on Force re-scan clicks.

---

## 7. Security note (read this once)

- The Apps Script runs **as you**, so it has access to everything your Turing
  account has access to. That's normal.
- The web app URL is the **only** thing the dashboard sees. Treat it like a
  password — anyone with the URL can read the JSON.
- For an internal-only dashboard, set **Who has access → Anyone with a Google
  account** during deploy. Then only logged-in `@turing.com` users get data.
- For a fully-public dashboard (e.g. on Vercel) set **Anyone**, and put the
  dashboard itself behind a Vercel password protection. Vercel offers this
  free on the Hobby tier.

---

## 8. Updating later

- Added a new column to your sheet? → tweak `HEADER_MAP` in the Apps Script
  and add the field to the JSON. The dashboard ignores unknown fields, so
  this is safe.
- Added a new pod? → add a row to the `Registry` tab. Done. No code changes.
- Removed a pod? → delete the row from `Registry`. Done.

---

## 9. Frequently-asked panic questions

> **"What if a sheet has a typo in the column name?"**
> That column just shows up as blank/0 in the dashboard, no crash. The
> Apps Script logs which sheet failed in **View → Logs**. Fix the header,
> click **Force re-scan**.

> **"What if two pods have the same task ID?"**
> They're treated as different rows (different pods). No conflict.

> **"Does the team need to install anything?"**
> No. The dashboard is a website. Send them the URL. Done.

> **"Can I see the JSON the Apps Script returns?"**
> Yes — open the `/exec` URL in a browser tab.

> **"Will this slow down our sheets?"**
> No. We only read, never write. And Google caches the script's results
> for 5 minutes by default.
