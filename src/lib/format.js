export const fmtInt = (n) =>
  typeof n === 'number' ? n.toLocaleString('en-US') : '—';

export const fmtPct = (n, digits = 1) =>
  typeof n === 'number' ? `${n.toFixed(digits)}%` : '—';

export const fmtScore = (n, digits = 2) =>
  typeof n === 'number' ? n.toFixed(digits) : '—';

export const fmtTime = (sec) => {
  if (typeof sec !== 'number') return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const fmtDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const fmtDateTime = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.toLocaleDateString('en-US')}, ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })}`;
};
