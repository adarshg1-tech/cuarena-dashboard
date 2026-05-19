import { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { fmtInt, fmtPct, fmtScore } from '../lib/format.js';

const COLUMNS = [
  { key: 'pod',                    label: 'POD',              align: 'left',  sortable: true  },
  { key: 'squad',                  label: 'SQUAD',            align: 'left',  sortable: true  },
  { key: 'podLead',                label: 'POD LEAD',         align: 'left',  sortable: true  },
  { key: 'workersCount',           label: 'WORKERS',          align: 'right', sortable: true  },
  { key: 'reviewersCount',         label: 'REVIEWERS',        align: 'right', sortable: true  },
  { key: 'tasks',                  label: 'TASKS',            align: 'right', sortable: true  },
  { key: 'llmPassRate',            label: 'LLM PASS %',       align: 'right', sortable: true  },
  { key: 'reviewerApprovalRate',   label: 'APPROVAL %',       align: 'right', sortable: true  },
  { key: 'avgLLM',                 label: 'AVG LLM',          align: 'right', sortable: true  },
  { key: 'broken',                 label: 'BROKEN',           align: 'right', sortable: true  },
  { key: 'healthy',                label: 'STATUS',           align: 'center', sortable: true },
];

function pctTone(v) {
  if (v == null) return 'text-slate-400';
  if (v >= 90) return 'text-emerald-600';
  if (v >= 80) return 'text-amber-600';
  return 'text-red-500';
}

export default function PodsView({ pods, squads }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('tasks');
  const [sortDir, setSortDir] = useState('desc');

  const sortedPods = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? pods.filter(
          (p) =>
            p.pod.toLowerCase().includes(q) ||
            p.squad.toLowerCase().includes(q) ||
            p.podLead.toLowerCase().includes(q)
        )
      : pods;
    const sorted = [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      if (typeof va === 'boolean') return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return sorted;
  }, [pods, query, sortKey, sortDir]);

  function toggleSort(key) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'pod' || key === 'squad' || key === 'podLead' ? 'asc' : 'desc');
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Squad Health
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {squads.map((s) => {
            const ok = s.healthyPods === s.pods;
            return (
              <div key={s.squad} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{s.squad}</span>
                  <span
                    className={`pill ${
                      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {s.healthyPods}/{s.pods} pods
                  </span>
                </div>
                <div className="mt-2 text-3xl font-bold leading-none text-slate-900">
                  {fmtInt(s.tasks)}
                </div>
                <div className="mt-1 text-xs text-slate-500">tasks across {s.pods} pods</div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-500">LLM pass</span>
                  <span className={`font-semibold ${pctTone(s.llmPassRate)}`}>
                    {fmtPct(s.llmPassRate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pod Leaderboard
            </h3>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pod, squad, or lead..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-2 font-semibold ${
                        c.align === 'right'
                          ? 'text-right'
                          : c.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } cursor-pointer select-none hover:text-slate-700`}
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.label}
                      {sortKey === c.key && (
                        <span className="ml-1 text-slate-400">
                          {sortDir === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPods.map((p) => (
                  <tr key={p.pod} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 font-semibold text-slate-800">{p.pod}</td>
                    <td className="px-4 py-2 text-slate-700">{p.squad}</td>
                    <td className="px-4 py-2 text-slate-700">{p.podLead}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-700">{p.workersCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-700">{p.reviewersCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{fmtInt(p.tasks)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${pctTone(p.llmPassRate)}`}>{fmtPct(p.llmPassRate)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${pctTone(p.reviewerApprovalRate)}`}>{fmtPct(p.reviewerApprovalRate)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-700">{p.avgLLM == null ? '—' : fmtScore(p.avgLLM)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${p.broken > 0 ? 'text-red-500 font-semibold' : 'text-slate-700'}`}>{fmtInt(p.broken)}</td>
                    <td className="px-4 py-2 text-center">
                      {p.healthy ? (
                        <span className="pill bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> healthy
                        </span>
                      ) : (
                        <span className="pill bg-amber-50 text-amber-700">
                          <AlertCircle className="h-3 w-3" /> attention
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {sortedPods.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-slate-400">
                      No pods match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
