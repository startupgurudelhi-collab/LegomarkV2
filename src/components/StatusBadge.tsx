import React from 'react';

interface StatusBadgeProps {
  status: 'ok' | 'degraded' | 'error' | 'loading';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const configs = {
    ok: {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      dot: 'bg-emerald-500',
      defaultLabel: 'PostgreSQL Active & Healthy',
    },
    degraded: {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      dot: 'bg-amber-500',
      defaultLabel: 'Awaiting DB Connection',
    },
    error: {
      bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      dot: 'bg-rose-500',
      defaultLabel: 'Connection Failed',
    },
    loading: {
      bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
      dot: 'bg-slate-400 animate-pulse',
      defaultLabel: 'Checking Status...',
    },
  };

  const current = configs[status] || configs.loading;

  return (
    <span
      id="status-badge"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${current.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span>{label || current.defaultLabel}</span>
    </span>
  );
};
