import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import OverviewCards from './components/OverviewCards.jsx';
import DailyActivity from './components/DailyActivity.jsx';
import AnnotatorKPIs from './components/AnnotatorKPIs.jsx';
import PodsView from './components/PodsView.jsx';
import { fetchDashboardData, isLive } from './lib/dataSource.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pods',      label: 'Pods' },
  { id: 'annotator', label: 'Annotator KPIs' },
];

export default function App() {
  const [tab, setTab]     = useState('dashboard');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const d = await fetchDashboardData({ force: silent });
      setData(d);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        generatedAt={data?.generatedAt}
        cached={data?.cached}
        isRefreshing={refreshing}
        onRefresh={() => load(true)}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {!isLive && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <strong>Demo mode:</strong> showing built-in mock data. Set{' '}
            <code className="rounded bg-amber-100 px-1">VITE_APPS_SCRIPT_URL</code>{' '}
            in <code className="rounded bg-amber-100 px-1">.env</code> to fetch live data from your Google Apps Script.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Failed to load dashboard data: {error}
          </div>
        )}

        {loading && !data ? (
          <LoadingState />
        ) : tab === 'dashboard' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            {/* TOP / LEFT COMPONENT */}
            <OverviewCards overview={data.overview} />
            {/* BOTTOM / RIGHT COMPONENT */}
            <DailyActivity daily={data.daily} totalDelivered={data.totalDelivered} />
          </div>
        ) : tab === 'pods' ? (
          <PodsView pods={data.pods || []} squads={data.squads || []} />
        ) : (
          <AnnotatorKPIs data={data} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        CU Arena Dashboard · built on top of the OpenClaw Worker Webapp
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200/60" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-[360px] rounded-xl bg-slate-200/60" />
        <div className="h-20 rounded-xl bg-slate-200/60" />
      </div>
    </div>
  );
}
