export default function MetricCard({
  label,
  value,
  sub,
  tone = 'slate',
  size = 'md',
  active = false,
}) {
  const toneClasses = {
    slate: 'text-slate-900',
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
  };

  const valueSize = size === 'lg' ? 'text-4xl' : 'text-3xl';

  return (
    <div
      className={`card p-4 transition ${
        active ? 'ring-2 ring-blue-500/60 bg-blue-50/40' : ''
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={`mt-2 font-bold leading-none ${valueSize} ${toneClasses[tone] || toneClasses.slate}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-xs text-slate-500">{sub}</div>
      )}
    </div>
  );
}
