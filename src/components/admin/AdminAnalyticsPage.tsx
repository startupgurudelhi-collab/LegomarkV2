import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  TrendingUp,
  Calendar,
  BarChart3,
  Globe,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';

interface PeriodMetric {
  uniqueVisitors: number;
  pageViews: number;
}

interface DailyStat {
  date: string;
  label: string;
  uniqueVisitors: number;
  pageViews: number;
}

interface PageStat {
  path: string;
  views: number;
  percentage: number;
}

interface ReferrerStat {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  today: PeriodMetric;
  yesterday: PeriodMetric;
  last7Days: PeriodMetric;
  last30Days: PeriodMetric;
  totalAllTime: PeriodMetric;
  dailyTrend: DailyStat[];
  topPages: PageStat[];
  topReferrers: ReferrerStat[];
  generatedAt: string;
}

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/admin/analytics/stats', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load analytics (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to parse analytics payload');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve visitor analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Filter daily trend data for chart range
  const filteredTrend = React.useMemo(() => {
    if (!data?.dailyTrend || data.dailyTrend.length === 0) return [];
    const count = chartRange === '7d' ? 7 : chartRange === '14d' ? 14 : 30;
    return data.dailyTrend.slice(-count);
  }, [data?.dailyTrend, chartRange]);

  // Chart max value calculation
  const maxChartValue = React.useMemo(() => {
    if (filteredTrend.length === 0) return 10;
    const peak = Math.max(
      ...filteredTrend.map((d) => Math.max(d.pageViews, d.uniqueVisitors))
    );
    return peak === 0 ? 10 : Math.ceil(peak * 1.15);
  }, [filteredTrend]);

  // Helper to format friendly page titles
  const formatPageTitle = (path: string): string => {
    if (path === '/' || path === '') return 'Homepage';
    if (path.startsWith('/services/')) {
      const slug = path.replace('/services/', '').replace(/\/$/, '');
      return (
        slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') + ' (Service)'
      );
    }
    if (path.startsWith('/resources/blog/') || path.startsWith('/blog/')) {
      return 'Blog Article';
    }
    if (path.startsWith('/packages')) return 'Packages & Pricing';
    if (path.startsWith('/contact')) return 'Contact & Offices';
    return path;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Website Visitor Analytics
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Privacy-centric traffic intelligence, daily unique visitors, and page view metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero PII / IP Tracking</span>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAnalytics}
            className="text-xs text-rose-200 underline font-medium hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today Unique Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Today Visitors
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.today.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Unique IP-safe clients</span>
          </div>
        </div>

        {/* Today Page Views */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Today Page Views
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.today.pageViews || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total pages rendered</div>
        </div>

        {/* Yesterday Unique Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Yesterday
            </span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-200 tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.yesterday.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.yesterday.pageViews || 0} page views
          </div>
        </div>

        {/* Last 7 Days */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Last 7 Days
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.last7Days.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.last7Days.pageViews || 0} total views
          </div>
        </div>

        {/* Last 30 Days */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Last 30 Days
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.last30Days.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.last30Days.pageViews || 0} total views
          </div>
        </div>

        {/* Total All-Time Visitors */}
        <div className="p-5 rounded-xl bg-[#0B132B] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Visitors
            </span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              (data?.totalAllTime.uniqueVisitors || 0).toLocaleString()
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.totalAllTime.pageViews || 0} all-time views
          </div>
        </div>
      </div>

      {/* Daily Visitor Trend Chart */}
      <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Daily Visitor Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily unique visitors (emerald bars) and total page views (blue overlay)
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartRange === range
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Interactive SVG Chart */}
        <div className="relative pt-6 pb-2">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mr-2" />
              <span>Loading trend metrics...</span>
            </div>
          ) : filteredTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No visitor traffic recorded yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Visits to public pages will automatically appear here
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[540px] h-64 flex flex-col justify-end">
                {/* Visual Grid Lines */}
                <div className="relative flex-1 flex items-end gap-2 sm:gap-3 border-b border-slate-800 pb-2">
                  {filteredTrend.map((day, idx) => {
                    const uvHeightPercent = Math.max(
                      (day.uniqueVisitors / maxChartValue) * 100,
                      day.uniqueVisitors > 0 ? 8 : 2
                    );
                    const pvHeightPercent = Math.max(
                      (day.pageViews / maxChartValue) * 100,
                      day.pageViews > 0 ? 8 : 2
                    );
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-14 z-20 bg-slate-900 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                            <div className="font-semibold text-slate-300">{day.label}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-emerald-400">
                                {day.uniqueVisitors} visitors
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-blue-400">{day.pageViews} views</span>
                            </div>
                          </div>
                        )}

                        {/* Dual Bar Container */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Unique Visitors Bar */}
                          <div
                            style={{ height: `${uvHeightPercent}%` }}
                            className={`w-1/2 max-w-[16px] rounded-t-sm transition-all duration-300 ${
                              isHovered
                                ? 'bg-emerald-400 shadow-md shadow-emerald-500/20'
                                : 'bg-emerald-500/80 hover:bg-emerald-400'
                            }`}
                          />
                          {/* Page Views Bar */}
                          <div
                            style={{ height: `${pvHeightPercent}%` }}
                            className={`w-1/2 max-w-[16px] rounded-t-sm transition-all duration-300 ${
                              isHovered
                                ? 'bg-blue-400 shadow-md shadow-blue-500/20'
                                : 'bg-blue-500/60 hover:bg-blue-400'
                            }`}
                          />
                        </div>

                        {/* Date Label */}
                        <div className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                          {day.label.split(',')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-6 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                    <span>Unique Visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-blue-500/70 inline-block" />
                    <span>Total Page Views</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Split Grid: Top Pages & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Visited Pages (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Most Visited Pages
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Top landing pages ranked by total view counts
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total Pages: {data?.topPages.length || 0}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Page / URL</th>
                  <th className="py-3 px-4 w-28 text-right">Views</th>
                  <th className="py-3 px-4 w-44">Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="w-4 h-4 bg-slate-800 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-48 h-4 bg-slate-800 rounded" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="w-12 h-4 bg-slate-800 rounded ml-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full h-3 bg-slate-800 rounded" />
                      </td>
                    </tr>
                  ))
                ) : data?.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                      No page traffic recorded yet.
                    </td>
                  </tr>
                ) : (
                  data?.topPages.map((page, index) => (
                    <tr key={page.path} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white text-xs sm:text-sm">
                          {formatPageTitle(page.path)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
                          {page.path}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">
                        {page.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(page.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-9 text-right font-mono">
                            {page.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Traffic Sources / Referrers (1 col) */}
        <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Traffic Referrers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acquisition sources and inbound referrers
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {isLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !data?.topReferrers || data.topReferrers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-8">
                <Globe className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Direct visits / No external referrers yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.topReferrers.map((ref) => (
                  <div
                    key={ref.referrer}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {ref.referrer}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-300 ml-2">
                      {ref.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Referrers stripped of query parameters for visitor privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
