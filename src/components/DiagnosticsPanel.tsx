import React, { useState } from 'react';
import { SystemHealthReport } from '../types/index';
import { Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';

interface DiagnosticsPanelProps {
  health: SystemHealthReport | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ health, loading, onRefresh }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  return (
    <div id="diagnostics-panel" className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Backend & Database Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active verification of PostgreSQL connection pool and Express runtime
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="toggle-json-button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showRawJson ? 'Hide Raw Response' : 'Inspect JSON (/api/health)'}
          </button>
          <button
            id="refresh-health-button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Live Probe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PostgreSQL Database Layer */}
        <div id="postgres-status-card" className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-semibold text-slate-800">PostgreSQL Status</span>
            </div>
            {health?.database.connected ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                Disconnected / Degraded
              </span>
            )}
          </div>

          <div className="text-xs space-y-1.5 text-slate-600 font-mono">
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Driver:</span>
              <span className="font-semibold text-slate-800">pg (node-postgres)</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">ORM:</span>
              <span className="font-semibold text-slate-800">Drizzle ORM (pg-core)</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">DB Latency:</span>
              <span className="font-semibold text-slate-800">
                {health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Database Name:</span>
              <span className="font-semibold text-slate-800">
                {health?.database.databaseName || 'Configured via DATABASE_URL'}
              </span>
            </div>
            {health?.database.error && (
              <div className="pt-1 text-rose-600 font-sans text-xs bg-rose-50 p-2 rounded">
                <strong>Status notice:</strong> {health.database.error}
              </div>
            )}
          </div>
        </div>

        {/* Server & Runtime Layer */}
        <div id="runtime-status-card" className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">Node / Express Runtime</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600 font-mono">
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Node Version:</span>
              <span className="font-semibold text-slate-800">{health?.system.nodeVersion || process.version}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Environment:</span>
              <span className="font-semibold text-slate-800 uppercase">{health?.environment || 'development'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Heap Memory:</span>
              <span className="font-semibold text-slate-800">
                {health?.system.memoryUsageMB.heapUsed} MB / {health?.system.memoryUsageMB.heapTotal} MB
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-400 font-sans">Target Deployment:</span>
              <span className="font-semibold text-indigo-700">Coolify / Docker</span>
            </div>
          </div>
        </div>
      </div>

      {showRawJson && (
        <div id="raw-json-inspector" className="mt-4 p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto">
          <div className="text-slate-400 mb-2 font-sans text-xs flex justify-between">
            <span>GET /api/health Response</span>
            <span>HTTP {health?.status === 'ok' ? '200 OK' : '503 Service Unavailable'}</span>
          </div>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
