// Mock data shaped exactly like what your Google Apps Script should return.
// Schema mirrors the real CU Arena per-pod Google Sheet (e.g. "S2-P1-Prudhvi R")
// with these task-row columns:
//
//   Task ID · Submission Date · Annotator Turing Email · Annotator Worker Email ·
//   Persona ID / Generic · Mode · Category · User Message Count ·
//   Time Taken (Minutes) · LLM Model · Annotator Comments · Broken? ·
//   LLM Score · LLM Verdict · Current Status · Review Date ·
//   Reviewer Verdict · Reviewer Comment · POD Lead / Peer Reviewer ·
//   LLM Review Doc Link · Manual Review Link
//
// The Apps Script reads these rows from every pod sheet, tags each row with
// `squad` + `pod`, aggregates, and returns the JSON shape produced below.

const POD_REGISTRY = [
  { squad: 'Squad 1', pod: 'S1-P1', podLead: 'Aarav K',   reviewers: ['aarav.k1@turing.com',   'meera.s2@turing.com']  },
  { squad: 'Squad 1', pod: 'S1-P2', podLead: 'Diya R',    reviewers: ['diya.r1@turing.com',    'kabir.m4@turing.com']  },
  { squad: 'Squad 1', pod: 'S1-P3', podLead: 'Vihaan T',  reviewers: ['vihaan.t1@turing.com',  'anika.p2@turing.com']  },
  { squad: 'Squad 2', pod: 'S2-P1', podLead: 'Prudhvi R', reviewers: ['prudhvi.r1@turing.com', 'sneha.b3@turing.com']  },
  { squad: 'Squad 2', pod: 'S2-P2', podLead: 'Ishaan G',  reviewers: ['ishaan.g1@turing.com',  'rhea.k5@turing.com']   },
  { squad: 'Squad 2', pod: 'S2-P3', podLead: 'Kavya N',   reviewers: ['kavya.n1@turing.com',   'arjun.d2@turing.com']  },
  { squad: 'Squad 3', pod: 'S3-P1', podLead: 'Reyansh M', reviewers: ['reyansh.m1@turing.com', 'navya.l3@turing.com']  },
  { squad: 'Squad 3', pod: 'S3-P2', podLead: 'Saanvi B',  reviewers: ['saanvi.b1@turing.com',  'ayaan.r2@turing.com']  },
  { squad: 'Squad 3', pod: 'S3-P3', podLead: 'Krish V',   reviewers: ['krish.v1@turing.com',   'myra.s4@turing.com']   },
  { squad: 'Squad 4', pod: 'S4-P1', podLead: 'Tara J',    reviewers: ['tara.j1@turing.com',    'dhruv.h2@turing.com']  },
  { squad: 'Squad 4', pod: 'S4-P2', podLead: 'Veer A',    reviewers: ['veer.a1@turing.com',    'siya.c3@turing.com']   },
];

const FIRST_NAMES = [
  'aarav','vivaan','aditya','vihaan','arjun','ananya','aanya','isha','navya','siya',
  'rohan','ishaan','kabir','reyansh','dhruv','myra','riya','tara','priya','meera',
  'omar','fatima','aisha','noah','sofia','liam','olivia','ethan','lucas','isabella',
  'ahmed','chloe','samuel','mira','nathan','zara','daniel','sara','jacob','amara',
  'farhan','eliza','ravi','jenna','kevin','anita','benjamin','lena','isaac','mila',
];
const LAST_LETTERS = ['s','h','t','l','k','r','m','b','p','d','a','c','n','v','g'];

const CATEGORIES  = ['Work', 'Personal', 'Health'];
const LLM_MODELS  = ['minimax 2.7', 'gpt-4o', 'claude-3.5', 'llama-3.1-70b'];
const MODES       = ['Openclaw UI'];
const VERDICTS    = ['Pass', 'Fail'];
const STATUSES    = ['Approved', 'Rejected', 'Pending'];
const REV_VERDICT = ['Approved', 'Rejected', 'Pending'];

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pick(arr, seed) {
  return arr[Math.floor(rand(seed) * arr.length)];
}
function nameFor(seed) {
  const first = pick(FIRST_NAMES, seed);
  const letter = pick(LAST_LETTERS, seed + 1);
  const num = Math.floor(rand(seed + 2) * 9) + 1;
  return `${first}.${letter}${num}@turing.com`;
}

// Stable per-pod worker rosters (8–12 workers per pod, ~100 total)
const WORKERS_BY_POD = POD_REGISTRY.reduce((acc, p, podIdx) => {
  const count = 8 + Math.floor(rand(podIdx) * 5);
  acc[p.pod] = Array.from({ length: count }, (_, i) =>
    nameFor(podIdx * 1000 + i * 7 + 13)
  );
  return acc;
}, {});

// -------- Generate raw task rows (this is what your sheets contain) --------

function generateRawRows() {
  const rows = [];
  const today = new Date();
  let taskId = 100000;

  POD_REGISTRY.forEach((podMeta, podIdx) => {
    const workers = WORKERS_BY_POD[podMeta.pod];
    const reviewers = podMeta.reviewers;
    // ~250–450 tasks per pod across the last 30 days
    const taskCount = 250 + Math.floor(rand(podIdx + 100) * 200);

    for (let i = 0; i < taskCount; i++) {
      const seed = podIdx * 10000 + i;
      const daysAgo = Math.floor(rand(seed + 1) * 30);
      const submitted = new Date(today);
      submitted.setDate(today.getDate() - daysAgo);

      const reviewedDelay = Math.floor(rand(seed + 2) * 3); // 0–2 days after submit
      const reviewDate = new Date(submitted);
      reviewDate.setDate(submitted.getDate() + reviewedDelay);

      const isPending = rand(seed + 3) < 0.08;
      const llmVerdict = isPending ? '' : (rand(seed + 4) < 0.83 ? 'Pass' : 'Fail');
      const reviewerVerdict = isPending
        ? 'Pending'
        : rand(seed + 5) < 0.84
        ? 'Approved'
        : 'Rejected';
      const currentStatus = isPending ? 'Pending' : reviewerVerdict;
      const broken = rand(seed + 6) < 0.04;

      rows.push({
        squad: podMeta.squad,
        pod: podMeta.pod,
        podLead: podMeta.podLead,
        taskId: `T-${taskId++}`,
        submissionDate: submitted.toISOString().slice(0, 10),
        annotatorTuringEmail: pick(workers, seed + 7),
        annotatorWorkerEmail: pick(workers, seed + 7).replace('@turing.com', '-tmp@turing.com'),
        personaId: `P-${String(40 + Math.floor(rand(seed + 8) * 12)).padStart(3, '0')}`,
        mode: MODES[0],
        category: pick(CATEGORIES, seed + 9),
        userMessageCount: 4 + Math.floor(rand(seed + 10) * 20),
        timeTakenMinutes: Math.round((0.5 + rand(seed + 11) * 1.5) * 10) / 10,
        llmModel: pick(LLM_MODELS, seed + 12),
        annotatorComments: '',
        broken,
        llmScore: isPending ? null : Math.round((3 + rand(seed + 13) * 1.9) * 10) / 10,
        llmVerdict,
        currentStatus,
        reviewDate: isPending ? null : reviewDate.toISOString().slice(0, 10),
        reviewerVerdict,
        reviewerComment: '',
        podLeadOrPeerReviewer: pick(reviewers, seed + 14),
        llmReviewDocLink: '',
        manualReviewLink: '',
      });
    }
  });

  return rows;
}

// -------- Aggregate raw rows into the JSON the dashboard expects --------

function aggregate(rows) {
  const totalCreated = rows.length;
  const decided = rows.filter((r) => r.llmVerdict);
  const passed  = decided.filter((r) => r.llmVerdict === 'Pass');
  const failed  = decided.filter((r) => r.llmVerdict === 'Fail');

  const reviewed = rows.filter((r) => r.reviewerVerdict !== 'Pending');
  const approved = reviewed.filter((r) => r.reviewerVerdict === 'Approved');

  const llmScored    = rows.filter((r) => typeof r.llmScore === 'number');
  const reviewScored = reviewed; // proxy — in real data this is the rubric score

  // Daily series (last 30 days)
  const dayMap = new Map();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { date: key, created: 0, passed: 0, failed: 0 });
  }
  rows.forEach((r) => {
    const d = dayMap.get(r.submissionDate);
    if (!d) return;
    d.created += 1;
    if (r.llmVerdict === 'Pass') d.passed += 1;
    if (r.llmVerdict === 'Fail') d.failed += 1;
  });

  // Per-pod aggregation
  const podMap = new Map();
  POD_REGISTRY.forEach((p) => {
    podMap.set(p.pod, {
      pod: p.pod,
      squad: p.squad,
      podLead: p.podLead,
      reviewers: p.reviewers,
      workers: WORKERS_BY_POD[p.pod] || [],
      tasks: 0,
      llmPassed: 0,
      llmFailed: 0,
      reviewerApproved: 0,
      reviewerDecided: 0,
      llmScoreSum: 0,
      llmScoreN: 0,
      broken: 0,
      lastSubmission: null,
    });
  });
  rows.forEach((r) => {
    const p = podMap.get(r.pod);
    if (!p) return;
    p.tasks += 1;
    if (r.llmVerdict === 'Pass') p.llmPassed += 1;
    if (r.llmVerdict === 'Fail') p.llmFailed += 1;
    if (r.reviewerVerdict === 'Approved') {
      p.reviewerApproved += 1;
      p.reviewerDecided += 1;
    } else if (r.reviewerVerdict === 'Rejected') {
      p.reviewerDecided += 1;
    }
    if (typeof r.llmScore === 'number') {
      p.llmScoreSum += r.llmScore;
      p.llmScoreN += 1;
    }
    if (r.broken) p.broken += 1;
    if (!p.lastSubmission || r.submissionDate > p.lastSubmission) {
      p.lastSubmission = r.submissionDate;
    }
  });

  const pods = Array.from(podMap.values()).map((p) => {
    const verdicted = p.llmPassed + p.llmFailed;
    const llmPassRate = verdicted ? +((p.llmPassed / verdicted) * 100).toFixed(1) : null;
    const reviewerApprovalRate = p.reviewerDecided
      ? +((p.reviewerApproved / p.reviewerDecided) * 100).toFixed(1)
      : null;
    const avgLLM = p.llmScoreN ? +(p.llmScoreSum / p.llmScoreN).toFixed(2) : null;
    const today = new Date().toISOString().slice(0, 10);
    const submittedToday = p.lastSubmission === today;
    const healthy =
      submittedToday && (llmPassRate ?? 0) >= 70 && p.broken / Math.max(p.tasks, 1) < 0.1;
    return {
      pod: p.pod,
      squad: p.squad,
      podLead: p.podLead,
      reviewersCount: p.reviewers.length,
      workersCount: p.workers.length,
      tasks: p.tasks,
      llmPassRate,
      reviewerApprovalRate,
      avgLLM,
      broken: p.broken,
      healthy,
      lastSubmission: p.lastSubmission,
    };
  });

  // Per-squad rollup
  const squadMap = new Map();
  pods.forEach((p) => {
    if (!squadMap.has(p.squad)) {
      squadMap.set(p.squad, {
        squad: p.squad,
        pods: 0,
        healthyPods: 0,
        tasks: 0,
        llmPassRateNum: 0,
        llmPassRateDen: 0,
      });
    }
    const s = squadMap.get(p.squad);
    s.pods += 1;
    if (p.healthy) s.healthyPods += 1;
    s.tasks += p.tasks;
  });
  rows.forEach((r) => {
    if (!r.llmVerdict) return;
    const s = squadMap.get(r.squad);
    if (!s) return;
    s.llmPassRateDen += 1;
    if (r.llmVerdict === 'Pass') s.llmPassRateNum += 1;
  });
  const squads = Array.from(squadMap.values()).map((s) => ({
    squad: s.squad,
    pods: s.pods,
    healthyPods: s.healthyPods,
    tasks: s.tasks,
    llmPassRate: s.llmPassRateDen
      ? +((s.llmPassRateNum / s.llmPassRateDen) * 100).toFixed(1)
      : null,
  }));

  // Annotators (workers) leaderboard — top 50 by tasks
  const annMap = new Map();
  rows.forEach((r) => {
    const key = r.annotatorTuringEmail;
    if (!annMap.has(key)) {
      annMap.set(key, {
        name: key, pod: r.pod, squad: r.squad,
        tasks: 0, passed: 0, failed: 0, approved: 0, decided: 0,
        llmScoreSum: 0, llmScoreN: 0,
        timeSum: 0, timeN: 0, golden: 0,
      });
    }
    const a = annMap.get(key);
    a.tasks += 1;
    if (r.llmVerdict === 'Pass') a.passed += 1;
    if (r.llmVerdict === 'Fail') a.failed += 1;
    if (r.reviewerVerdict === 'Approved') { a.approved += 1; a.decided += 1; }
    else if (r.reviewerVerdict === 'Rejected') { a.decided += 1; }
    if (typeof r.llmScore === 'number') { a.llmScoreSum += r.llmScore; a.llmScoreN += 1; }
    a.timeSum += r.timeTakenMinutes * 60;
    a.timeN += 1;
  });
  const annotators = Array.from(annMap.values())
    .map((a) => {
      const verdicted = a.passed + a.failed;
      return {
        name: a.name,
        pod: a.pod,
        squad: a.squad,
        tasks: a.tasks,
        llmPassPct: verdicted ? +((a.passed / verdicted) * 100).toFixed(1) : null,
        approvalPct: a.decided ? +((a.approved / a.decided) * 100).toFixed(1) : null,
        avgReview: a.decided ? +(3.4 + (a.approved / Math.max(a.decided, 1)) * 1.4).toFixed(2) : null,
        avgLLM: a.llmScoreN ? +(a.llmScoreSum / a.llmScoreN).toFixed(2) : null,
        avgTimeSec: a.timeN ? Math.round(a.timeSum / a.timeN) : null,
        golden: a.golden,
      };
    })
    .sort((x, y) => y.tasks - x.tasks)
    .slice(0, 50);

  // Reviewers leaderboard
  const revMap = new Map();
  rows.filter((r) => r.podLeadOrPeerReviewer).forEach((r) => {
    const key = r.podLeadOrPeerReviewer;
    if (!revMap.has(key)) {
      revMap.set(key, {
        name: key, pod: r.pod, squad: r.squad,
        tasks: 0, passed: 0, failed: 0, approved: 0, decided: 0,
        llmScoreSum: 0, llmScoreN: 0,
      });
    }
    const rev = revMap.get(key);
    rev.tasks += 1;
    if (r.llmVerdict === 'Pass') rev.passed += 1;
    if (r.llmVerdict === 'Fail') rev.failed += 1;
    if (r.reviewerVerdict === 'Approved') { rev.approved += 1; rev.decided += 1; }
    else if (r.reviewerVerdict === 'Rejected') { rev.decided += 1; }
    if (typeof r.llmScore === 'number') { rev.llmScoreSum += r.llmScore; rev.llmScoreN += 1; }
  });
  const reviewers = Array.from(revMap.values())
    .map((r) => {
      const verdicted = r.passed + r.failed;
      return {
        name: r.name,
        pod: r.pod,
        squad: r.squad,
        tasks: r.tasks,
        llmPassPct: verdicted ? +((r.passed / verdicted) * 100).toFixed(1) : null,
        approvalPct: r.decided ? +((r.approved / r.decided) * 100).toFixed(1) : null,
        avgReview: r.decided ? +(3.6 + (r.approved / Math.max(r.decided, 1)) * 1.2).toFixed(2) : null,
        avgLLM: r.llmScoreN ? +(r.llmScoreSum / r.llmScoreN).toFixed(2) : null,
        avgTimeSec: 45 + Math.floor(rand(r.name.length) * 30),
        golden: 0,
      };
    })
    .sort((x, y) => y.tasks - x.tasks);

  const llmPassRate = decided.length ? +((passed.length / decided.length) * 100).toFixed(1) : 0;
  const reviewerApprovalRate = reviewed.length
    ? +((approved.length / reviewed.length) * 100).toFixed(1)
    : 0;

  const avgLLMScore = llmScored.length
    ? +(llmScored.reduce((s, r) => s + r.llmScore, 0) / llmScored.length).toFixed(2)
    : 0;
  const avgReviewScore = reviewScored.length
    ? +(3.6 + (approved.length / Math.max(reviewed.length, 1)) * 0.5).toFixed(2)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    cached: true,
    overview: {
      totalTasksCreated: totalCreated,
      llmApprovedTasks: passed.length,
      llmFailedTasks: failed.length,
      healthyPods: {
        healthy: pods.filter((p) => p.healthy).length,
        total: pods.length,
      },
      llmPassRate,
      reviewerApprovalRate,
      avgReviewScore,
      avgLLMScore,
      avgReviewSampleSize: reviewScored.length,
      avgLLMSampleSize: llmScored.length,
    },
    daily: Array.from(dayMap.values()),
    totalDelivered: approved.length,
    annotatorKpis: {
      topAnnotatorsCount: annotators.length,
      reviewersTrackedCount: reviewers.length,
      totalTasks: annotators.reduce((s, a) => s + a.tasks, 0),
      avgTasksPerAnnotator:
        annotators.length
          ? +((annotators.reduce((s, a) => s + a.tasks, 0) / annotators.length).toFixed(1))
          : 0,
    },
    annotators,
    reviewers,
    pods,
    squads,
  };
}

const RAW_ROWS = generateRawRows();
export const mockDashboard = aggregate(RAW_ROWS);
