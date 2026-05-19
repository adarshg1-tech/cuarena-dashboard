import { RefreshCw, Zap } from 'lucide-react';
import { fmtDateTime } from '../lib/format.js';

export default function Header({ generatedAt, cached, isRefreshing, onRefresh }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
            CU Arena dashboard
          </h1>
          <p className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            read-only · never writes to source sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">
            Updated {generatedAt ? fmtDateTime(generatedAt) : '—'}
          </span>
          {cached && (
            <span className="pill bg-slate-100 text-slate-600">cached</span>
          )}
          <button
            type="button"
            disabled
            className="btn-outline cursor-default opacity-80"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isRefreshing ? 'Refreshing…' : 'Refreshing…'}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-primary"
          >
            <Zap className="h-3.5 w-3.5" />
            Force re-scan
          </button>
        </div>
      </div>
    </header>
  );
}
