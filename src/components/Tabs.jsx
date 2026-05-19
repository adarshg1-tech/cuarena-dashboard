export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-6">
        <nav className="-mb-px flex gap-6">
          {tabs.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`relative py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
