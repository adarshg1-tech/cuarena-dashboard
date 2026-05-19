import { mockDashboard } from './mockData.js';

// Single place to fetch dashboard data.
//
// If VITE_APPS_SCRIPT_URL is set in .env, we hit that URL and expect JSON
// in the same shape as `mockDashboard`. Otherwise we serve mock data so
// the UI works immediately with no backend.
//
// Expected JSON shape (see src/lib/mockData.js for an example):
// {
//   generatedAt: ISO string,
//   cached: boolean,
//   overview: {
//     totalTasksCreated, llmApprovedTasks, llmFailedTasks,
//     healthyPods: { healthy, total },
//     llmPassRate, reviewerApprovalRate,
//     avgReviewScore, avgLLMScore,
//     avgReviewSampleSize, avgLLMSampleSize,
//   },
//   daily: [{ date: 'YYYY-MM-DD', created, passed, failed }, ...],
//   totalDelivered: number,
//   annotatorKpis: {
//     topAnnotatorsCount, reviewersTrackedCount,
//     totalTasks, avgTasksPerAnnotator,
//   },
//   annotators: [{ name, tasks, llmPassPct, approvalPct, avgReview, avgLLM, avgTimeSec, golden }, ...],
//   reviewers:  [{ name, tasks, llmPassPct, approvalPct, avgReview, avgLLM, avgTimeSec, golden }, ...],
// }

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function fetchDashboardData({ force = false } = {}) {
  if (!APPS_SCRIPT_URL) {
    // simulate small network delay so the loading UI is visible in dev
    await new Promise((r) => setTimeout(r, 300));
    return { ...mockDashboard, generatedAt: new Date().toISOString() };
  }

  const sep = APPS_SCRIPT_URL.includes('?') ? '&' : '?';
  const url = force ? `${APPS_SCRIPT_URL}${sep}refresh=1` : APPS_SCRIPT_URL;

  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Apps Script returned ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const isLive = Boolean(APPS_SCRIPT_URL);
