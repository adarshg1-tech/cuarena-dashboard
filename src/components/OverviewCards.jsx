// TOP COMPONENT — all the headline numbers for the Dashboard tab.
// Mirrors the "OVERVIEW" column from the Puffin openclaw dashboard.

import MetricCard from './MetricCard.jsx';
import { fmtInt, fmtPct, fmtScore } from '../lib/format.js';

export default function OverviewCards({ overview }) {
  if (!overview) return null;

  const podsValue = `${overview.healthyPods.healthy} / ${overview.healthyPods.total}`;
  const podsHealthy =
    overview.healthyPods.healthy === overview.healthyPods.total;

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Overview
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          label="Total Task Created"
          value={fmtInt(overview.totalTasksCreated)}
          sub="across all pods"
          tone="blue"
          active
        />
        <MetricCard
          label="LLM Approved Tasks"
          value={fmtInt(overview.llmApprovedTasks)}
          sub="LLM verdict = Pass"
          tone="green"
        />
        <MetricCard
          label="LLM Failed Tasks"
          value={fmtInt(overview.llmFailedTasks)}
          sub="LLM verdict = Fail"
          tone="red"
        />
        <MetricCard
          label="Healthy Pods"
          value={podsValue}
          sub={podsHealthy ? 'no errors' : 'some pods unhealthy'}
          tone={podsHealthy ? 'green' : 'amber'}
        />
        <MetricCard
          label="LLM Pass Rate"
          value={fmtPct(overview.llmPassRate)}
          sub="of verdicted tasks"
          tone="green"
        />
        <MetricCard
          label="Reviewer Approval"
          value={fmtPct(overview.reviewerApprovalRate)}
          sub="of decided reviews"
          tone="green"
        />
        <MetricCard
          label="Avg Review Score"
          value={fmtScore(overview.avgReviewScore)}
          sub={`over ${fmtInt(overview.avgReviewSampleSize)} tasks`}
        />
        <MetricCard
          label="Avg LLM Score"
          value={fmtScore(overview.avgLLMScore)}
          sub={`over ${fmtInt(overview.avgLLMSampleSize)} tasks`}
        />
      </div>
    </section>
  );
}
