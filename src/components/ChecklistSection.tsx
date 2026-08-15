import React from 'react';
import { CheckCircle2, ShieldCheck, Layers, Database, Lock, Cpu, Server } from 'lucide-react';

export const ChecklistSection: React.FC = () => {
  const items = [
    {
      title: 'PostgreSQL Native Stack (pg + Drizzle ORM)',
      desc: 'Exclusive use of PostgreSQL with drizzle-orm/pg-core and centralized pg.Pool. Zero MySQL, SQLite, or mock fallbacks.',
      icon: <Database className="w-4 h-4 text-emerald-600" />,
    },
    {
      title: 'Decoupled Layered Architecture',
      desc: 'Strict separation: Routes → Controllers → Services → Repositories → PostgreSQL. UI components never query database.',
      icon: <Layers className="w-4 h-4 text-indigo-600" />,
    },
    {
      title: 'Coolify & Docker Healthcheck Ready',
      desc: 'Full /api/health and /api/liveness endpoints reflecting real database connectivity state with sanitized production responses.',
      icon: <Server className="w-4 h-4 text-sky-600" />,
    },
    {
      title: 'Security & Sanitized Error Pipeline',
      desc: 'Helmet HTTP headers, configurable CORS, 2MB body limit protection, and masked error messages in production.',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
    },
    {
      title: 'Isolated Data Model & Schema Migration Guard',
      desc: 'Drizzle migration framework configured with strict failure logging. Independent future entity models prepared.',
      icon: <Lock className="w-4 h-4 text-amber-600" />,
    },
    {
      title: 'Structured Server Logger & Clean Shutdown',
      desc: 'JSON/formatted structured logger with SIGTERM/SIGINT listeners ensuring zero dropped connections or leaked pools.',
      icon: <Cpu className="w-4 h-4 text-teal-600" />,
    },
  ];

  return (
    <div id="architecture-checklist-card" className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Foundation Architectural Verification
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Validation of non-negotiable architectural mandates for LEGOMARK India
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            id={`compliance-item-${idx}`}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-white border border-slate-200/60 shadow-2xs">{item.icon}</div>
              <span className="text-xs font-bold text-slate-800 tracking-tight">{item.title}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pl-7">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
