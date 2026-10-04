import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe,
  Layers,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { fetchCommandCenterOverview } from '../../services/command-center.service';
import {
  LacsCommandCenterOverview,
  LacsActionItem,
  LacsModuleStatus,
  HealthIndexComponent,
} from '../../types/command-center';
import { AdminNavSection } from './AdminSidebar';

interface AdminCommandCenterPageProps {
  onNavigateSection?: (section: AdminNavSection) => void;
}

export const AdminCommandCenterPage: React.FC<AdminCommandCenterPageProps> = ({
  onNavigateSection,
}) => {
  const [overview, setOverview] = useState<LacsCommandCenterOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchCommandCenterOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load SEO Command Center telemetry');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActionClick = (sectionName: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionName as AdminNavSection);
    }
  };

  // Grade color and description styling
  const getGradeTheme = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return {
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          ringColor: '#10B981',
          label: 'Optimal Health',
        };
      case 'GOOD':
        return {
          textColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          ringColor: '#3B82F6',
          label: 'Healthy Foundation',
        };
      case 'NEEDS_IMPROVEMENT':
        return {
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          ringColor: '#F59E0B',
          label: 'Action Required',
        };
      case 'CRITICAL':
      default:
        return {
          textColor: 'text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          ringColor: '#F43F5E',
          label: 'Critical Gaps',
        };
    }
  };

  const getPriorityStyle = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  const getStatusBadge = (status: LacsModuleStatus['status']) => {
    switch (status) {
      case 'connected':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live / Active
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Attention Needed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Pending Data
          </span>
        );
      case 'unconfigured':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Unconfigured
          </span>
        );
    }
  };

  // Render SVG Circular Gauge for Health Index
  const renderRadialGauge = (score: number, ringColor: string) => {
    const radius = 62;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

    return (
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white">{score}</span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>
    );
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-800 rounded" />
            <div className="h-4 w-96 bg-slate-800/60 rounded" />
          </div>
          <div className="h-10 w-28 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-slate-900 border border-slate-800 rounded-xl" />
          <div className="lg:col-span-2 h-64 bg-slate-900 border border-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  // Error State
  if (error || !overview) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Unable to Aggregate Command Center</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error || 'An unexpected error occurred while compiling multi-module SEO telemetry.'}
          </p>
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-colors cursor-pointer shadow-lg shadow-orange-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Aggregation
          </button>
        </div>
      </div>
    );
  }

  const { healthIndex, kpis, priorityActions, moduleStatuses, generatedAt } = overview;
  const gradeTheme = getGradeTheme(healthIndex.grade);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* 1. Header Bar with Status and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Gauge className="w-6 h-6 text-orange-500" />
              AI SEO Command Center
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/25 text-orange-400">
              LACS #23
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized organic search orchestration across on-page audits, SERP rankings, backlinks, and content equity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Command Center Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Tier: 0-100 Composite Health Index & 4 Component Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Composite Health Card (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-900 to-[#0A1026] border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                SEO Health Index
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${gradeTheme.bgColor} ${gradeTheme.textColor} ${gradeTheme.borderColor}`}
              >
                {healthIndex.grade.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-center py-3">
              {renderRadialGauge(healthIndex.score, gradeTheme.ringColor)}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center space-y-1">
            <div className={`text-sm font-semibold ${gradeTheme.textColor}`}>
              {gradeTheme.label}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {healthIndex.status}
            </p>
          </div>
        </div>

        {/* 4 Component Score Bars (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Multivariate SEO Pillars
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic weight redistribution based on real module telemetry
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Composite Total: <strong className="text-white">100% Weighted</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(healthIndex.components).map((comp: HealthIndexComponent) => {
                const pctWeight = Math.round(comp.effectiveWeight * 100);
                return (
                  <div
                    key={comp.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          {comp.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{comp.sourceModule}</span>
                          <span aria-hidden="true">·</span>
                          <span className={comp.isAvailable ? 'text-slate-300' : 'text-slate-400'}>
                            {comp.statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white leading-none">
                          {comp.score}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {pctWeight}% Weight
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          comp.score >= 80
                            ? 'bg-emerald-500'
                            : comp.score >= 60
                            ? 'bg-blue-500'
                            : comp.score >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>{comp.keyMetricLabel}:</span>
                      <span className="font-medium text-slate-200">{comp.keyMetricValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Redistribution Active</span>
            <span className="text-slate-400">
              Unconfigured modules shed weight proportionally to active pillars
            </span>
          </div>
        </div>
      </div>

      {/* 3. Essential KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Unified SEO Performance Metrics
          </h2>
          <span className="text-xs text-slate-400">Live Telemetry Snapshot</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* KPI 1: On-Page Catalog Avg */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              On-Page SEO
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.catalogAvgScore !== null ? `${kpis.catalogAvgScore}` : '—'}
              </span>
              <span className="text-xs text-slate-400 ml-1">/100</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.totalArticlesAudited} articles audited
            </div>
          </div>

          {/* KPI 2: SERP Impressions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              GSC 28d Impressions
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.gscImpressions28d !== null ? kpis.gscImpressions28d.toLocaleString() : '—'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.gscClicks28d !== null ? `${kpis.gscClicks28d.toLocaleString()} clicks` : 'GSC unlinked'}
            </div>
          </div>

          {/* KPI 3: Average SERP Position */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Avg SERP Rank
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.gscAvgPosition28d !== null ? `#${kpis.gscAvgPosition28d.toFixed(1)}` : '—'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.gscConnected ? 'Google Search Console' : 'Awaiting property link'}
            </div>
          </div>

          {/* KPI 4: Organic Traffic Share */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Organic Share
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.organicSharePercentage !== null ? `${kpis.organicSharePercentage}%` : '0%'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.totalOrganicLandings30d} landings (30d)
            </div>
          </div>

          {/* KPI 5: Backlink Opportunities */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Opportunities
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.backlinkOpportunitiesCount}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.strikingDistanceCount} striking distance
            </div>
          </div>

          {/* KPI 6: Tracked Backlinks Active */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Tracked Links
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold text-white">
                {kpis.trackedBacklinksActive}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {kpis.trackedBacklinksTotal}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.trackedBacklinksDofollowPct}% dofollow equity
            </div>
          </div>
        </div>
      </div>

      {/* 4. Priority Action Queue (Deep Links) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Priority Action Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rank-ordered recommendations with single-click navigation into target modules
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {priorityActions.length} Action{priorityActions.length === 1 ? '' : 's'} Pending
          </span>
        </div>

        {priorityActions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">All Priority Items Addressed</div>
            <p className="text-xs text-slate-400">
              No immediate critical SEO gaps or link degradation detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {priorityActions.map((action: LacsActionItem) => {
              const priorityClass = getPriorityStyle(action.priority);
              return (
                <div
                  key={action.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors shadow-md group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityClass}`}>
                        {action.priority} PRIORITY
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>{action.sourceModule}</span>
                        {action.targetUrl && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                              {action.targetUrl}
                            </span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-orange-300 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => handleActionClick(action.actionSection)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 hover:border-orange-500 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <span>{action.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. LACS Modules Grid (#17–#22) with Quick Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              LACS Architecture & Subsystem Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status and quick navigation into individual AI & SEO subsystems
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleStatuses.map((mod: LacsModuleStatus) => (
            <div
              key={mod.moduleId}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3.5 transition-colors shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {mod.badge}
                  </span>
                  {getStatusBadge(mod.status)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">{mod.name}</h3>
                  <div className="text-xs text-orange-200/90 font-medium mt-0.5">
                    {mod.headline}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {mod.subtext}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span>{mod.primaryMetric.label}:</span>{' '}
                  <strong className="text-slate-200">{mod.primaryMetric.value}</strong>
                </div>

                <button
                  onClick={() => handleActionClick(mod.navigationSection)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminCommandCenterPage;
