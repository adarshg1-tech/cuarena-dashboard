import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Search } from 'lucide-react';
import { fmtInt, fmtPct, fmtScore, fmtTime } from '../lib/format.js';

const COLUMNS = [
  { key: '#',          label: '#',          sortable: false, align: 'left'  },
  { key: 'name',       label: 'NAME',       sortable: true,  align: 'left'  },
  { key: 'tasks',      label: 'TASKS',      sortable: true,  align: 'right' },
  { key: 'llmPassPct', label: 'LLM PASS %', sortable: true,  align: 'right' },
  { key: 'approvalPct',label: 'APPROVAL %', sortable: true,  align: 'right' },
  { key: 'avgReview',  label: 'AVG REVIEW', sortable: true,  align: 'right' },
  { key: 'avgLLM',     label: 'AVG LLM',    sortable: true,  align: 'right' },
  { key: 'avgTimeSec', label: 'AVG TIME',   sortable: true,  align: 'right' },
  { key: 'golden',     label: 'GOLDEN',     sortable: true,  align: 'right' },
];

function toneFor(value, kind = 'pct') {
  if (value == null) return 'text-slate-400';
  if (kind === 'pct') {
    if (value >= 90) return 'text-emerald-600';
    if (value >= 80) return 'text-amber-600';
    return 'text-red-500';
  }
  return 'text-slate-700';
}

export default function AnnotatorTable({ rows, title = 'TOP 50 ANNOTATORS', filename = 'annotators.xlsx' }) {
  const [query, setQuery]     = useState('');
  const [sortKey, setSortKey] = useState('tasks');
  const [sortDir, setSortDir] = useState('desc');

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
    const sorted = [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return sorted;
  }, [rows, query, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  function exportExcel() {
    const exportRows = filteredSorted.map((r, i) => ({
      '#': i + 1,
      Name: r.name,
      Tasks: r.tasks,
      'LLM Pass %': r.llmPassPct,
      'Approval %': r.approvalPct,
      'Avg Review': r.avgReview,
      'Avg LLM': r.avgLLM,
      'Avg Time (sec)': r.avgTimeSec,
      Golden: r.golden,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Annotators');
    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <button onClick={exportExcel} className="btn-outline">
          <Download className="h-3.5 w-3.5" />
          Export to Excel
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search annotator name..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing {filteredSorted.length} of {rows.length}
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
                    c.align === 'right' ? 'text-right' : 'text-left'
                  } ${c.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                  onClick={c.sortable ? () => handleSort(c.key) : undefined}
                >
                  {c.label}
                  {c.sortable && sortKey === c.key && (
                    <span className="ml-1 text-slate-400">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSorted.map((r, i) => (
              <tr key={r.name} className="hover:bg-slate-50/60">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-800">{fmtInt(r.tasks)}</td>
                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${toneFor(r.llmPassPct)}`}>{fmtPct(r.llmPassPct)}</td>
                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${toneFor(r.approvalPct)}`}>{fmtPct(r.approvalPct)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-700">{r.avgReview == null ? '—' : fmtScore(r.avgReview)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-700">{fmtScore(r.avgLLM)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-700">{fmtTime(r.avgTimeSec)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-700">{r.golden}</td>
              </tr>
            ))}
            {filteredSorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-slate-400">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
