import React from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ id, title, value, subtitle, icon, highlight }) => {
  return (
    <div
      id={id}
      className={`p-5 rounded-xl border transition-all duration-200 ${
        highlight
          ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
          : 'bg-white text-slate-800 border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
        {icon && <div className={highlight ? 'text-blue-400' : 'text-slate-400'}>{icon}</div>}
      </div>
      <div className="text-xl font-bold font-mono tracking-tight">{value}</div>
      {subtitle && (
        <div className={`mt-1 text-xs ${highlight ? 'text-slate-400' : 'text-slate-500'} truncate`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
