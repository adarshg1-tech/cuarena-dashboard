import { useState } from 'react';
import MetricCard from './MetricCard.jsx';
import AnnotatorTable from './AnnotatorTable.jsx';
import { fmtInt } from '../lib/format.js';

export default function AnnotatorKPIs({ data }) {
  const [sub, setSub] = useState('annotators');
  if (!data) return null;

  const k = data.annotatorKpis;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Annotator Performance Overview
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Top 50 Annotators"
            value={fmtInt(k.topAnnotatorsCount)}
            sub="by task count"
            tone="blue"
            size="lg"
            active
          />
          <MetricCard
            label="Reviewers Tracked"
            value={fmtInt(k.reviewersTrackedCount)}
            sub="pod leads & peer reviewers"
            size="lg"
          />
          <MetricCard
            label="Total Tasks"
            value={fmtInt(k.totalTasks)}
            sub="across top 50"
            size="lg"
          />
          <MetricCard
            label="Avg Tasks / Annotator"
            value={k.avgTasksPerAnnotator.toLocaleString('en-US')}
            sub="among top 50"
            size="lg"
          />
        </div>
      </section>

      <div>
        <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1">
          {[
            { id: 'annotators', label: 'Annotators' },
            { id: 'reviewers',  label: 'Reviewers' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                sub === t.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sub === 'annotators' ? (
          <AnnotatorTable
            rows={data.annotators}
            title="TOP 50 ANNOTATORS"
            filename="cuarena-annotators.xlsx"
          />
        ) : (
          <AnnotatorTable
            rows={data.reviewers}
            title="TOP REVIEWERS"
            filename="cuarena-reviewers.xlsx"
          />
        )}
      </div>
    </div>
  );
}
