// BOTTOM COMPONENT — Daily Activity chart + Total Tasks Delivered banner.
// Mirrors the right column of the Puffin openclaw dashboard.

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtDate, fmtInt } from '../lib/format.js';

const COLORS = {
  created: '#2563eb',
  passed: '#10b981',
  failed: '#ef4444',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="mb-1 text-xs font-semibold text-slate-800">
        {new Date(label).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="space-y-0.5 text-xs">
        <Row color={COLORS.created} label="Total Tasks Created" value={row.created} />
        <Row color={COLORS.passed}  label="LLM Passed Tasks"    value={row.passed} />
        <Row color={COLORS.failed}  label="LLM Failed Tasks"    value={row.failed} />
      </div>
    </div>
  );
}

function Row({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-slate-600">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold text-slate-900">{fmtInt(value)}</span>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function DailyActivity({ daily, totalDelivered }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Daily Activity
      </h2>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            DAILY TASK CREATION (LAST 30 DAYS)
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <LegendDot color={COLORS.created} label="Total Tasks Created" />
            <LegendDot color={COLORS.passed}  label="LLM Passed Tasks" />
            <LegendDot color={COLORS.failed}  label="LLM Failed Tasks" />
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={COLORS.created} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={COLORS.created} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPassed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={COLORS.passed} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={COLORS.passed} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={COLORS.failed} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.failed} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                stroke="#94a3b8"
                fontSize={11}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => v.toLocaleString()}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="created"
                stroke={COLORS.created}
                strokeWidth={2}
                fill="url(#gradCreated)"
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="passed"
                stroke={COLORS.passed}
                strokeWidth={2}
                fill="url(#gradPassed)"
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke={COLORS.failed}
                strokeWidth={2}
                fill="url(#gradFailed)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card flex items-center justify-between gap-4 bg-amber-50/70 p-4 ring-1 ring-amber-100">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            ★ Total Tasks Delivered
          </div>
          <div className="mt-1 text-3xl font-bold text-amber-700">
            {fmtInt(totalDelivered)}
          </div>
        </div>
      </div>
    </section>
  );
}
